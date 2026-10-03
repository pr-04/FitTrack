const mongoose = require('mongoose');

const nutritionCacheSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    result: {
        name: { type: String, required: true },
        calories: { type: Number, required: true },
        protein: { type: Number, required: true, default: 0 },
        carbs: { type: Number, required: true, default: 0 },
        fats: { type: Number, required: true, default: 0 }
    },
    model: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 2592000 // 30 days TTL in seconds (30 * 24 * 60 * 60)
    }
});

/**
 * Key Normalization Helper:
 * 1. Unicode normalization (NFKC)
 * 2. Lowercase
 * 3. Trim whitespace
 * 4. Strip trailing punctuation
 * 5. Collapse multiple whitespaces into a single space
 */
function normalizeCacheKey(str) {
    if (typeof str !== 'string') str = String(str || '');
    return str
        .normalize('NFKC')
        .toLowerCase()
        .trim()
        .replace(/[.!?]+$/, '')
        .replace(/\s+/g, ' ');
}

const NutritionCache = mongoose.model('NutritionCache', nutritionCacheSchema);

module.exports = {
    NutritionCache,
    normalizeCacheKey
};
