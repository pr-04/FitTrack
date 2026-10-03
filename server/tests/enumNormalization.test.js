const assert = require('assert');
const path = require('path');
module.paths.push(path.join(__dirname, '../node_modules'));

const {
    normalizeWorkoutLocation,
    normalizeDietType,
    normalizeGoal,
    normalizeUserEnums,
} = require('../utils/enums');

const { updateProfileSchema, generateWorkoutSchema, generateDietSchema } = require('../validators/schemas');
const User = require('../models/User');

function testEnumNormalization() {
    console.log('Running unit tests for Step 4 (backward-compatible enum normalization)...');

    // 1. Pure Function Normalization Tests
    assert.strictEqual(normalizeWorkoutLocation('Home'), 'home');
    assert.strictEqual(normalizeWorkoutLocation('Gym'), 'gym');
    assert.strictEqual(normalizeDietType('Veg'), 'vegetarian');
    assert.strictEqual(normalizeDietType('Non-veg'), 'non-vegetarian');
    assert.strictEqual(normalizeGoal('lose_weight'), 'fat_loss');
    console.log('✔ Pure mapping functions passed');

    // 2. Validator Schema Transform Tests
    const profileParsed = updateProfileSchema.parse({
        body: {
            goal: 'lose_weight',
            dietType: 'Veg',
            workoutLocation: 'Home',
        }
    });

    assert.strictEqual(profileParsed.body.goal, 'fat_loss', 'Validator should transform lose_weight to fat_loss');
    assert.strictEqual(profileParsed.body.dietType, 'vegetarian', 'Validator should transform Veg to vegetarian');
    assert.strictEqual(profileParsed.body.workoutLocation, 'home', 'Validator should transform Home to home');

    const workoutParsed = generateWorkoutSchema.parse({
        body: {
            fitnessGoal: 'lose_weight',
            workoutLocation: 'Gym'
        }
    });
    assert.strictEqual(workoutParsed.body.fitnessGoal, 'fat_loss');
    assert.strictEqual(workoutParsed.body.workoutLocation, 'gym');

    const dietParsed = generateDietSchema.parse({
        body: {
            dietType: 'Non-veg'
        }
    });
    assert.strictEqual(dietParsed.body.dietType, 'non-vegetarian');
    console.log('✔ Validator transforms passed');

    // 3. User Schema Setters & Read-time Transformation Tests
    const legacyUserDoc = new User({
        name: 'Legacy Test User',
        email: 'legacy@example.com',
        goal: 'lose_weight',
        dietType: 'Veg',
        workoutLocation: 'Home',
    });

    // Verify setters executed upon instantiation/setting
    assert.strictEqual(legacyUserDoc.goal, 'fat_loss', 'Setter should store canonical fat_loss');
    assert.strictEqual(legacyUserDoc.dietType, 'vegetarian', 'Setter should store canonical vegetarian');
    assert.strictEqual(legacyUserDoc.workoutLocation, 'home', 'Setter should store canonical home');

    // Read-Time JSON/Object Transform Verification on raw object
    const rawLegacyObject = {
        name: 'Un-migrated User',
        email: 'unmigrated@example.com',
        goal: 'lose_weight',
        dietType: 'Veg',
        workoutLocation: 'Home',
    };
    const readNormalized = normalizeUserEnums(rawLegacyObject);
    assert.strictEqual(readNormalized.goal, 'fat_loss');
    assert.strictEqual(readNormalized.dietType, 'vegetarian');
    assert.strictEqual(readNormalized.workoutLocation, 'home');
    console.log('✔ User schema setters & read-time transforms passed');

    console.log('\nAll unit tests for Step 4 passed successfully!');
}

try {
    testEnumNormalization();
} catch (err) {
    console.error('Step 4 Unit Test Failed:', err);
    process.exit(1);
}
