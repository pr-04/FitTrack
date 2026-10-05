const express = require('express');
const router = express.Router();
const passport = require('passport');
const { signup, login, googleCallback, exchangeOAuthCode } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiters');
const { signupSchema, loginSchema, exchangeOAuthSchema } = require('../validators/schemas');

// @route POST /api/auth/signup
router.post('/signup', authLimiter, validate(signupSchema), signup);

// @route POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), login);

// @route POST /api/auth/oauth/exchange
router.post('/oauth/exchange', authLimiter, validate(exchangeOAuthSchema), exchangeOAuthCode);

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
