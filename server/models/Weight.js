const mongoose = require('mongoose');

const weightSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        weight: {
            type: Number,
            required: [true, 'Weight is required'],
            min: 1,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Weight', weightSchema);
