const express = require('express');
const router = express.Router();
const { addFood, getFoods, deleteFood, searchFood, getMockFoods } = require('../controllers/foodController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// @route GET /api/foods/mock
router.get('/mock', getMockFoods);

// @route POST /api/foods
router.post('/', addFood);

// @route GET /api/foods/search?query=...
router.get('/search', searchFood);

// @route GET /api/foods?date=YYYY-MM-DD
router.get('/', getFoods);

// @route DELETE /api/foods/:id
router.delete('/:id', deleteFood);

module.exports = router;
