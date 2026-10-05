const { ai, safetySettings, ThinkingLevel } = require('../config/gemini');
const { workoutPlanSchema, dietPlanSchema } = require('../validators/planSchemas');
const { NutritionCache, normalizeCacheKey } = require('../models/NutritionCache');
const { normalizeGoal, normalizeDietType, normalizeWorkoutLocation } = require('../utils/enums');
const { calculateTargets, buildProfileLines } = require('../utils/targets');

// Helper to sleep with promise
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sanitizes a raw string by stripping PII and API keys, truncating to 500 characters.
 */
function sanitizeForLogging(str) {
    if (typeof str !== 'string') str = String(str || '');
    // Strip API keys (e.g. AIza...)
    let sanitized = str.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]');
    // Strip generic key query parameters
    sanitized = sanitized.replace(/key=[a-zA-Z0-9_-]+/g, 'key=[REDACTED_KEY]');
    // Strip user email addresses
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
    return sanitized.slice(0, 500);
}

/**
 * Executes a Gemini request with:
 * - Shared total deadline across retries and fallbacks
 * - Per-attempt timeout using Promise.race
 * - Schema validation & clamping with 1 retry on parse/validation failure
 * - 503: 1 jittered retry (1-3s) on same model if deadline allows, then fallback
 * - 429: immediate switch to fallback
 * - 400 thinking error: retry without thinkingConfig
 * - 404: loud log for model not found
 * - Logs raw output truncated to 500 characters (sanitized) on final failure
 */
