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

        // Fetch logs from primary sources
        const [workoutLogs, dietLogs] = await Promise.all([
            WorkoutLog.find({ userId: req.user._id }).sort({ date: -1 }),
            DietLog.find({ userId: req.user._id }).sort({ date: -1 })
        ]);

        // Normalize for combined view
        const allLogs = [
            ...workoutLogs.map(l => ({ ...l.toObject(), name: l.exercise, type: 'workout', displayType: 'workout' })),
            ...dietLogs.map(l => ({ ...l.toObject(), type: 'diet', displayType: 'diet' }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate today's calories
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaysDietLogs = dietLogs.filter(l => new Date(l.date) >= today);
        const dailyCalories = todaysDietLogs.reduce((acc, log) => acc + (log.calories || 0), 0);

        res.json({
            bmi,
            bmiStatus,
            currentWeight: user.weight,
            dailyCalories,
            totalWorkouts: workoutLogs.length,
            recentLogs: allLogs.slice(0, 15), 
            workoutHistory: workoutLogs 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getTrackerStats };
