const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const { generateWorkoutPlan, generateDietPlan, lookupNutrition } = require('../server/services/aiService');

async function testGeminiSmokeTest() {
    console.log('--- STARTING GEMINI SMOKE TESTS ---');

    let passed = 0;
    let failed = 0;

    // Test 1: Workout Generation
    try {
        console.log('\n[Test 1] Testing generateWorkoutPlan...');
        const workoutRes = await generateWorkoutPlan({ goal: 'muscle_gain', fitnessLevel: 'intermediate' });
        if (workoutRes && workoutRes.plan && workoutRes.plan.days && workoutRes.plan.days.length === 7) {
            console.log(`✓ Test 1 PASSED: Generated 7-day workout plan using model '${workoutRes.model}'`);
            passed++;
        } else {
            console.error('✗ Test 1 FAILED: Invalid workout plan structure', workoutRes);
            failed++;
        }
    } catch (err) {
        console.error('✗ Test 1 FAILED with exception:', err.message);
        failed++;
    }

    // Test 2: Diet Blueprint Generation
    try {
        console.log('\n[Test 2] Testing generateDietPlan...');
        const dietRes = await generateDietPlan({ goal: 'fat_loss', dietType: 'vegetarian' });
        if (dietRes && dietRes.plan && dietRes.plan.dailyCalories && dietRes.plan.meals) {
            console.log(`✓ Test 2 PASSED: Generated diet blueprint (${dietRes.plan.dailyCalories} kcal) using model '${dietRes.model}'`);
            passed++;
        } else {
            console.error('✗ Test 2 FAILED: Invalid diet plan structure', dietRes);
            failed++;
        }
    } catch (err) {
        console.error('✗ Test 2 FAILED with exception:', err.message);
        failed++;
    }

    // Test 3: Real-Time Nutrition Lookup
    try {
        console.log('\n[Test 3] Testing lookupNutrition...');
        const nutrition = await lookupNutrition('2 boiled eggs');
        if (nutrition && nutrition.calories > 0 && nutrition.protein > 0) {
            console.log(`✓ Test 3 PASSED: '2 boiled eggs' -> ${nutrition.calories} kcal, ${nutrition.protein}g P using model '${nutrition.model}'`);
            passed++;
        } else {
            console.error('✗ Test 3 FAILED: Invalid nutrition data', nutrition);
            failed++;
        }
    } catch (err) {
        console.error('✗ Test 3 FAILED with exception:', err.message);
        failed++;
    }

    console.log(`\n=== COMMIT 1 INTEGRATION SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
    if (failed > 0) {
        process.exit(1);
    }
}

testGeminiSmokeTest();

