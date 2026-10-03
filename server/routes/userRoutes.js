const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, deleteProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { updateProfileSchema } = require('../validators/schemas');

// @route GET /api/user/profile
router.get('/profile', protect, getProfile);

// @route PUT /api/user/profile (used for onboarding as well)
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);

// @route DELETE /api/user/profile
router.delete('/profile', protect, deleteProfile);

module.exports = router;
