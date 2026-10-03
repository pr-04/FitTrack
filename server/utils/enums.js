/**
 * Pure mapping functions for canonical User enum normalization.
 * Performs case-insensitive, trimmed matching.
 * Unknown / null / undefined values return unchanged.
 */

function normalizeWorkoutLocation(value) {
    if (typeof value !== 'string') return value;
    const clean = value.trim().toLowerCase();
    if (clean === 'home') return 'home';
    if (clean === 'gym') return 'gym';
    return value; // unknown value left unchanged
}

function normalizeDietType(value) {
    if (typeof value !== 'string') return value;
    const clean = value.trim().toLowerCase();
    if (clean === 'veg' || clean === 'vegetarian') return 'vegetarian';
    if (clean === 'non-veg' || clean === 'non-vegetarian') return 'non-vegetarian';
    if (clean === 'vegan') return 'vegan';
    if (clean === 'pescatarian') return 'pescatarian';
    if (clean === 'any') return 'any';
    return value; // unknown value left unchanged
}

function normalizeGoal(value) {
    if (typeof value !== 'string') return value;
    const clean = value.trim().toLowerCase();
    if (clean === 'lose_weight' || clean === 'fat_loss') return 'fat_loss';
    if ([
        'muscle_gain',
        'body_recomposition',
        'maintain',
        'strength',
        'endurance',
        'general_fitness',
        'flexibility'
    ].includes(clean)) {
        return clean;
    }
    return value; // unknown value left unchanged
}

/**
 * Normalize all 3 user enum fields on a user object/document.
 */
function normalizeUserEnums(userDoc) {
    if (!userDoc) return userDoc;
    const doc = userDoc.toObject ? userDoc.toObject() : { ...userDoc };

    if (doc.workoutLocation !== undefined) {
        doc.workoutLocation = normalizeWorkoutLocation(doc.workoutLocation);
    }
    if (doc.dietType !== undefined) {
        doc.dietType = normalizeDietType(doc.dietType);
    }
    if (doc.goal !== undefined) {
        doc.goal = normalizeGoal(doc.goal);
    }

    return doc;
}

module.exports = {
    normalizeWorkoutLocation,
    normalizeDietType,
    normalizeGoal,
    normalizeUserEnums,
};
