const express = require('express');
const router = express.Router();
const passport = require('passport');
const { signup, login, googleCallback } = require('../controllers/authController');

// @route POST /api/auth/signup
router.post('/signup', signup);

// @route POST /api/auth/login
router.post('/login', login);

// @route GET /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route GET /api/auth/google/callback
router.get(
    '/google/callback',
    passport.authenticate('google', { 
        failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`, 
        session: false 
    }),
    googleCallback
);

module.exports = router;
