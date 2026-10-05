const WorkoutLog = require('../models/WorkoutLog');
const DietLog = require('../models/DietLog');
const User = require('../models/User');
const { calculateBMI, getBMIStatus } = require('../utils/biometrics');
const { startOfDayInTZ, dayKey } = require('../utils/time');

// @desc Get Tracker Dashboard Stats
// @route GET /api/tracker
const getTrackerStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const tz = req.headers['x-timezone'] || req.headers['X-Timezone'] || 'UTC';
        const now = new Date();

        const user = await User.findById(userId);
        const bmi = calculateBMI(user.weight, user.height);
        const bmiStatus = getBMIStatus(bmi);

        const todayStart = startOfDayInTZ(tz, now);
        const fourteenDaysAgoStart = new Date(todayStart.getTime() - (13 * 24 * 60 * 60 * 1000));

        // Fetch only specific needed query subsets instead of loading every log
        const [
            todayDietLogs,
            totalWorkouts,
            recentWorkouts,
            recentFoods,
            fourteenDaysDietLogs
        ] = await Promise.all([
            DietLog.find({ userId, date: { $gte: todayStart } }),
            WorkoutLog.countDocuments({ userId }),
            WorkoutLog.find({ userId }).sort({ date: -1, _id: -1 }).limit(12),
            DietLog.find({ userId }).sort({ date: -1, _id: -1 }).limit(15),
            DietLog.find({ userId, date: { $gte: fourteenDaysAgoStart } })
        ]);

        // Calculate today's calories
        const dailyCalories = todayDietLogs.reduce((acc, log) => acc + (log.calories || 0), 0);

        // Calorie history (last 14 days, aggregated per day, zero-filled)
        const calorieHistoryMap = {};
        for (let i = 13; i >= 0; i--) {
            const d = new Date(todayStart.getTime() - (i * 24 * 60 * 60 * 1000) + (12 * 60 * 60 * 1000));
            const key = dayKey(tz, d);
            calorieHistoryMap[key] = { date: key, calories: 0 };
        }

        fourteenDaysDietLogs.forEach(log => {
            const key = dayKey(tz, log.date);
            if (calorieHistoryMap[key]) {
                calorieHistoryMap[key].calories += (log.calories || 0);
            }
        });

        const calorieHistory = Object.values(calorieHistoryMap);

        // Backward-compatible aliases for Stage 1:
        const combined = [
            ...recentWorkouts.map(l => ({ ...l.toObject(), name: l.exercise, type: 'workout', displayType: 'workout' })),
            ...recentFoods.map(l => ({ ...l.toObject(), type: 'diet', displayType: 'diet' }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            bmi,
            bmiStatus,
            currentWeight: user.weight,
            dailyCalories,
            totalWorkouts,
            recentWorkouts,
            recentFoods,
            calorieHistory,
            recentLogs: combined.slice(0, 15),
            workoutHistory: recentWorkouts
        });
    } catch (error) {
        console.error('Tracker stats error:', error);
        const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;
        res.status(500).json({ message: msg });
    }
};

module.exports = { getTrackerStats };
