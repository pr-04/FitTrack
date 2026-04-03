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
            sparse: true,
        },
        age: {
            type: Number,
            default: null,
        },
        weight: {
            type: Number, // in kg
            default: null,
        },
        height: {
            type: Number, // in cm
            default: null,
        },
        goal: {
            type: String,
            enum: ['fat_loss', 'muscle_gain', 'body_recomposition', 'maintain', 'strength', 'endurance', 'general_fitness', 'flexibility', 'lose_weight'],
            default: 'maintain',
        },
        dietType: {
            type: String,
            enum: ['vegetarian', 'non-vegetarian', 'vegan', 'pescatarian', 'any', 'Veg', 'Non-veg'],
            default: 'any',
        },
        activityLevel: {
            type: String,
            enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
            default: 'light',
        },
        workoutLocation: {
            type: String,
            enum: ['Home', 'Gym', 'home', 'gym'],
            default: 'Home',
        },
        isOnboarded: {
            type: Boolean,
            default: false,
        }
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
