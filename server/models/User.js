const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            minlength: 6,
            default: null,
        },
        googleId: {
            type: String,
            default: null,
            sparse: true, // allow multiple null values
        },
        avatar: {
            type: String,
            default: null,
        },
        height: {
            type: Number, // in cm
            default: null,
        },
        weight: {
            type: Number, // in kg
            default: null,
        },
        goal: {
            type: String,
            enum: ['lose_weight', 'gain_muscle', 'maintain', 'improve_fitness'],
            default: 'maintain',
        },
    },
    { timestamps: true }
);

// Hash password before saving (skip for OAuth users with no password)
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password (returns false if user has no password set)
userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
