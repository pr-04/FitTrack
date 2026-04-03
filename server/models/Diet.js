const mongoose = require('mongoose');

// This model stores the AI generated diet plan
const dietSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        plan: {
            type: Object, // Structured JSON diet plan from AI
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Diet', dietSchema);
