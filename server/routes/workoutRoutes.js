const express = require('express');
const router = express.Router();
const { addWorkout, getWorkouts, deleteWorkout } = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// @route POST /api/workouts
router.post('/', addWorkout);

// @route GET /api/workouts
router.get('/', getWorkouts);

// @route DELETE /api/workouts/:id
router.delete('/:id', deleteWorkout);

module.exports = router;
