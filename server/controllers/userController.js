const User = require('../models/User');
const Workout = require('../models/Workout');
const Diet = require('../models/Diet');
const WorkoutLog = require('../models/WorkoutLog');
const DietLog = require('../models/DietLog');
const Log = require('../models/Log');
const OAuthCode = require('../models/OAuthCode');
const { formatUserResponse } = require('../utils/userResponse');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getProfile = async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json(formatUserResponse(user));
};

// @desc    Update user profile & complete onboarding
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { name, age, weight, height, goal, dietType, activityLevel, workoutLocation, sex } = req.body;

        if (name) user.name = name;
        if (age) user.age = age;
        if (weight) user.weight = weight;
        if (height) user.height = height;
        if (goal) user.goal = goal;
        if (dietType) user.dietType = dietType;
        if (activityLevel) user.activityLevel = activityLevel;
        if (workoutLocation) user.workoutLocation = workoutLocation;
        if (sex !== undefined) user.sex = sex;
        
        if (req.body.isOnboarded !== undefined) user.isOnboarded = req.body.isOnboarded;

        if (user.age && user.weight && user.height) {
            user.isOnboarded = true;
        }

        const updatedUser = await user.save();
        res.json(formatUserResponse(updatedUser));
    } catch (error) {
        console.error('Update Profile Error:', error);
        const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;
        res.status(500).json({ message: msg });
    }
};

// @desc    Delete user profile
// @route   DELETE /api/user/profile
// @access  Private
const deleteProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Delete user's Workout, Diet, WorkoutLog, DietLog, Log and OAuthCode documents first
        await Promise.all([
            Workout.deleteMany({ userId }),
            Diet.deleteMany({ userId }),
            WorkoutLog.deleteMany({ userId }),
            DietLog.deleteMany({ userId }),
            Log.deleteMany({ userId }),
            OAuthCode.deleteMany({ userId })
        ]);

        await user.deleteOne();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete Profile Error:', error);
        const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;
        res.status(500).json({ message: msg });
    }
};

module.exports = { getProfile, updateProfile, deleteProfile };
