const User = require('../models/User');
const Workout = require('../models/Workout');
const Diet = require('../models/Diet');
const WorkoutLog = require('../models/WorkoutLog');
const DietLog = require('../models/DietLog');
const { startOfDayInTZ, dayKey, calculateStreak } = require('../utils/time');

// @desc    Get dashboard summary data
// @route   GET /api/dashboard
// @access  Private
const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user._id;
        const tz = req.headers['x-timezone'] || req.headers['X-Timezone'] || 'UTC';
        const now = new Date();

        // Fetch User, latest workout, latest diet, all workout logs for streak
        const [user, latestWorkout, latestDiet, allWorkoutLogs] = await Promise.all([
            User.findById(userId).select('-password'),
            Workout.findOne({ userId }).sort({ createdAt: -1 }),
            Diet.findOne({ userId }).sort({ createdAt: -1 }),
            WorkoutLog.find({ userId }).sort({ date: -1 })
        ]);

        // Real consecutive-day streak in user's time zone
        const streak = calculateStreak(allWorkoutLogs, tz, now);

        // Weekly Caloric Performance Chart (Last 7 Days in user's time zone)
        const todayStart = startOfDayInTZ(tz, now);
        const sevenDaysAgoStart = new Date(todayStart.getTime() - (6 * 24 * 60 * 60 * 1000));

        const weekDataMap = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayStart.getTime() - (i * 24 * 60 * 60 * 1000) + (12 * 60 * 60 * 1000));
            const key = dayKey(tz, d);
            const dayName = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(d);
            weekDataMap[key] = {
                name: dayName,
                calories: 0
            };
        }

        const recentDietLogs = await DietLog.find({
            userId,
            date: { $gte: sevenDaysAgoStart }
        });

        recentDietLogs.forEach(log => {
            const key = dayKey(tz, log.date);
            if (weekDataMap[key]) {
                weekDataMap[key].calories += (log.calories || 0);
            }
        });

        const weekData = Object.values(weekDataMap);

        // Fetch recent logs for display
        const [newWorkoutLogs, newDietLogs] = await Promise.all([
            WorkoutLog.find({ userId }).sort({ date: -1 }).limit(10),
            DietLog.find({ userId }).sort({ date: -1 }).limit(10)
        ]);

        const normalizedLogs = [
            ...newWorkoutLogs.map(l => ({ ...l.toObject(), name: l.exercise, type: 'workout', displayType: 'workout' })),
            ...newDietLogs.map(l => ({ ...l.toObject(), type: 'diet', displayType: 'diet' }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            user,
            workoutPlan: latestWorkout ? latestWorkout.plan : null,
            workoutPlanCreatedAt: latestWorkout ? latestWorkout.createdAt : null,
            dietPlan: latestDiet ? latestDiet.plan : null,
            streak,
            weekData,
            recentLogs: normalizedLogs.slice(0, 5)
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
        const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;
        res.status(500).json({ message: msg });
    }
};

module.exports = { getDashboardSummary };
