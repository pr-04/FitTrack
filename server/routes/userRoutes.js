const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, deleteProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// @route GET /api/user/profile
router.get('/profile', protect, getProfile);

// @route PUT /api/user/profile (used for onboarding as well)
router.put('/profile', protect, updateProfile);

// @route PUT /api/user/update
router.put('/update', protect, updateProfile);

// @route DELETE /api/user/profile
router.delete('/profile', protect, deleteProfile);

module.exports = router;
