const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calculateTargets, buildProfileLines } = require('../utils/targets');

describe('Targets & Profile Lines Unit Tests', () => {
    it('calculateTargets returns null if weight, height or age is missing', () => {
        assert.equal(calculateTargets({ weight: 70, height: 175 }), null);
        assert.equal(calculateTargets({ age: 25, height: 175 }), null);
        assert.equal(calculateTargets({ age: 25, weight: 70 }), null);
        assert.equal(calculateTargets({}), null);
    });

    it('calculateTargets calculates Mifflin-St Jeor correctly for standard profile', () => {
        // weight: 70kg, height: 175cm, age: 25, activityLevel: 'moderate' (1.55), goal: 'maintain' (1.0)
        // bmr = 10*70 + 6.25*175 - 5*25 - 78 = 700 + 1093.75 - 125 - 78 = 1590.75
        // calories = 1590.75 * 1.55 * 1.0 = 2465.66 -> rounded to nearest 50 = 2450
        const result = calculateTargets({
            weight: 70,
            height: 175,
            age: 25,
            activityLevel: 'moderate',
            goal: 'maintain'
        });

        assert.equal(result.dailyCalories, 2450);
        assert.equal(result.macros.protein, '98g'); // 70 * 1.4 = 98g
        assert.equal(typeof result.macros.carbs, 'string');
        assert.equal(typeof result.macros.fats, 'string');
    });

    it('calculateTargets calculates correct calories and macros for sex male, female, unspecified (check 8)', () => {
        const baseProfile = {
            age: 22,
            weight: 70,
            height: 168,
            activityLevel: 'moderate',
            goal: 'fat_loss'
        };

        // Unspecified / omitted sex -> s = -78 -> 1950 kcal, 140g protein, 54g fats, 226g carbs
        const unspecifiedResult = calculateTargets({ ...baseProfile, sex: 'unspecified' });
        assert.equal(unspecifiedResult.dailyCalories, 1950);
        assert.equal(unspecifiedResult.macros.protein, '140g');
        assert.equal(unspecifiedResult.macros.fats, '54g');
        assert.equal(unspecifiedResult.macros.carbs, '226g');

        // Male -> s = +5 -> 2050 kcal
        const maleResult = calculateTargets({ ...baseProfile, sex: 'male' });
        assert.equal(maleResult.dailyCalories, 2050);

        // Female -> s = -161 -> 1850 kcal
        const femaleResult = calculateTargets({ ...baseProfile, sex: 'female' });
        assert.equal(femaleResult.dailyCalories, 1850);
    });

    it('calculateTargets clamps calories to 1200 minimum for low requirements', () => {
        const result = calculateTargets({
            weight: 35,
            height: 120,
            age: 70,
            activityLevel: 'sedentary',
            goal: 'fat_loss'
        });
        assert.equal(result.dailyCalories, 1200);
    });

    it('calculateTargets clamps calories to 5000 maximum for high requirements', () => {
        const result = calculateTargets({
            weight: 160,
            height: 210,
            age: 20,
            activityLevel: 'very_active',
            goal: 'muscle_gain'
        });
        assert.equal(result.dailyCalories, 5000);
    });

    it('buildProfileLines includes dietType, home vs gym, and omits missing fields', () => {
        const profileFull = {
            age: 30,
            weight: 80,
            height: 180,
            activityLevel: 'light',
            workoutLocation: 'Home',
            goal: 'lose_weight',
            dietType: 'veg'
        };

        const lines = buildProfileLines(profileFull);
        assert.ok(lines.includes('Age: 30 years'));
        assert.ok(lines.includes('Weight: 80 kg'));
        assert.ok(lines.includes('Height: 180 cm'));
        assert.ok(lines.includes('Workout Location: home'));
        assert.ok(lines.includes('Goal: fat loss'));
        assert.ok(lines.includes('Dietary Preference: vegetarian'));

        const profilePartial = {
            weight: 75,
            goal: 'maintain'
        };
        const linesPartial = buildProfileLines(profilePartial);
        assert.equal(linesPartial.length, 2);
        assert.ok(linesPartial.includes('Weight: 75 kg'));
        assert.ok(linesPartial.includes('Goal: maintain'));
    });
});