async function executeWithResilience({
    primaryModel,
    fallbackModel,
    totalDeadlineMs,
    perAttemptTimeoutMs,
    prompt,
    systemInstruction,
    requestType,
    schema,
    initialThinkingLevel = ThinkingLevel.LOW,
    maxOutputTokens = 8192
}) {
    const startTime = Date.now();
    const deadline = startTime + totalDeadlineMs;
    let currentModel = primaryModel;
    let attempt = 1;
    let hasRetriedSameModelOn503 = false;
    let hasRetriedOnValidationFailure = false;
    let useThinking = initialThinkingLevel !== undefined && initialThinkingLevel !== null;
    let lastRawText = '';

    while (Date.now() < deadline) {
        const remainingTime = deadline - Date.now();
        if (remainingTime <= 1000) {
            if (lastRawText) {
                console.error(`[AI CRITICAL] Final budget exhausted. Raw model output (truncated 500 chars):\n${sanitizeForLogging(lastRawText)}`);
            }
            throw new Error(`AI_DEADLINE_EXCEEDED: Total budget of ${totalDeadlineMs}ms exhausted across ${attempt} attempt(s).`);
        }

        const attemptTimeoutMs = Math.min(perAttemptTimeoutMs, remainingTime);

        // Build config
        const config = {
            systemInstruction,
            responseMimeType: 'application/json',
            maxOutputTokens,
            safetySettings
        };
        if (useThinking) {
            config.thinkingConfig = { thinkingLevel: initialThinkingLevel };
        }

        let timeoutHandle;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => {
                reject(new Error(`ATTEMPT_TIMEOUT_${attemptTimeoutMs}ms`));
            }, attemptTimeoutMs);
        });

        const attemptStart = Date.now();
        try {
            const apiCall = ai.models.generateContent({
                model: currentModel,
                contents: prompt,
                config
            });

            const response = await Promise.race([apiCall, timeoutPromise]);
            clearTimeout(timeoutHandle);

            if (!response.candidates || response.candidates.length === 0) {
                throw new Error('SAFETY_FILTER_BLOCKED');
            }

            const rawText = response.text || '';
            lastRawText = rawText;
            const cleanText = rawText.replace(/```json|```/g, '').trim();

            let parsedData;
            try {
                parsedData = JSON.parse(cleanText);
            } catch (parseErr) {
                console.warn(`[AI Parse Warning] JSON parse failed on attempt ${attempt} from model '${currentModel}'.`);
                throw new Error(`JSON_PARSE_ERROR: ${parseErr.message}`);
            }

            // Schema Validation & Value Clamping
            if (schema) {
                const targetObj = (parsedData && parsedData.plan) ? parsedData.plan : parsedData;
                const valResult = schema.safeParse(targetObj);
                if (!valResult.success) {
                    const issuesMsg = valResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
                    console.warn(`[AI Validation Warning] Schema validation failed on attempt ${attempt}: ${issuesMsg}`);
                    throw new Error(`VALIDATION_ERROR: ${issuesMsg}`);
                }
                parsedData = valResult.data;
            }

            const totalLatency = Date.now() - startTime;
            const attemptLatency = Date.now() - attemptStart;
            console.log(`[AI] Served ${requestType} using model '${currentModel}' on attempt ${attempt} (${attemptLatency}ms attempt, ${totalLatency}ms total)`);

            return {
                data: parsedData,
                model: currentModel,
                attempt,
                latency: totalLatency
            };
        } catch (err) {
            clearTimeout(timeoutHandle);
            const attemptLatency = Date.now() - attemptStart;
            const errMsg = err.message || '';

            // 1. Check internal sentinel errors first
            const isSentinelTimeout = /^ATTEMPT_TIMEOUT_/.test(errMsg);
            const isSentinelParse = /^JSON_PARSE_ERROR/.test(errMsg);
            const isSentinelValidation = /^VALIDATION_ERROR/.test(errMsg);
            const isSentinelSafety = errMsg === 'SAFETY_FILTER_BLOCKED';

            if (isSentinelParse || isSentinelValidation) {
                if (!hasRetriedOnValidationFailure && (deadline - Date.now() > 2000)) {
                    console.warn(`[AI] Retrying ${requestType} generation once due to output formatting/validation failure...`);
                    hasRetriedOnValidationFailure = true;
                    attempt++;
                    if (fallbackModel && currentModel !== fallbackModel) {
                        currentModel = fallbackModel;
                    }
                    continue;
                }
                console.error(`[AI CRITICAL] ${requestType} output failed validation on final attempt. Raw model output (truncated 500 chars):\n${sanitizeForLogging(lastRawText)}`);
                throw new Error(`PLAN_VALIDATION_FAILURE: Model generated invalid plan structure.`);
            }

            if (isSentinelSafety) {
                throw new Error('SAFETY_FILTER_BLOCKED');
            }

            // 2. Check for 400 thinking config rejection
            const is400Thinking = (err.status === 400 || (/\b400\b/.test(errMsg) && !isSentinelTimeout)) && useThinking;
            if (is400Thinking) {
                console.warn(`[AI] Model '${currentModel}' rejected thinkingConfig with HTTP 400 on attempt ${attempt}. Retrying without thinkingConfig...`);
                useThinking = false;
                attempt++;
                continue;
            }

            // 3. Check for 404 model not found (only if NOT a sentinel error)
            const is404 = err.status === 404 || (/\b404\b/.test(errMsg) || /\bNOT_FOUND\b/.test(errMsg));
            if (is404) {
                console.error(`[AI CRITICAL] Gemini model '${currentModel}' NOT FOUND or DEPRECATED. Please update GEMINI_MODEL in environment variables.`);
                if (fallbackModel && currentModel !== fallbackModel && (deadline - Date.now() > 2000)) {
                    console.log(`[AI] Switching from missing model '${currentModel}' to fallback '${fallbackModel}'...`);
                    currentModel = fallbackModel;
                    attempt++;
                    continue;
                }
                throw new Error(`MODEL_NOT_FOUND: Gemini model '${currentModel}' is not available.`);
            }

            // 4. Check for 429 quota / rate limit -> Switch immediately to fallback
            const is429 = err.status === 429 || (/\b429\b/.test(errMsg) || /RESOURCE_EXHAUSTED/.test(errMsg) || /\bquota\b/i.test(errMsg));
            if (is429) {
                console.warn(`[AI] Model '${currentModel}' returned 429 (quota/rate limit) on attempt ${attempt} (${attemptLatency}ms).`);
                if (fallbackModel && currentModel !== fallbackModel && (deadline - Date.now() > 2000)) {
                    console.log(`[AI] Switching immediately to fallback model '${fallbackModel}'...`);
                    currentModel = fallbackModel;
                    attempt++;
                    hasRetriedSameModelOn503 = false;
                    continue;
                }
                throw new Error(`QUOTA_EXHAUSTED: Model '${currentModel}' rate limited and no fallback available.`);
            }

            // 5. Check for 503 high demand or timeout
            const is503 = err.status === 503 || (/\b503\b/.test(errMsg) || /UNAVAILABLE/.test(errMsg) || /high demand/i.test(errMsg));
            const isTimeout = isSentinelTimeout || errMsg.includes('ATTEMPT_TIMEOUT');

            if (is503 || isTimeout) {
                const reason = isTimeout ? 'timeout' : '503 high demand';
                const timeRemaining = deadline - Date.now();

                if (!hasRetriedSameModelOn503 && timeRemaining > (perAttemptTimeoutMs + 1000)) {
                    const jitter = Math.floor(1000 + Math.random() * 2000);
                    console.warn(`[AI] Model '${currentModel}' encountered ${reason} on attempt ${attempt}. Retrying same model in ${jitter}ms...`);
                    await sleep(jitter);
                    hasRetriedSameModelOn503 = true;
                    attempt++;
                    continue;
                }

                if (fallbackModel && currentModel !== fallbackModel && timeRemaining > 2000) {
                    console.warn(`[AI] Model '${currentModel}' exhausted retry on attempt ${attempt}. Switching to fallback model '${fallbackModel}'...`);
                    currentModel = fallbackModel;
                    attempt++;
                    hasRetriedSameModelOn503 = false;
                    continue;
                }

                throw new Error(`SERVICE_UNAVAILABLE: Model '${currentModel}' experiencing high demand or timed out.`);
            }

            // Any other error
            console.error(`[AI] Unexpected error on attempt ${attempt} (${currentModel}):`, errMsg);
            if (fallbackModel && currentModel !== fallbackModel && (deadline - Date.now() > 2000)) {
                currentModel = fallbackModel;
                attempt++;
                continue;
            }
            throw err;
        }
    }

    if (lastRawText) {
        console.error(`[AI CRITICAL] All attempts exhausted. Raw model output (truncated 500 chars):\n${sanitizeForLogging(lastRawText)}`);
    }
    throw new Error(`AI_DEADLINE_EXCEEDED: Completed all attempts within ${totalDeadlineMs}ms without success.`);
}

