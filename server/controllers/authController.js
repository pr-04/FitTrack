const crypto = require('crypto');
const User = require('../models/User');
const OAuthCode = require('../models/OAuthCode');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const user = await User.create({ name, email, password });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
                isOnboarded: false // indicating onboarding is needed
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            const isOnboarded = !!user.age && !!user.weight && !!user.height;
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
                isOnboarded
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const googleCallback = async (req, res) => {
    try {
        const rawCode = crypto.randomBytes(32).toString('hex');
        const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');

        await OAuthCode.create({
            codeHash,
            userId: req.user._id
        });

        const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientURL}/oauth-callback?code=${rawCode}`);
    } catch (error) {
        console.error('OAuth Callback Error:', error);
        const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientURL}/login?error=oauth_failed`);
    }
};

const exchangeOAuthCode = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ message: 'Authorization code is required' });
        }

        const codeHash = crypto.createHash('sha256').update(code).digest('hex');

        // Single-use, atomic redemption
        const oauthDoc = await OAuthCode.findOneAndDelete({ codeHash });
        if (!oauthDoc) {
            return res.status(400).json({ message: 'Invalid or expired authorization code' });
        }

        const user = await User.findById(oauthDoc.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isOnboarded = !!user.age && !!user.weight && !!user.height;
        const token = generateToken(user._id);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token,
            isOnboarded
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { signup, login, googleCallback, exchangeOAuthCode };
