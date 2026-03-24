const Workout = require('../models/Workout');

// @desc    Add a new workout
// @route   POST /api/workouts
// @access  Private
const addWorkout = async (req, res) => {
    try {
        const { exercise, sets, reps, weight, date, image } = req.body;

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
            image: image || '',
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

const commonWorkouts = [
    { name: 'Bench Press', image: 'https://s3assets.skimble.com/assets/2289478/image_full.jpg' },
    { name: 'Squat', image: 'https://static.strengthlevel.com/images/exercises/squat/squat-800.jpg' },
    { name: 'Deadlift', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqpAwZaVznSl3YcCtEjJ7gGss5ptiN8KCUsg&s' },
    { name: 'Pull-ups', image: 'https://velocitywestchester.com/wp-content/uploads/2025/06/rsw_1280-9.webp' },
    { name: 'Push-ups', image: 'https://images.squarespace-cdn.com/content/v1/58501b0cf5e23149e5589e12/1585601917653-J791ZN5ZWSK565NIZSS1/1_WZmDgcJO40Va5mVgdfbz7g%402x.jpeg' },
    { name: 'Shoulder Press', image: 'https://liftmanual.com/wp-content/uploads/2023/04/lever-seated-shoulder-press.jpg' },
    { name: 'Bicep Curl', image: 'https://s3assets.skimble.com/assets/2287282/image_full.jpg' },
    { name: 'Tricep Dip', image: 'https://liftmanual.com/wp-content/uploads/2023/04/weighted-tricep-dips.jpg' },
    { name: 'Lat Pulldown', image: 'https://static.strengthlevel.com/images/exercises/lat-pulldown/lat-pulldown-800.jpg' },
    { name: 'Leg Press', image: 'https://static.strengthlevel.com/images/exercises/vertical-leg-press/vertical-leg-press-800.jpg' },
    { name: 'Plank', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc2wDjNdSoi55JYU8iIbH5Ls89DqZNeMhtWQ&s' },
    { name: 'Lunges', image: 'https://trainingstation.co.uk/cdn/shop/articles/Lunges-movment_d958998d-2a9f-430e-bdea-06f1e2bcc835_900x.webp?v=1741687877' },
    { name: 'Rows', image: 'https://www.shutterstock.com/image-illustration/barbell-bent-over-row-back-600nw-2329911219.jpg' }
];

// @desc    Get mock predefined workouts
// @route   GET /api/workouts/mock
// @access  Private
const getMockWorkouts = async (req, res) => {
    res.json(commonWorkouts);
};

module.exports = { addWorkout, getWorkouts, deleteWorkout, getMockWorkouts };