/**
 * Generate a 7-day workout plan
 */
async function generateWorkoutPlan(userProfile = {}) {
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || null;

    const profileLines = buildProfileLines(userProfile);
    const profileSummary = profileLines.length > 0 ? profileLines.join('\n') : 'User Profile: Not specified';

    const normLoc = normalizeWorkoutLocation(userProfile.workoutLocation) || 'gym';
    const cleanActivity = typeof userProfile.activityLevel === 'string' ? userProfile.activityLevel.trim().toLowerCase() : 'moderate';

    let equipmentRule = 'Equipment rules: Gym workout - full equipment available (barbells, dumbbells, machines, cables).';
    if (normLoc === 'home') {
        equipmentRule = 'Equipment rules: Home workout - bodyweight, dumbbells, and resistance bands only. Absolutely NO machines or heavy gym apparatus.';
    }

    let activityGuideline = '';
    if (cleanActivity === 'sedentary' || cleanActivity === 'light') {
        activityGuideline = 'Intensity & Volume: User has low activity level (sedentary/light). Provide lower training volume and low-impact exercise options to prevent overexertion or injury.';
    }

    const prompt = `
Create a professional 7-day workout plan tailored to the user profile below.

User Profile:
${profileSummary}

${equipmentRule}
${activityGuideline}

Special Reps Formatting Instructions:
- For rep-based exercises, specify "reps" as a plain number or range (e.g., "12" or "8-10").
- For timed/distance exercises, specify "reps" with a duration or distance descriptor (e.g., "45 sec", "30 min", or "500 m").
- NEVER duplicate the unit (e.g., write "45 sec", NOT "45 sec sec").

JSON Schema:
{
  "plan": {
    "title": "[Title]",
    "overview": "[Strategy summary]",
    "days": [
      {
        "day": "Day 1",
        "type": "[Focus]",
        "exercises": [
          { "name": "[Name]", "sets": number, "reps": "string", "rest": "string" }
        ]
      }
    ]
  }
}
Ensure EXACTLY 7 days are included (Day 1 through Day 7).
`;

    const systemInstruction = 'You are an AI performance coach for FitTrack. Your mission is to generate structured 7-day training programs. You must output ONLY valid JSON that conforms to the user requested schema with exactly 7 days. Never include conversational text before or after the JSON.';

    // Deadlines: 30s total budget, 15s per attempt
    const result = await executeWithResilience({
        primaryModel,
        fallbackModel,
        totalDeadlineMs: 30000,
        perAttemptTimeoutMs: 15000,
        prompt,
        systemInstruction,
        requestType: 'Workout Plan',
        schema: workoutPlanSchema,
        initialThinkingLevel: ThinkingLevel.LOW,
        maxOutputTokens: 8192
    });

    return { plan: result.data, model: result.model };
}

