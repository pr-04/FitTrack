const express = require('express');
const router = express.Router();
const { generateDiet, getDietHistory, logDiet, getRecentFoods, lookupNutrition } = require('../controllers/dietController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateDiet);
router.post('/log', protect, logDiet);
router.get('/history', protect, getDietHistory);
router.get('/recent-foods', protect, getRecentFoods);
router.get('/lookup', protect, lookupNutrition);

module.exports = router;
