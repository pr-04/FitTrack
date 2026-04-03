const express = require('express');
const router = express.Router();
const { getTrackerStats } = require('../controllers/trackerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getTrackerStats);

module.exports = router;