/**
 * Generate a personalized daily nutrition blueprint
 */
async function generateDietPlan(userProfile = {}) {
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || null;

    const profileLines = buildProfileLines(userProfile);
    const profileSummary = profileLines.length > 0 ? profileLines.join('\n') : 'User Profile: Not specified';

    const calculated = calculateTargets(userProfile);
    let targetInstructions = '';
    if (calculated) {
        targetInstructions = `
Exact Target Calories: ${calculated.dailyCalories} kcal
Exact Target Macros: Protein ${calculated.macros.protein}, Carbs ${calculated.macros.carbs}, Fats ${calculated.macros.fats}
Meal Sizing Requirement: Size the meal options so ONE option per meal category (Breakfast, Lunch, Snacks, Dinner) totals roughly the target daily calories (${calculated.dailyCalories} kcal) and strictly respects dietary preference.
`;
    }

    const prompt = `
Create a professional daily nutrition blueprint tailored to the user profile below.

User Profile:
${profileSummary}

${targetInstructions}

JSON Schema:
{
  "plan": {
    "dailyCalories": number,
    "macros": { "protein": "string", "carbs": "string", "fats": "string" },
    "meals": {
        "Breakfast": ["Option 1", "Option 2"],
        "Lunch": ["Option 1", "Option 2"],
        "Snacks": ["Option 1", "Option 2"],
        "Dinner": ["Option 1", "Option 2"]
    }
  }
}
ONLY include the 4 categories: "Breakfast", "Lunch", "Snacks", "Dinner".
`;

    const systemInstruction = 'You are an AI nutritionist for FitTrack. Your mission is to generate structured daily nutrition blueprints. You must output ONLY valid JSON that conforms to the user requested schema. Never include conversational text before or after the JSON. Focus on macronutrient balance and varied food suggestions.';

    // Deadlines: 30s total budget, 15s per attempt
    const result = await executeWithResilience({
        primaryModel,
        fallbackModel,
        totalDeadlineMs: 30000,
        perAttemptTimeoutMs: 15000,
        prompt,
        systemInstruction,
        requestType: 'Diet Blueprint',
        schema: dietPlanSchema,
        initialThinkingLevel: ThinkingLevel.LOW,
        maxOutputTokens: 8192
    });

    const plan = result.data;
    if (calculated) {
        plan.dailyCalories = calculated.dailyCalories;
        plan.macros = calculated.macros;
    }

    return { plan, model: result.model };
}

/**
 * Real-time nutrition estimation for arbitrary food item with 30-day NutritionCache
 */
