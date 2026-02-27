const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route POST /api/auth/signup
router.post('/signup', signup);

// @route POST /api/auth/login
router.post('/login', login);

// @route GET /api/auth/me  (Protected)
router.get('/me', protect, getMe);

// @route PUT /api/auth/profile  (Protected)
router.put('/profile', protect, updateProfile);

module.exports = router;
