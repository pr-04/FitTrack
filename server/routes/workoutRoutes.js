const express = require('express');
const router = express.Router();
const { generateWorkout, getWorkoutHistory, logWorkout, deleteWorkout, getRecentExercises } = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware');
const { aiGenerateTotalLimiter, aiGenerateLimiter } = require('../middleware/rateLimiters');
const validate = require('../middleware/validate');
const { generateWorkoutSchema, logWorkoutSchema, deleteWorkoutSchema } = require('../validators/schemas');

router.post('/generate', protect, aiGenerateTotalLimiter, aiGenerateLimiter, validate(generateWorkoutSchema), generateWorkout);
router.post('/log', protect, validate(logWorkoutSchema), logWorkout);
router.get('/history', protect, getWorkoutHistory);
router.get('/recent-exercises', protect, getRecentExercises);
router.delete('/history/:id', protect, validate(deleteWorkoutSchema), deleteWorkout);

module.exports = router;
