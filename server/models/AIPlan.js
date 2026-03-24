const mongoose = require('mongoose');

const aiPlanSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['workout', 'diet'],
            required: true,
        },
        data: {
            type: Object,
            required: true,
        },
        instruction: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('AIPlan', aiPlanSchema);
