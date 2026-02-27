const express = require('express');
const router = express.Router();
const { addWeight, getWeights } = require('../controllers/weightController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// @route POST /api/weights
router.post('/', addWeight);

// @route GET /api/weights
router.get('/', getWeights);

module.exports = router;
