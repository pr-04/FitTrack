const { ai, safetySettings, ThinkingLevel } = require('../config/gemini');

// Helper to sleep with promise
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a Gemini request with:
 * - Shared total deadline across retries and fallbacks
 * - Per-attempt timeout using Promise.race
 * - 503: 1 jittered retry (1-3s) on same model if deadline allows, then fallback
 * - 429: immediate switch to fallback
 * - 400 thinking error: retry without thinkingConfig
 * - 404: loud log for model not found
 * - Logs which model and attempt served the request
 */
async function executeWithResilience({
    primaryModel,
    fallbackModel,
    totalDeadlineMs,
    perAttemptTimeoutMs,
    prompt,
    systemInstruction,
    requestType,
    initialThinkingLevel = ThinkingLevel.LOW,
    maxOutputTokens = 8192
}) {
    const startTime = Date.now();
    const deadline = startTime + totalDeadlineMs;
    let currentModel = primaryModel;
    let attempt = 1;
    let hasRetriedSameModelOn503 = false;
    let useThinking = initialThinkingLevel !== undefined && initialThinkingLevel !== null;

    while (Date.now() < deadline) {
        const remainingTime = deadline - Date.now();
        if (remainingTime <= 1000) {
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
            // Parse directly, removing markdown backticks if returned
            const cleanText = rawText.replace(/```json|```/g, '').trim();
            const parsedData = JSON.parse(cleanText);

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

            // 1. Check for 400 thinking config rejection
            const is400Thinking = (err.status === 400 || errMsg.includes('400')) && useThinking;
            if (is400Thinking) {
                console.warn(`[AI] Model '${currentModel}' rejected thinkingConfig with HTTP 400 on attempt ${attempt}. Retrying without thinkingConfig...`);
                useThinking = false;
                attempt++;
                continue;
            }

            // 2. Check for 404 model not found
            const is404 = err.status === 404 || errMsg.includes('404') || errMsg.includes('NOT_FOUND');
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

            // 3. Check for 429 quota / rate limit -> Switch immediately to fallback
            const is429 = err.status === 429 || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
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

            // 4. Check for 503 high demand or timeout
            const is503 = err.status === 503 || errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand');
            const isTimeout = errMsg.includes('ATTEMPT_TIMEOUT');

            if (is503 || isTimeout) {
                const reason = isTimeout ? 'timeout' : '503 high demand';
                const timeRemaining = deadline - Date.now();

                // (a) Try 1 jittered retry on same model if time remains
                if (!hasRetriedSameModelOn503 && timeRemaining > (perAttemptTimeoutMs + 1000)) {
                    const jitter = Math.floor(1000 + Math.random() * 2000); // 1-3s jitter
                    console.warn(`[AI] Model '${currentModel}' encountered ${reason} on attempt ${attempt}. Retrying same model in ${jitter}ms...`);
                    await sleep(jitter);
                    hasRetriedSameModelOn503 = true;
                    attempt++;
                    continue;
                }

                // (b) Try fallback model if configured
                if (fallbackModel && currentModel !== fallbackModel && timeRemaining > 2000) {
                    console.warn(`[AI] Model '${currentModel}' exhausted retry on attempt ${attempt}. Switching to fallback model '${fallbackModel}'...`);
                    currentModel = fallbackModel;
                    attempt++;
                    hasRetriedSameModelOn503 = false;
                    continue;
                }

                throw new Error(`SERVICE_UNAVAILABLE: Model '${currentModel}' experiencing high demand or timed out.`);
            }

            // 5. Safety filter
            if (errMsg === 'SAFETY_FILTER_BLOCKED') {
                throw new Error('SAFETY_FILTER_BLOCKED');
            }

            // 6. JSON Parse failure
            if (err instanceof SyntaxError) {
                console.error(`[AI] JSON Parse Failure on attempt ${attempt} from model '${currentModel}':`, errMsg);
                // If time allows and we have a fallback, try fallback
                if (fallbackModel && currentModel !== fallbackModel && (deadline - Date.now() > 2000)) {
                    console.log(`[AI] Retrying with fallback model '${fallbackModel}' due to JSON parse error...`);
                    currentModel = fallbackModel;
                    attempt++;
                    continue;
                }
                throw new Error(`PARSE_FAILURE: Could not parse response from ${currentModel}.`);
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

    throw new Error(`AI_DEADLINE_EXCEEDED: Completed all attempts within ${totalDeadlineMs}ms without success.`);
}

/**
 * Generate a 7-day workout plan
 */
async function generateWorkoutPlan({ goal, fitnessLevel }) {
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || null;

    const userGoal = goal || 'maintain';
    const userLevel = fitnessLevel || 'moderate';

    const prompt = `
Create a professional 7-day workout plan for a user with the goal: ${userGoal.replace('_', ' ')}.
Fitness Level: ${userLevel}

Special Instructions for Goals:
- Flexibility: Focus on yoga, static stretching, and mobility routines.
- Endurance: Focus on zone 2 cardio, long-distance running/cycling, and high-rep endurance circuits.
- Strength: Focus on heavy compound lifts, low reps (1-5), and longer rest periods.
- Body Recomposition: Balance resistance training with minimal cardio and focus on bodyweight/weighted movements.
- Fat Loss: High-intensity interval training (HIIT) paired with steady-state cardio.
- Muscle Gain: Hypertrophy focus (8-12 reps) with progressive overload.
- General Fitness: A balanced mix of cardio and resistance training.
- Maintain: Steady maintenance routine to keep current fitness levels.

JSON Schema:
{
  "plan": {
    "title": "ELITE PERFORMANCE: [Title]",
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
Ensure exactly 7 days are included.
`;

    const systemInstruction = 'You are an elite AI performance coach for FitTrack Premium. Your mission is to architect high-depth, strictly structured 7-day training programs. You must output ONLY valid JSON that conforms to the user requested schema. Never include conversational text before or after the JSON.';

    // Deadlines: 30s total budget, 15s per attempt
    const result = await executeWithResilience({
        primaryModel,
        fallbackModel,
        totalDeadlineMs: 30000,
        perAttemptTimeoutMs: 15000,
        prompt,
        systemInstruction,
        requestType: 'Workout Plan',
        initialThinkingLevel: ThinkingLevel.LOW,
        maxOutputTokens: 8192
    });

    const rawPlan = result.data.plan || result.data;
    const finalPlan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;
    return { plan: finalPlan, model: result.model };
}

/**
 * Generate a personalized daily nutrition blueprint
 */
async function generateDietPlan({ goal, dietType }) {
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || null;

    const userGoal = goal || 'maintain';
    const userDiet = dietType || 'any';

    const prompt = `
Create a professional daily nutrition blueprint for a user with the goal: ${userGoal.replace('_', ' ')}.
Dietary Preference: ${userDiet}

Special Instructions for Goals:
- Fat Loss: Focus on a caloric deficit, high volume low calorie foods, and high protein.
- Muscle Gain: Focus on a caloric surplus with high protein (1.8g-2.2g per kg) and complex carbs.
- Body Recomposition: Focus on maintenance calories with very high protein and timing carbs around workouts.
- Strength & Endurance: Focus on high carbohydrate intake for glycogen replenishment.
- Flexibility & General Fitness: Focus on micronutrient density, anti-inflammatory foods, and balanced macros.
- Maintain: Focus on balanced macros to stay at current weight.

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

    const systemInstruction = 'You are an expert AI nutritionist for FitTrack Premium. Your mission is to architect high-depth, strictly structured daily nutrition blueprints. You must output ONLY valid JSON that conforms to the user requested schema. Never include conversational text before or after the JSON. Focus on macronutrient balance and premium, varied food suggestions.';

    // Deadlines: 30s total budget, 15s per attempt
    const result = await executeWithResilience({
        primaryModel,
        fallbackModel,
        totalDeadlineMs: 30000,
        perAttemptTimeoutMs: 15000,
        prompt,
        systemInstruction,
        requestType: 'Diet Blueprint',
        initialThinkingLevel: ThinkingLevel.LOW,
        maxOutputTokens: 8192
    });

    const rawPlan = result.data.plan || result.data;
    const finalPlan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;
    return { plan: finalPlan, model: result.model };
}

/**
 * Real-time nutrition estimation for arbitrary food item
 */
async function lookupNutrition(query) {
    const primaryModel = process.env.GEMINI_LOOKUP_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || null;

    const prompt = `
Estimate the nutritional value for: ${query}

Return JSON in this format:
{
    "calories": number,
    "protein": number,
    "carbs": number,
    "fats": number
}
`;

    const systemInstruction = 'You are a precise nutrition database for FitTrack Premium. Given a food name and amount (weight/quantity), provide estimated calories, protein, carbs, and fats. Output MUST be ONLY valid JSON matching the schema. No conversational text.';

    // Deadlines: 10s total budget, 6s per attempt
    const result = await executeWithResilience({
        primaryModel,
        fallbackModel,
        totalDeadlineMs: 10000,
        perAttemptTimeoutMs: 6000,
        prompt,
        systemInstruction,
        requestType: 'Nutrition Lookup',
        initialThinkingLevel: undefined, // No thinking needed for instant lookups
        maxOutputTokens: 1024
    });

    const d = result.data;
    const calories = Math.round(Number(d.calories) || 0);
    // Keep 1 decimal place for macros
    const protein = Math.round((Number(d.protein) || 0) * 10) / 10;
    const carbs = Math.round((Number(d.carbs) || 0) * 10) / 10;
    const fats = Math.round((Number(d.fats) || 0) * 10) / 10;

    // Soft check: calories roughly match 4P + 4C + 9F
    const expectedCalories = (protein * 4) + (carbs * 4) + (fats * 9);
    if (calories > 0 && Math.abs(expectedCalories - calories) / calories > 0.15) {
        console.warn(`[AI Warning] Macro calorie mismatch for '${query}': calories=${calories}, but 4P + 4C + 9F = ${expectedCalories.toFixed(1)} (difference > 15%).`);
    }

    return {
        name: query,
        calories,
        protein,
        carbs,
        fats,
        model: result.model
    };
}

module.exports = {
    generateWorkoutPlan,
    generateDietPlan,
    lookupNutrition,
    executeWithResilience
};
