const {
    normalizeWorkoutLocation,
    normalizeDietType,
    normalizeGoal,
} = require('./enums');

/**
 * Formats a user object for API responses using an explicit allowlist.
 * Never includes sensitive internal fields such as password or __v.
 *
 * @param {Object} user - Mongoose User document or plain JS object
 * @param {string} [token] - Optional JWT token string to include at top-level
 * @returns {Object} Cleaned, explicit user response object
 */
function formatUserResponse(user, token = null) {
    if (!user) return null;

    const rawObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };

    const isOnboarded = rawObj.isOnboarded !== undefined
        ? Boolean(rawObj.isOnboarded)
        : Boolean(rawObj.age && rawObj.weight && rawObj.height);

    const response = {
        _id: rawObj._id,
        name: rawObj.name !== undefined ? rawObj.name : null,
        email: rawObj.email !== undefined ? rawObj.email : null,
        age: rawObj.age !== undefined ? rawObj.age : null,
        weight: rawObj.weight !== undefined ? rawObj.weight : null,
        height: rawObj.height !== undefined ? rawObj.height : null,
        goal: rawObj.goal ? normalizeGoal(rawObj.goal) : rawObj.goal,
        dietType: rawObj.dietType ? normalizeDietType(rawObj.dietType) : rawObj.dietType,
        activityLevel: rawObj.activityLevel !== undefined ? rawObj.activityLevel : null,
        workoutLocation: rawObj.workoutLocation ? normalizeWorkoutLocation(rawObj.workoutLocation) : rawObj.workoutLocation,
        sex: rawObj.sex !== undefined && rawObj.sex !== null ? String(rawObj.sex).toLowerCase() : 'unspecified',
        isOnboarded,
        createdAt: rawObj.createdAt !== undefined ? rawObj.createdAt : null,
    };

    if (token) {
        response.token = token;
    }

    return response;
}

module.exports = { formatUserResponse };
