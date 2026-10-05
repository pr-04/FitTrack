const { normalizeWorkoutLocation, normalizeDietType, normalizeGoal } = require('./enums');

/**
 * Computes calorie target and macros using Mifflin-St Jeor formula.
 * s constant: +5 for male, -161 for female, -78 for unspecified/missing (midpoint of +5 and -161 constants).
 */
function calculateTargets(profile = {}) {
    const { weight, height, age, activityLevel, goal, sex } = profile;

    const numWeight = Number(weight);
    const numHeight = Number(height);
    const numAge = Number(age);

    if (!numWeight || !numHeight || !numAge || numWeight <= 0 || numHeight <= 0 || numAge <= 0) {
        return null; // missing or invalid biometrics -> keep model-chosen behavior
    }

    // Mifflin-St Jeor: 10*kg + 6.25*cm - 5*age + s
    // s = +5 for male, -161 for female, -78 for unspecified or missing (midpoint of male +5 and female -161)
    const cleanSex = typeof sex === 'string' ? sex.trim().toLowerCase() : 'unspecified';
    let s = -78; // default midpoint
    if (cleanSex === 'male') {
        s = 5;
    } else if (cleanSex === 'female') {
        s = -161;
    }

    const bmr = (10 * numWeight) + (6.25 * numHeight) - (5 * numAge) + s;

    // Activity Multiplier
    const cleanActivity = typeof activityLevel === 'string' ? activityLevel.trim().toLowerCase() : '';
    let activityMultiplier = 1.55; // default moderate
    if (cleanActivity === 'sedentary') activityMultiplier = 1.2;
    else if (cleanActivity === 'light') activityMultiplier = 1.375;
    else if (cleanActivity === 'moderate') activityMultiplier = 1.55;
    else if (cleanActivity === 'active') activityMultiplier = 1.725;
    else if (cleanActivity === 'very_active') activityMultiplier = 1.9;

    // Goal Factor
    const normGoal = normalizeGoal(goal) || 'maintain';
    let goalFactor = 1.0;
    if (normGoal === 'fat_loss') goalFactor = 0.80;
    else if (normGoal === 'muscle_gain') goalFactor = 1.10;
    else if (normGoal === 'body_recomposition') goalFactor = 0.95;

    // Daily Calories: round to nearest 50 and clamp to 1200 - 5000
    const rawCalories = bmr * activityMultiplier * goalFactor;
    const rounded = Math.round(rawCalories / 50) * 50;
    const dailyCalories = Math.min(5000, Math.max(1200, rounded));

    // Macros
    let proteinPerKg = 1.4;
    if (normGoal === 'fat_loss' || normGoal === 'body_recomposition') {
        proteinPerKg = 2.0;
    } else if (normGoal === 'muscle_gain') {
        proteinPerKg = 1.8;
    }

    const proteinG = Math.round(numWeight * proteinPerKg);
    const proteinCal = proteinG * 4;

    // Fats = 25% of daily calories
    const fatCal = dailyCalories * 0.25;
    const fatG = Math.round(fatCal / 9);

    // Carbs = remainder of calories
    const carbCal = Math.max(0, dailyCalories - proteinCal - (fatG * 9));
    const carbG = Math.round(carbCal / 4);

    return {
        dailyCalories,
        macros: {
            protein: `${proteinG}g`,
            carbs: `${carbG}g`,
            fats: `${fatG}g`
        }
    };
}

/**
 * Builds user profile lines for prompt injection from user profile object.
 * Missing fields are omitted instead of failing.
 */
function buildProfileLines(profile = {}) {
    const lines = [];

    if (profile.age !== undefined && profile.age !== null && profile.age !== '') {
        lines.push(`Age: ${profile.age} years`);
    }
    if (profile.weight !== undefined && profile.weight !== null && profile.weight !== '') {
        lines.push(`Weight: ${profile.weight} kg`);
    }
    if (profile.height !== undefined && profile.height !== null && profile.height !== '') {
        lines.push(`Height: ${profile.height} cm`);
    }
    if (profile.sex && profile.sex !== 'unspecified') {
        lines.push(`Sex: ${profile.sex}`);
    }
    if (profile.activityLevel) {
        lines.push(`Activity Level: ${profile.activityLevel}`);
    }
    if (profile.workoutLocation) {
        const normLoc = normalizeWorkoutLocation(profile.workoutLocation);
        lines.push(`Workout Location: ${normLoc}`);
    }
    if (profile.goal) {
        const normGoal = normalizeGoal(profile.goal);
        lines.push(`Goal: ${normGoal ? normGoal.replace(/_/g, ' ') : profile.goal}`);
    }
    if (profile.dietType) {
        const normDiet = normalizeDietType(profile.dietType);
        lines.push(`Dietary Preference: ${normDiet}`);
    }

    return lines;
}

module.exports = {
    calculateTargets,
    buildProfileLines
};
