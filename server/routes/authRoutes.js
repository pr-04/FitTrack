const express = require('express');
const router = express.Router();
const passport = require('passport');
const { signup, login, getMe, updateProfile, googleCallback } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route POST /api/auth/signup
router.post('/signup', signup);

// @route POST /api/auth/login
router.post('/login', login);

// @route GET /api/auth/me  (Protected)
router.get('/me', protect, getMe);

// @route PUT /api/auth/profile  (Protected)
router.put('/profile', protect, updateProfile);

// @route GET /api/auth/google  — initiates Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route GET /api/auth/google/callback  — Google redirects here after login
router.get(
    '/google/callback',
    passport.authenticate('google', { 
        failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`, 
        session: false 
    }),
    googleCallback
);

module.exports = router;
