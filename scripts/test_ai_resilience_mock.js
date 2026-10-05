const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const geminiConfig = require('../server/config/gemini');
const { executeWithResilience, lookupNutrition, generateWorkoutPlan } = require('../server/services/aiService');
const { workoutPlanSchema, dietPlanSchema } = require('../server/validators/planSchemas');
const { NutritionCache } = require('../server/models/NutritionCache');

// Stub NutritionCache to prevent 10-second MongoDB buffering timeout in unit tests
NutritionCache.findOne = async () => null;
NutritionCache.updateOne = async () => ({});

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✓ PASSED: ${message}`);
        passed++;
    } else {
        console.error(`✗ FAILED: ${message}`);
        failed++;
    }
}

// Store original method
const originalGenerateContent = geminiConfig.ai.models.generateContent;

async function runMockTests() {
    console.log("=== RUNNING MOCKED MODEL RESILIENCE TESTS ===");

    // Scenario 1: First response invalid, second response valid -> expect success on attempt 2
    try {
        let callCount = 0;
        geminiConfig.ai.models.generateContent = async () => {
            callCount++;
            if (callCount === 1) {
                // Invalid response: only 2 days instead of 7
                return {
                    candidates: [{
                        content: { parts: [{ text: JSON.stringify({
                            title: "Invalid Short Plan",
                            days: [{ day: "Day 1", type: "Chest", exercises: [] }]
                        }) }] }
                    }],
                    text: JSON.stringify({
                        title: "Invalid Short Plan",
                        days: [{ day: "Day 1", type: "Chest", exercises: [] }]
                    })
                };
            } else {
                // Valid 7-day plan
                const validPlan = {
                    title: "ELITE 7-DAY SPLIT",
                    overview: "Valid strategy",
                    days: Array.from({ length: 7 }, (_, i) => ({
                        day: `Day ${i + 1}`,
                        type: "Workout",
                        exercises: [{ name: "Pushups", sets: 3, reps: "15", rest: "60s" }]
                    }))
                };
                return {
                    candidates: [{ content: { parts: [{ text: JSON.stringify(validPlan) }] } }],
                    text: JSON.stringify(validPlan)
                };
            }
        };

        const res = await executeWithResilience({
            primaryModel: 'gemini-3.5-flash-lite',
            fallbackModel: null,
            totalDeadlineMs: 10000,
            perAttemptTimeoutMs: 5000,
            prompt: 'Generate workout plan',
            systemInstruction: 'Test',
            requestType: 'Mock Workout Plan',
            schema: workoutPlanSchema
        });

        assert(res && res.attempt === 2 && res.data.title === "ELITE 7-DAY SPLIT", "First response invalid then second valid succeeds on attempt 2");
    } catch (err) {
        assert(false, `Scenario 1 failed with unexpected error: ${err.message}`);
    }

    // Scenario 2: Both responses invalid -> expect PLAN_VALIDATION_FAILURE and redacted truncated log
    try {
        let loggedErrorOutput = '';
        const originalConsoleError = console.error;
        console.error = (...args) => {
            loggedErrorOutput += args.join(' ') + '\n';
            originalConsoleError(...args);
        };

        geminiConfig.ai.models.generateContent = async () => {
            // Out-of-bounds calories (50,000) with fake API key secret string
            const badText = JSON.stringify({
                dailyCalories: 50000,
                secretKey: "AIzaSyDummyTestKeyForPIIRedactionSanitization"
            });
            return {
                candidates: [{ content: { parts: [{ text: badText }] } }],
                text: badText
            };
        };

        let threwError = false;
        try {
            await executeWithResilience({
                primaryModel: 'gemini-3.5-flash-lite',
                fallbackModel: null,
                totalDeadlineMs: 10000,
                perAttemptTimeoutMs: 5000,
                prompt: 'Generate diet plan',
                systemInstruction: 'Test',
                requestType: 'Mock Diet Blueprint',
                schema: dietPlanSchema
            });
        } catch (err) {
            threwError = true;
            assert(err.message.includes('PLAN_VALIDATION_FAILURE'), "Both responses invalid throws PLAN_VALIDATION_FAILURE (triggers 502)");
        }

        console.error = originalConsoleError;

        assert(
            threwError &&
            loggedErrorOutput.includes('[REDACTED_API_KEY]') &&
            !loggedErrorOutput.includes('AIzaSyDummyTestKeyForPIIRedactionSanitization'),
            "Final failure logs redacted & truncated raw output without API keys/PII"
        );
    } catch (err) {
        assert(false, `Scenario 2 failed with unexpected error: ${err.message}`);
    }

    // Scenario 3: isFood false -> expect COULD_NOT_ESTIMATE error
    try {
        geminiConfig.ai.models.generateContent = async () => {
            const nonFoodText = JSON.stringify({
                isFood: false,
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0
            });
            return {
                candidates: [{ content: { parts: [{ text: nonFoodText }] } }],
                text: nonFoodText
            };
        };

        let threwEstimateError = false;
        try {
            await lookupNutrition('a brick');
        } catch (err) {
            threwEstimateError = true;
            assert(err.message === 'COULD_NOT_ESTIMATE', "isFood: false throws COULD_NOT_ESTIMATE error");
        }

        assert(threwEstimateError, "Lookup non-food correctly rejected");
    } catch (err) {
        assert(false, `Scenario 3 failed with unexpected error: ${err.message}`);
    }

    // Scenario 4: NutritionCache findOne hangs indefinitely -> expect 1500ms timeout degrade to AI lookup
    try {
        NutritionCache.findOne = () => new Promise(() => {}); // never resolves
        geminiConfig.ai.models.generateContent = async () => {
            const foodText = JSON.stringify({
                isFood: true,
                calories: 300,
                protein: 20,
                carbs: 40,
                fats: 8
            });
            return {
                candidates: [{ content: { parts: [{ text: foodText }] } }],
                text: foodText
            };
        };

        const res = await lookupNutrition('hanging cache test query');
        assert(res && res.source === 'ai' && res.calories === 300, "Slow cache findOne (>1500ms) degrades gracefully to AI lookup");
    } catch (err) {
        assert(false, `Scenario 4 failed with unexpected error: ${err.message}`);
    } finally {
        NutritionCache.findOne = async () => null;
    }

    // Restore original method
    geminiConfig.ai.models.generateContent = originalGenerateContent;

    console.log(`\n=== MOCKED RESILIENCE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
    if (failed > 0) process.exit(1);
}

runMockTests();
