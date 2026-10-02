const Workout = require('../models/Workout');
const Log = require('../models/Log');
const WorkoutLog = require('../models/WorkoutLog');
const { generateWorkoutPlan } = require('../services/aiService');

// @desc Generate an AI Workout Plan
// @route POST /api/workout/generate
exports.generateWorkout = async (req, res) => {
    try {
        const { goal, fitnessLevel } = req.body;
        
        if (!req.user) {
            return res.status(401).json({ message: "User session expired. Please log in again." });
        }

        const userGoal = goal || req.user.goal || 'maintain';
        const userLevel = fitnessLevel || req.user.activityLevel || 'moderate';

        const { plan: finalPlan } = await generateWorkoutPlan({
            goal: userGoal,
            fitnessLevel: userLevel
        });

        const newWorkout = await Workout.create({
            userId: req.user._id,
            plan: finalPlan
        });

        res.status(201).json(newWorkout);
    } catch (error) {
        console.error('WORKOUT_GENERATION_FAILED:', error.message);
        if (error.message === 'SAFETY_FILTER_BLOCKED') {
            return res.status(400).json({
                message: 'Workout generation was blocked by safety filters. Please try modifying your goal.',
                tip: 'Try selecting a standard fitness goal.'
            });
        }
        res.status(502).json({ 
            message: 'AI Coach is currently experiencing high demand. Please try again in a few moments.',
            tip: 'You can retry in a few seconds.'
        });
    }
};

// @desc Get Workout Plan History
// @route GET /api/workout/history
exports.getWorkoutHistory = async (req, res) => {
    try {
        const history = await Workout.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'History retrieval failed' });
    }
};

// @desc Log a completed workout exercise
// @route POST /api/workout/log
exports.logWorkout = async (req, res) => {
    try {
        const { exercise, sets, reps, weight, date } = req.body;
        
        if (!exercise || !sets || !reps) {
            return res.status(400).json({ message: 'Exercise, sets, and reps are required' });
        }

        const log = await WorkoutLog.create({
            userId: req.user._id,
            exercise,
            sets,
            reps,
            weight: weight || 0,
            date: date || Date.now()
        });

        res.status(201).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get recent unique exercises for suggestions
// @route GET /api/workout/recent-exercises
exports.getRecentExercises = async (req, res) => {
    try {
        const logs = await WorkoutLog.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        
        const uniqueExercises = [...new Set(logs.map(l => l.exercise))].slice(0, 10);
        res.json(uniqueExercises);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch suggestions' });
    }
};

// @desc Delete a Specific Workout Plan
// @route DELETE /api/workout/history/:id
exports.deleteWorkout = async (req, res) => {
    try {
        const workout = await Workout.findById(req.params.id);
        
        if (!workout) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Check ownership
        if (workout.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await workout.deleteOne();
        res.json({ message: 'Plan removed securely' });
    } catch (error) {
        console.error('Workout Deletion Error:', error);
        res.status(500).json({ message: 'Architecture disposal failed' });
    }
};
