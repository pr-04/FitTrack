const User = require('../models/User');
const Workout = require('../models/Workout');
const Diet = require('../models/Diet');
const Log = require('../models/Log');
const WorkoutLog = require('../models/WorkoutLog');
const DietLog = require('../models/DietLog');

// @desc    Get dashboard summary data
// @route   GET /api/dashboard
// @access  Private
const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user._id;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch User
        const user = await User.findById(userId).select('-password');
        
        // Fetch latest workout and diet
        const latestWorkout = await Workout.findOne({ userId }).sort({ createdAt: -1 });
        const latestDiet = await Diet.findOne({ userId }).sort({ createdAt: -1 });

        // Fetch logs from all sources
        const [oldLogs, newWorkoutLogs, newDietLogs] = await Promise.all([
            Log.find({ userId, date: { $gte: sevenDaysAgo } }).sort({ date: -1 }),
            WorkoutLog.find({ userId, date: { $gte: sevenDaysAgo } }).sort({ date: -1 }),
            DietLog.find({ userId, date: { $gte: sevenDaysAgo } }).sort({ date: -1 })
        ]);
        
        // Normalize logs for display
        const normalizedLogs = [
            ...oldLogs.map(l => ({ ...l.toObject(), name: l.foodItem || l.exercise, displayType: l.type })),
            ...newWorkoutLogs.map(l => ({ ...l.toObject(), name: l.exercise, type: 'workout', displayType: 'workout' })),
            ...newDietLogs.map(l => ({ ...l.toObject(), type: 'diet', displayType: 'diet' }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Workout streak (distinct days with any workout in the last 30 days for a better sense of progress)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const [streakWorkouts, streakOldLogs] = await Promise.all([
            WorkoutLog.find({ userId, date: { $gte: thirtyDaysAgo } }),
            Log.find({ userId, type: 'workout', date: { $gte: thirtyDaysAgo } })
        ]);

        const workoutDays = new Set([
            ...streakWorkouts.map(l => new Date(l.date).toDateString()),
            ...streakOldLogs.map(l => new Date(l.date).toDateString())
        ]);
        const streak = workoutDays.size;

        // Weekly Caloric Performance Chart (Last 7 Days)
        const weekDataMap = {};
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            weekDataMap[d.toDateString()] = {
                name: days[d.getDay()],
                calories: 0
            };
        }

        const allDietLogs = [
            ...oldLogs.filter(l => l.type === 'diet'),
            ...newDietLogs
        ];
        
        allDietLogs.forEach(log => {
            const dateStr = new Date(log.date).toDateString();
            if (weekDataMap[dateStr]) {
                weekDataMap[dateStr].calories += log.calories || 0;
            }
        });
        
        const weekData = Object.values(weekDataMap);

        res.json({
            user,
            workoutPlan: latestWorkout ? latestWorkout.plan : null,
            dietPlan: latestDiet ? latestDiet.plan : null,
            streak,
            weekData,
            recentLogs: normalizedLogs.slice(0, 5)
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardSummary };
