const Diet = require('../models/Diet');
const Log = require('../models/Log');
const DietLog = require('../models/DietLog');
const { genAI, safetySettings } = require('../config/gemini');

// Helper to clean AI JSON responses
const cleanAIJSON = (text) => {
    return text.replace(/```json|```/g, "").trim();
};

// @desc Generate an AI Diet Plan
// @route POST /api/diet/generate
exports.generateDiet = async (req, res) => {
    try {
        const { goal, dietType } = req.body;
        
        if (!req.user) {
            return res.status(401).json({ message: "User session expired. Please log in again." });
        }

        // 1. Initialize modern model with System Instructions
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "You are an expert AI nutritionist for FitTrack Premium. Your mission is to architect high-depth, strictly structured 7-day meal roadmaps. You must output ONLY valid JSON that conforms to the user requested schema. Never include conversational text before or after the JSON. Focus on macronutrient balance and premium, varied food suggestions.",
        });

        // 2. Configure Native JSON output
        const generationConfig = {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
        };

        const userGoal = goal || req.user.goal || 'maintain';
        const userDiet = dietType || req.user.dietType || 'any';

        const prompt = `
            Create a professional 7-day meal plan for a user with the goal: ${userGoal.replace('_', ' ')}.
            Dietary Preference: ${userDiet}

            Special Instructions for Goals:
            - Fat Loss: Focus on a caloric deficit, high volume low calorie foods, and high protein.
            - Muscle Gain: Focus on a caloric surplus with high protein (1.8g-2.2g per kg) and complex carbs.
            - Body Recomposition: Focus on maintenance calories with very high protein and timing carbs around workouts.
            - Strength & Endurance: Focus on high carbohydrate intake for glycogen replenishment.
            - Flexibility & General Fitness: Focus on micronutrient density, anti-inflammatory foods, and balanced macros.
            - Maintain: Focus on balanced macros to stay at current weight.

            JSON Schema:
            {
              "plan": {
                "dailyCalories": number,
                "macros": { "protein": "string", "carbs": "string", "fats": "string" },
                "meals": {
                    "Breakfast": ["Option 1", "Option 2"],
                    "Lunch": ["Option 1", "Option 2"],
                    "Snacks": ["Option 1", "Option 2"],
                    "Dinner": ["Option 1", "Option 2"]
                }
              }
            }
            ONLY include the 4 categories: "Breakfast", "Lunch", "Snacks", "Dinner".
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error("The nutrition engine is currently unavailable due to safety filters. Try a different dietary preference.");
        }

        const text = response.text();
        let dietData;
        
        try {
            const cleanedText = cleanAIJSON(text);
            dietData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("Native JSON Parse Failure:", text);
            throw new Error("Failed to parse the nutrition plan. Please try again.");
        }

        // Flatten if AI returned an array, and extract inner plan if exists
        let planData = Array.isArray(dietData) ? dietData[0] : dietData;
        const finalPlan = planData.plan || planData;

        const newDiet = await Diet.create({
            userId: req.user._id,
            plan: finalPlan
        });

        res.status(201).json(newDiet);
    } catch (error) {
        console.error('MODERN_DIET_FAIL:', error.message);
        res.status(500).json({ 
            message: 'Nutrition Generation Failed: ' + error.message,
            tip: "Try slightly changing your goal or dietary preference."
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

        // Initialize Gemini (matching workoutController pattern)
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are a precise nutrition database for FitTrack Premium. Given a food name and amount (weight/quantity), provide estimated calories, protein, carbs, and fats. Output MUST be ONLY valid JSON matching the schema. No conversational text.",
        });

        const prompt = `
            Estimate the nutritional value for: ${query}
            
            Return JSON in this format:
            {
                "calories": number,
                "protein": number,
                "carbs": number,
                "fats": number
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const cleanedText = cleanAIJSON(text);
        const nutritionData = JSON.parse(cleanedText);

        res.json({
            name: query,
            calories: Math.round(nutritionData.calories || 0),
            protein: Math.round(nutritionData.protein || 0),
            carbs: Math.round(nutritionData.carbs || 0),
            fats: Math.round(nutritionData.fats || 0)
        });
    } catch (error) {
        console.error('AI_NUTRITION_LOOKUP_FAIL:', error.message);
        res.status(500).json({ message: 'AI Nutrition estimation failed. ' + error.message });
    }
};
