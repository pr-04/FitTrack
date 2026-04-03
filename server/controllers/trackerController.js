const Log = require('../models/Log');
const WorkoutLog = require('../models/WorkoutLog');
const DietLog = require('../models/DietLog');
const User = require('../models/User');
const { calculateBMI, getBMIStatus } = require('../utils/biometrics');


// @desc Get Tracker Dashboard Stats
// @route GET /api/tracker
const getTrackerStats = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Calculate BMI
        const bmi = calculateBMI(user.weight, user.height);
        const bmiStatus = getBMIStatus(bmi);

        // Base query for logs from all sources
        const [oldLogs, workoutLogs, dietLogs] = await Promise.all([
            Log.find({ userId: req.user._id }).sort({ date: -1 }),
            WorkoutLog.find({ userId: req.user._id }).sort({ date: -1 }),
            DietLog.find({ userId: req.user._id }).sort({ date: -1 })
        ]);

        // Normalize for combined view
        const allLogs = [
            ...oldLogs.map(l => ({ ...l.toObject(), name: l.foodItem || l.exercise, displayType: l.type })),
            ...workoutLogs.map(l => ({ ...l.toObject(), name: l.exercise, type: 'workout', displayType: 'workout' })),
            ...dietLogs.map(l => ({ ...l.toObject(), type: 'diet', displayType: 'diet' }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate today's calories
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaysDietLogs = [
            ...oldLogs.filter(l => l.type === 'diet' && new Date(l.date) >= today),
            ...dietLogs.filter(l => new Date(l.date) >= today)
        ];
        const dailyCalories = todaysDietLogs.reduce((acc, log) => acc + (log.calories || 0), 0);

        const allWorkoutLogs = [
            ...oldLogs.filter(l => l.type === 'workout'),
            ...workoutLogs
        ];
        
        res.json({
            bmi,
            bmiStatus,
            currentWeight: user.weight,
            dailyCalories,
            totalWorkouts: allWorkoutLogs.length,
            recentLogs: allLogs.slice(0, 15), 
            workoutHistory: allWorkoutLogs 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getTrackerStats };
