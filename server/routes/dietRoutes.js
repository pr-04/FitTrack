const express = require('express');
const router = express.Router();
const { generateDiet, getDietHistory, logDiet, getRecentFoods, lookupNutrition } = require('../controllers/dietController');
const { protect } = require('../middleware/authMiddleware');
const { aiGenerateLimiter, dietLookupLimiter } = require('../middleware/rateLimiters');
const validate = require('../middleware/validate');
const { generateDietSchema, logDietSchema, lookupNutritionSchema } = require('../validators/schemas');

router.post('/generate', protect, aiGenerateLimiter, validate(generateDietSchema), generateDiet);
router.post('/log', protect, validate(logDietSchema), logDiet);
router.get('/history', protect, getDietHistory);
router.get('/recent-foods', protect, getRecentFoods);
router.get('/lookup', protect, dietLookupLimiter, validate(lookupNutritionSchema), lookupNutrition);

module.exports = router;
