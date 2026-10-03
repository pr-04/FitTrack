const express = require('express');
const router = express.Router();
const { generateDiet, getDietHistory, logDiet, getRecentFoods, lookupNutrition } = require('../controllers/dietController');
const { protect } = require('../middleware/authMiddleware');
const { aiGenerateTotalLimiter, aiGenerateLimiter, dietLookupTotalLimiter, dietLookupLimiter } = require('../middleware/rateLimiters');
const validate = require('../middleware/validate');
const { generateDietSchema, logDietSchema, lookupNutritionSchema } = require('../validators/schemas');

router.post('/generate', protect, aiGenerateTotalLimiter, aiGenerateLimiter, validate(generateDietSchema), generateDiet);
router.post('/log', protect, validate(logDietSchema), logDiet);
router.get('/history', protect, getDietHistory);
router.get('/recent-foods', protect, getRecentFoods);
router.get('/lookup', protect, dietLookupTotalLimiter, dietLookupLimiter, validate(lookupNutritionSchema), lookupNutrition);

module.exports = router;
