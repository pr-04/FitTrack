const Workout = require('../models/Workout');

// @desc    Add a new workout
// @route   POST /api/workouts
// @access  Private
const addWorkout = async (req, res) => {
    try {
        const { exercise, sets, reps, weight, date } = req.body;

        if (!exercise || !sets || !reps) {
            return res.status(400).json({ message: 'Exercise, sets, and reps are required' });
        }

        const workout = await Workout.create({
            userId: req.user._id,
            exercise,
            sets,
            reps,
            weight: weight || 0,
            date: date || Date.now(),
        });

        res.status(201).json(workout);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all workouts for logged-in user
// @route   GET /api/workouts
// @access  Private
const getWorkouts = async (req, res) => {
    try {
        const workouts = await Workout.find({ userId: req.user._id }).sort({ date: -1 });
        res.json(workouts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a workout
// @route   DELETE /api/workouts/:id
// @access  Private
const deleteWorkout = async (req, res) => {
    try {
        const workout = await Workout.findById(req.params.id);

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        // Ensure user owns the workout
        if (workout.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this workout' });
        }

        await workout.deleteOne();
        res.json({ message: 'Workout deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addWorkout, getWorkouts, deleteWorkout };
