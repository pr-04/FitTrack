const mongoose = require('mongoose');

// Unified tracker log
const logSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['workout', 'diet', 'weight'],
            required: true,
        },
        // For workout logs
        exercise: String,
        sets: Number,
        reps: Number,
        liftWeight: Number,
        
        // For diet logs
        foodItem: String,
        calories: Number,
        
        // For weight logs
        bodyWeight: Number,
        
        date: {
            type: Date,
            default: Date.now,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Log', logSchema);
