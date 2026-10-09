const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const geminiConfig = require('../config/gemini');
const { executeWithResilience, lookupNutrition } = require('../services/aiService');
const { workoutPlanSchema, dietPlanSchema } = require('../validators/planSchemas');
const { NutritionCache } = require('../models/NutritionCache');

describe('AI Resilience Mocked Unit Tests', () => {
    let originalGenerateContent;
    let originalFindOne;
    let originalUpdateOne;

    before(() => {
        originalGenerateContent = geminiConfig.ai.models.generateContent;
        originalFindOne = NutritionCache.findOne;
        originalUpdateOne = NutritionCache.updateOne;

        // Stub NutritionCache to prevent 10-second MongoDB buffering timeout in unit tests
        NutritionCache.findOne = async () => null;
        NutritionCache.updateOne = async () => ({});
    });

    after(() => {
        geminiConfig.ai.models.generateContent = originalGenerateContent;
        NutritionCache.findOne = originalFindOne;
        NutritionCache.updateOne = originalUpdateOne;
    });

    it('succeeds on attempt 2 when first response is invalid and second is valid', async () => {
        let callCount = 0;
        geminiConfig.ai.models.generateContent = async () => {
            callCount++;
            if (callCount === 1) {
                // Invalid response: only 1 day instead of 7
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

        assert.ok(res);
        assert.equal(res.attempt, 2);
        assert.equal(res.data.title, "ELITE 7-DAY SPLIT");
    });

    it('throws PLAN_VALIDATION_FAILURE and redacts PII when all attempts fail', async () => {
        let loggedErrorOutput = '';
        const originalConsoleError = console.error;
        console.error = (...args) => {
            loggedErrorOutput += args.join(' ') + '\n';
        };

        geminiConfig.ai.models.generateContent = async () => {
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
            assert.ok(err.message.includes('PLAN_VALIDATION_FAILURE'));
        } finally {
            console.error = originalConsoleError;
        }

        assert.ok(threwError);
        assert.ok(loggedErrorOutput.includes('[REDACTED_API_KEY]'));
        assert.equal(loggedErrorOutput.includes('AIzaSyDummyTestKeyForPIIRedactionSanitization'), false);
    });

    it('rejects non-food queries with COULD_NOT_ESTIMATE error', async () => {
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

        await assert.rejects(
            async () => {
                await lookupNutrition('a brick');
            },
            (err) => {
                return err.message === 'COULD_NOT_ESTIMATE';
            }
        );
    });

    it('degrades gracefully to AI lookup when cache findOne hangs', async () => {
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
        assert.ok(res);
        assert.equal(res.source, 'ai');
        assert.equal(res.calories, 300);
    });
});