async function lookupNutrition(query) {
    if (!query || typeof query !== 'string' || !query.trim()) {
        throw new Error('COULD_NOT_ESTIMATE');
    }
    const cleanQuery = query.trim();
    const cacheKey = normalizeCacheKey(cleanQuery);

    // 1. Cache Lookup
    try {
        const cachedDoc = await NutritionCache.findOne({ key: cacheKey });
        if (cachedDoc && cachedDoc.result) {
            const c = cachedDoc.result;
            const calories = Math.round(Number(c.calories) || 0);
            const needsConfirmation = calories > 5000;
            console.log(`[NutritionCache HIT] '${cleanQuery}' (key: '${cacheKey}') served from cache.`);
            return {
                name: cleanQuery,
                calories,
                protein: Number(c.protein) || 0,
                carbs: Number(c.carbs) || 0,
                fats: Number(c.fats) || 0,
                needsConfirmation,
                source: 'cache',
                model: cachedDoc.model || 'cache'
            };
        }
    } catch (cacheErr) {
        console.warn(`[NutritionCache Read Warning] Cache lookup failed: ${cacheErr.message}`);
    }

    // 2. Cache Miss -> Call Gemini API
    const primaryModel = process.env.GEMINI_LOOKUP_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || null;

    const prompt = `
Evaluate and estimate the nutritional value for: "${cleanQuery}"

Instructions:
- Determine if "${cleanQuery}" represents a genuine edible food, beverage, ingredient, or dish (in any language).
- If "${cleanQuery}" is non-food (e.g. "a brick", "wood"), gibberish (e.g. "asdf qwer"), empty, or un-estimatable, set "isFood" to false and all macros to 0.
- If it is valid food, set "isFood" to true and estimate calories, protein, carbs, and fats.

JSON Schema:
{
    "isFood": boolean,
    "calories": number,
    "protein": number,
    "carbs": number,
    "fats": number
}
`;

    const systemInstruction = 'You are a precise nutrition analyzer for FitTrack. Analyze whether input queries represent edible food or non-food/gibberish. Output MUST be strictly valid JSON matching the schema. No conversational text.';

    // Deadlines: 10s total budget, 6s per attempt
    const result = await executeWithResilience({
        primaryModel,
        fallbackModel,
        totalDeadlineMs: 10000,
        perAttemptTimeoutMs: 6000,
        prompt,
        systemInstruction,
        requestType: 'Nutrition Lookup',
        initialThinkingLevel: undefined,
        maxOutputTokens: 1024
    });

    const d = result.data;
    if (d.isFood === false) {
        throw new Error('COULD_NOT_ESTIMATE');
    }

    const clampVal = (val) => {
        const num = Number(val);
        if (!isFinite(num) || num < 0) return 0;
        return num;
    };

    const calories = Math.round(clampVal(d.calories));
    const protein = Math.round(clampVal(d.protein) * 10) / 10;
    const carbs = Math.round(clampVal(d.carbs) * 10) / 10;
    const fats = Math.round(clampVal(d.fats) * 10) / 10;

    if (calories === 0 && protein === 0 && carbs === 0 && fats === 0) {
        throw new Error('COULD_NOT_ESTIMATE');
    }

    // Soft check: calories roughly match 4P + 4C + 9F
    const expectedCalories = (protein * 4) + (carbs * 4) + (fats * 9);
    if (calories > 0 && Math.abs(expectedCalories - calories) / calories > 0.15) {
        console.warn(`[AI Warning] Macro calorie mismatch for '${cleanQuery}': calories=${calories}, but 4P + 4C + 9F = ${expectedCalories.toFixed(1)} (difference > 15%).`);
    }

    const needsConfirmation = calories > 5000;

    // 3. Upsert to Cache if valid food AND calories <= 5000
    if (!needsConfirmation && calories <= 5000) {
        try {
            await NutritionCache.updateOne(
                { key: cacheKey },
                {
                    $setOnInsert: {
                        key: cacheKey,
                        result: {
                            name: cleanQuery,
                            calories,
                            protein,
                            carbs,
                            fats
                        },
                        model: result.model
                    }
                },
                { upsert: true }
            );
        } catch (writeErr) {
            if (!writeErr.message?.includes('E11000')) {
                console.warn(`[NutritionCache Write Warning] Upsert failed: ${writeErr.message}`);
            }
        }
    }

    return {
        name: cleanQuery,
        calories,
        protein,
        carbs,
        fats,
        needsConfirmation,
        source: 'ai',
        model: result.model
    };
}

module.exports = {
    generateWorkoutPlan,
    generateDietPlan,
    lookupNutrition,
    executeWithResilience
};
