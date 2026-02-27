const Food = require('../models/Food');
const axios = require('axios');

// @desc    Add a new food entry
// @route   POST /api/foods
// @access  Private
const addFood = async (req, res) => {
    try {
        const { foodName, calories, mealType, date } = req.body;

        if (!foodName || calories === undefined || !mealType) {
            return res.status(400).json({ message: 'Food name, calories, and meal type are required' });
        }

        const food = await Food.create({
            userId: req.user._id,
            foodName,
            calories,
            mealType,
            date: date || Date.now(),
        });

        res.status(201).json(food);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get food entries for a specific date + total calories
// @route   GET /api/foods?date=YYYY-MM-DD
// @access  Private
const getFoods = async (req, res) => {
    try {
        let query = { userId: req.user._id };

        // Filter by date if provided
        if (req.query.date) {
            const start = new Date(req.query.date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(req.query.date);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }

        const foods = await Food.find(query).sort({ date: -1 });

        // Calculate total calories for the day
        const totalCalories = foods.reduce((sum, food) => sum + food.calories, 0);

        res.json({ foods, totalCalories });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a food entry
// @route   DELETE /api/foods/:id
// @access  Private
const deleteFood = async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);

        if (!food) {
            return res.status(404).json({ message: 'Food entry not found' });
        }

        // Ensure user owns the food entry
        if (food.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this entry' });
        }

        await food.deleteOne();
        res.json({ message: 'Food entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mock data for fallback when API is unavailable or for demo purposes
const commonFoods = [
    { name: 'Chicken Breast (100g)', calories: 165, protein: 31, fat: 3.6, carbs: 0 },
    { name: 'Chicken Thigh (100g)', calories: 209, protein: 26, fat: 11, carbs: 0 },
    { name: 'Paneer (100g)', calories: 265, protein: 18, fat: 20, carbs: 1.2 },
    { name: 'Egg (1 Large)', calories: 72, protein: 6, fat: 5, carbs: 0.6 },
    { name: 'Apple (Medium)', calories: 95, protein: 0.5, fat: 0.3, carbs: 25 },
    { name: 'Banana (Medium)', calories: 105, protein: 1.3, fat: 0.4, carbs: 27 },
    { name: 'White Rice (1 Cup cooked)', calories: 205, protein: 4.3, fat: 0.4, carbs: 45 },
    { name: 'Brown Rice (1 Cup cooked)', calories: 218, protein: 4.5, fat: 1.6, carbs: 46 },
    { name: 'Milk (1 Glass - 250ml)', calories: 146, protein: 8, fat: 8, carbs: 12 },
    { name: 'Oats (1 Bowl cooked)', calories: 150, protein: 5, fat: 2.5, carbs: 27 },
    { name: 'Broccoli (100g)', calories: 34, protein: 2.8, fat: 0.4, carbs: 7 },
    { name: 'Salmon (100g)', calories: 208, protein: 20, fat: 13, carbs: 0 },
    { name: 'Peanut Butter (1 tbsp)', calories: 94, protein: 4, fat: 8, carbs: 3 },
    { name: 'Yogurt (1 Cup)', calories: 150, protein: 8, fat: 8, carbs: 12 },
    { name: 'Almonds (10 nuts)', calories: 70, protein: 2.5, fat: 6, carbs: 2.5 }
];

// @desc    Get all predefined mock foods
// @route   GET /api/foods/mock
// @access  Private
const getMockFoods = async (req, res) => {
    res.json(commonFoods);
};

// @desc    Search for food nutrition details (Mock implementation)
// @route   GET /api/foods/search?query=...
// @access  Private
const searchFood = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchTerm = query.toLowerCase().trim();
        const results = commonFoods.filter(f =>
            f.name.toLowerCase().includes(searchTerm)
        );

        if (results.length === 0) {
            return res.status(404).json({ message: 'Food not found in our database.' });
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addFood, getFoods, deleteFood, searchFood, getMockFoods };
