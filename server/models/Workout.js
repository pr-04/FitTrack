const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        exercise: {
            type: String,
            required: [true, 'Exercise name is required'],
            trim: true,
        },
        sets: {
            type: Number,
            required: [true, 'Sets are required'],
            min: 1,
        },
        reps: {
            type: Number,
            required: [true, 'Reps are required'],
            min: 1,
        },
        weight: {
            type: Number, // in kg, optional for bodyweight exercises
            default: 0,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        image: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Workout', workoutSchema);
