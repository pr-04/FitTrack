const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getProfile = async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json({ ...user.toObject() });
};

// @desc    Update user profile & complete onboarding
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { name, age, weight, height, goal, dietType, activityLevel, workoutLocation } = req.body;

        if (name) user.name = name;
        if (age) user.age = age;
        if (weight) user.weight = weight;
        if (height) user.height = height;
        if (goal) user.goal = goal;
        if (dietType) user.dietType = dietType;
        if (activityLevel) user.activityLevel = activityLevel;
        if (workoutLocation) user.workoutLocation = workoutLocation;
        
        if (req.body.isOnboarded !== undefined) user.isOnboarded = req.body.isOnboarded;

        if (user.age && user.weight && user.height) {
            user.isOnboarded = true;
        }

        const updatedUser = await user.save();
        const userResponse = updatedUser.toObject();
        delete userResponse.password;
        
        res.json(userResponse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user profile
// @route   DELETE /api/user/profile
// @access  Private
const deleteProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Optionally delete related data like logs, workouts, diets here
        // await Workout.deleteMany({ userId: user._id });
        // await Diet.deleteMany({ userId: user._id });
        // await Log.deleteMany({ userId: user._id });

        await user.deleteOne();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getProfile, updateProfile, deleteProfile };
