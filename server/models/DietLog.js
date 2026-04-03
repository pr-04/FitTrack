const mongoose = require('mongoose');

const dietLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Food name is required'],
            trim: true,
        },
        calories: {
            type: Number,
            required: [true, 'Calories are required'],
            min: [0, 'Calories cannot be negative'],
        },
        protein: {
            type: Number,
            default: 0,
            min: [0, 'Protein cannot be negative'],
        },
        carbs: {
            type: Number,
            default: 0,
            min: [0, 'Carbs cannot be negative'],
        },
        fats: {
            type: Number,
            default: 0,
            min: [0, 'Fats cannot be negative'],
        },
        date: {
            type: Date,
            default: Date.now,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('DietLog', dietLogSchema);
