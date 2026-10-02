const Diet = require('../models/Diet');
const Log = require('../models/Log');
const DietLog = require('../models/DietLog');
const { generateDietPlan, lookupNutrition: aiLookupNutrition } = require('../services/aiService');

// @desc Generate an AI Diet Plan (Daily Nutrition Blueprint)
// @route POST /api/diet/generate
exports.generateDiet = async (req, res) => {
    try {
        const { goal, dietType } = req.body;
        
        if (!req.user) {
            return res.status(401).json({ message: "User session expired. Please log in again." });
        }

        const userGoal = goal || req.user.goal || 'maintain';
        const userDiet = dietType || req.user.dietType || 'any';

        const { plan: finalPlan } = await generateDietPlan({
            goal: userGoal,
            dietType: userDiet
        });

        const newDiet = await Diet.create({
            userId: req.user._id,
            plan: finalPlan
        });

        res.status(201).json(newDiet);
    } catch (error) {
        console.error('DIET_GENERATION_FAILED:', error.message);
        if (error.message === 'SAFETY_FILTER_BLOCKED') {
            return res.status(400).json({
                message: 'Nutrition generation was blocked by safety filters. Please try modifying your preferences.',
                tip: 'Try selecting standard dietary preferences.'
            });
        }
        res.status(502).json({ 
            message: 'AI Nutritionist is currently experiencing high demand. Please try again in a few moments.',
            tip: 'Try slightly changing your goal or dietary preference.'
        });
    }
};

// @desc Get Diet Plan History
// @route GET /api/diet/history
exports.getDietHistory = async (req, res) => {
    try {
        const history = await Diet.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'History retrieval failed' });
    }
};

// @desc Log a food item/calories
// @route POST /api/diet/log
exports.logDiet = async (req, res) => {
    try {
        const { name, calories, protein, carbs, fats, date } = req.body;
        
        if (!name || calories === undefined) {
            return res.status(400).json({ message: 'Food name and calories are required' });
        }

        const log = await DietLog.create({
            userId: req.user._id,
            name,
            calories: Number(calories),
            protein: Number(protein) || 0,
            carbs: Number(carbs) || 0,
            fats: Number(fats) || 0,
            date: date || Date.now()
        });

        res.status(201).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get recent unique foods for suggestions
// @route GET /api/diet/recent-foods
exports.getRecentFoods = async (req, res) => {
    try {
        const logs = await DietLog.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        
        // Return unique food objects (latest one for each name to get recent macros/cals)
        const uniqueNames = new Set();
        const suggestions = [];
        
        for (const log of logs) {
            if (!uniqueNames.has(log.name)) {
                uniqueNames.add(log.name);
                suggestions.push({
                    name: log.name,
                    calories: log.calories,
                    protein: log.protein,
                    carbs: log.carbs,
                    fats: log.fats
                });
            }
            if (suggestions.length >= 10) break;
        }
        
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch suggestions' });
    }
};
// @desc Lookup nutrition data using AI (Gemini)
// @route GET /api/diet/lookup
exports.lookupNutrition = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }

        const nutritionData = await aiLookupNutrition(query);
        res.json(nutritionData);
    } catch (error) {
        console.error('AI_NUTRITION_LOOKUP_FAIL:', error.message);
        if (error.message === 'SAFETY_FILTER_BLOCKED') {
            return res.status(400).json({ message: 'Food lookup was blocked by safety filters. Please try another query.' });
        }
        res.status(502).json({ message: 'AI Nutrition lookup is busy. Please try again or enter values manually.' });
    }
};
