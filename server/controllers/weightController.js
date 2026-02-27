const Weight = require('../models/Weight');

// @desc    Add a weight entry
// @route   POST /api/weights
// @access  Private
const addWeight = async (req, res) => {
    try {
        const { weight, date } = req.body;

        if (!weight) {
            return res.status(400).json({ message: 'Weight value is required' });
        }

        const entry = await Weight.create({
            userId: req.user._id,
            weight,
            date: date || Date.now(),
        });

        res.status(201).json(entry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all weight entries for logged-in user
// @route   GET /api/weights
// @access  Private
const getWeights = async (req, res) => {
    try {
        const weights = await Weight.find({ userId: req.user._id }).sort({ date: 1 });
        res.json(weights);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addWeight, getWeights };
