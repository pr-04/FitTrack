const path = require('path');
module.paths.push(path.join(__dirname, '../../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../../server/.env') });

const { NutritionCache, normalizeCacheKey } = require('../models/NutritionCache');
const geminiConfig = require('../config/gemini');
const { lookupNutrition } = require('../services/aiService');

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

// Preserve original methods
const originalFindOne = NutritionCache.findOne;
const originalUpdateOne = NutritionCache.updateOne;
const originalGenerateContent = geminiConfig.ai.models.generateContent;

async function runCacheTests() {
    console.log("=== RUNNING NUTRITION CACHE UNIT TESTS (STUBBED IN-MEMORY) ===");

    // Test 1: TTL Index definition check (2,592,000 seconds = 30 days)
    const createdAtPath = NutritionCache.schema.paths.createdAt;
    const ttlSeconds = createdAtPath ? createdAtPath.options.expires : null;
    assert(ttlSeconds === 2592000, `TTL index is defined at 2,592,000 seconds (30 days)`);

    // Test 2: Key Normalization check ("2 Boiled  Eggs" vs "2 boiled eggs")
    const key1 = normalizeCacheKey("2 Boiled  Eggs!");
    const key2 = normalizeCacheKey("2 boiled eggs");
    assert(key1 === "2 boiled eggs" && key1 === key2, `'2 Boiled  Eggs!' and '2 boiled eggs' normalize to exact same key '${key1}'`);

    // Test 3: Miss then Hit calls the AI ONCE
    try {
        let inMemoryStore = new Map();
        let aiCallCount = 0;

        geminiConfig.ai.models.generateContent = async () => {
            aiCallCount++;
            const foodData = { isFood: true, calories: 155, protein: 12.6, carbs: 1.1, fats: 10.6 };
            return {
                candidates: [{ content: { parts: [{ text: JSON.stringify(foodData) }] } }],
                text: JSON.stringify(foodData)
            };
        };

        NutritionCache.findOne = async ({ key }) => {
            if (inMemoryStore.has(key)) {
                return { key, result: inMemoryStore.get(key), model: 'gemini-3.5-flash-lite' };
            }
            return null;
        };

        NutritionCache.updateOne = async ({ key }, updateObj) => {
            const data = updateObj.$setOnInsert;
            if (data) {
                inMemoryStore.set(key, data.result);
            }
            return { acknowledged: true };
        };

        // Call 1 (Miss -> Calls AI)
        const res1 = await lookupNutrition("2 boiled eggs");
        assert(res1.source === 'ai' && res1.calories === 155 && aiCallCount === 1, "First lookup is cache miss (calls AI once)");

        // Call 2 (Hit -> Served from Cache without calling AI)
        const res2 = await lookupNutrition("2 Boiled  Eggs");
        assert(res2.source === 'cache' && res2.calories === 155 && aiCallCount === 1, "Second lookup with extra spaces/caps is cache hit (calls AI 0 times)");

    } catch (err) {
        assert(false, `Test 3 failed: ${err.message}`);
    }

    // Test 4: Failures and >5000 kcal lookups are NOT cached
    try {
        let cachedKeys = new Set();
        NutritionCache.findOne = async () => null; // Always miss
        NutritionCache.updateOne = async ({ key }) => {
            cachedKeys.add(key);
            return { acknowledged: true };
        };

        // (a) COULD_NOT_ESTIMATE failure
        geminiConfig.ai.models.generateContent = async () => {
            return { candidates: [{ content: { parts: [{ text: JSON.stringify({ isFood: false }) }] } }], text: JSON.stringify({ isFood: false }) };
        };

        try {
            await lookupNutrition("a brick");
        } catch (err) {
            // Expected
        }
        assert(!cachedKeys.has("a brick"), "COULD_NOT_ESTIMATE failure is NOT cached");

        // (b) >5000 kcal item
        geminiConfig.ai.models.generateContent = async () => {
            const hugeData = { isFood: true, calories: 180000, protein: 3500, carbs: 39000, fats: 1500 };
            return { candidates: [{ content: { parts: [{ text: JSON.stringify(hugeData) }] } }], text: JSON.stringify(hugeData) };
        };

        const hugeRes = await lookupNutrition("50 kg rice");
        assert(hugeRes.needsConfirmation === true && !cachedKeys.has("50 kg rice"), "Results over 5000 kcal are NOT cached");

    } catch (err) {
        assert(false, `Test 4 failed: ${err.message}`);
    }

    // Test 5: Duplicate-key race condition (E11000) does not throw or fail request
    try {
        NutritionCache.findOne = async () => null; // Miss
        NutritionCache.updateOne = async () => {
            const err = new Error("E11000 duplicate key error collection: test.nutritioncaches index: key_1 dup key");
            err.code = 11000;
            throw err;
        };

        geminiConfig.ai.models.generateContent = async () => {
            const foodData = { isFood: true, calories: 100, protein: 2, carbs: 20, fats: 1 };
            return { candidates: [{ content: { parts: [{ text: JSON.stringify(foodData) }] } }], text: JSON.stringify(foodData) };
        };

        const raceRes = await lookupNutrition("apple");
        assert(raceRes.calories === 100 && raceRes.source === 'ai', "E11000 duplicate-key race condition is handled quietly without throwing");
    } catch (err) {
        assert(false, `Test 5 failed: ${err.message}`);
    }

    // Restore original methods
    NutritionCache.findOne = originalFindOne;
    NutritionCache.updateOne = originalUpdateOne;
    geminiConfig.ai.models.generateContent = originalGenerateContent;

    console.log(`\n=== NUTRITION CACHE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
    if (failed > 0) process.exit(1);
}

runCacheTests();
