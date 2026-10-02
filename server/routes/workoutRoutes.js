const express = require('express');
const router = express.Router();
const { generateWorkout, getWorkoutHistory, logWorkout, deleteWorkout, getRecentExercises } = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware');
const { aiGenerateLimiter } = require('../middleware/rateLimiters');

router.post('/generate', protect, aiGenerateLimiter, generateWorkout);
router.post('/log', protect, logWorkout);
router.get('/history', protect, getWorkoutHistory);
router.get('/recent-exercises', protect, getRecentExercises);
router.delete('/history/:id', protect, deleteWorkout);

module.exports = router;
