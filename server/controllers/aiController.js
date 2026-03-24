const User = require('../models/User');
const Workout = require('../models/Workout');
const Weight = require('../models/Weight');
const AIPlan = require('../models/AIPlan');
const model = require('../config/gemini');

/**
 * @desc    Generate personalized workout plan
 * @route   POST /api/ai/workout-plan
 * @access  Private
 */
const generateWorkoutPlan = async (req, res) => {
    try {
        const { instruction, goal } = req.body;
        const user = req.user;
        const weights = await Weight.find({ userId: user._id }).sort({ date: -1 }).limit(5);

        const bmi = user.weight && user.height 
            ? (user.weight / ((user.height / 100) ** 2)).toFixed(2) 
            : 'N/A';

        const prompt = `
            As a professional AI Fitness Coach, create a personalized weekly workout plan for a user with the following profile:
            - Name: ${user.name}
            - Goal: ${goal || user.goal || 'maintain'}
            - Weight: ${user.weight || '70'} kg
            - Height: ${user.height || '175'} cm
            - BMI: ${bmi}
            - Recent Weight History: ${weights.map(w => `${w.weight}kg on ${w.date.toLocaleDateString()}`).join(', ')}
            ${instruction ? `- Specific User Instructions/Adjustments: ${instruction}` : ''}

            The plan should include:
            1. A 7-day schedule (including rest days).
            2. Specific exercises for each workout day.
            3. Sets and Reps for each exercise.
            4. A brief motivational tip for the week.

            Please format the response as a clean JSON object with the following structure:
            {
                "title": "...",
                "overview": "...",
                "days": [
                    { "day": "Day 1", "type": "...", "exercises": [{ "name": "...", "sets": "...", "reps": "...", "weight": "..." }] }
                ],
                "motivationalTip": "..."
            }
            MUST return ONLY the JSON object.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        if (!response.candidates || response.candidates.length === 0) {
            console.error('AI Generation Blocked or No Candidates');
            return res.status(500).json({ message: 'AI failed to generate content. Please try a different goal or instruction.' });
        }

        const text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Invalid JSON from AI:', text);
            return res.status(500).json({ message: 'Invalid AI response format. Please try again.' });
        }
        const plan = JSON.parse(jsonMatch[0]);

        res.json(plan);
    } catch (error) {
        console.error('AI Workout Plan Error:', error);
        res.status(500).json({ message: error.message || 'Failed to generate workout plan' });
    }
};

/**
 * @desc    Generate personalized diet plan
 * @route   POST /api/ai/diet-plan
 * @access  Private
 */
const generateDietPlan = async (req, res) => {
    try {
        const { instruction, goal } = req.body;
        const user = req.user;
        const bmi = user.weight && user.height 
            ? (user.weight / ((user.height / 100) ** 2)).toFixed(2) 
            : 'N/A';

        const prompt = `
            As a professional Nutritionist AI, create a personalized weekly diet plan for:
            - Name: ${user.name}
            - Goal: ${goal || user.goal || 'maintain'}
            - Current Weight: ${user.weight || '70'} kg
            - Height: ${user.height || '175'} cm
            - BMI: ${bmi}
            ${instruction ? `- Specific User Instructions/Adjustments: ${instruction}` : ''}

            Include:
            1. Daily calorie target.
            2. Macros breakdown (Protein, Carbs, Fats).
            3. Meal suggestions (Breakfast, Lunch, Dinner, Snacks).
            4. Hydration advice.

            Format as a clean JSON object:
            {
                "dailyCalories": "...",
                "macros": { "protein": "...", "carbs": "...", "fats": "..." },
                "meals": { "breakfast": ["..."], "lunch": ["..."], "dinner": ["..."], "snacks": ["..."] },
                "hydrationAdvice": "..."
            }
            MUST return ONLY the JSON object.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        if (!response.candidates || response.candidates.length === 0) {
            console.error('AI Diet Plan Blocked or No Candidates');
            return res.status(500).json({ message: 'AI failed to generate diet content. Please try a different goal.' });
        }

        const text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Invalid JSON from AI:', text);
            return res.status(500).json({ message: 'Invalid AI response format for diet. Please try again.' });
        }
        const diet = JSON.parse(jsonMatch[0]);

        res.json(diet);
    } catch (error) {
        console.error('AI Diet Plan Error:', error);
        res.status(500).json({ message: error.message || 'Failed to generate diet plan' });
    }
};

/**
 * @desc    Save an AI-generated plan
 * @route   POST /api/ai/save-plan
 * @access  Private
 */
const savePlan = async (req, res) => {
    try {
        const { type, data, instruction } = req.body;
        if (!type || !data) {
            return res.status(400).json({ message: 'Type and data are required' });
        }

        const newPlan = await AIPlan.create({
            userId: req.user._id, // FORCE current user ID
            type,
            data,
            instruction: instruction || '',
        });

        res.status(201).json(newPlan);
    } catch (error) {
        console.error('Save AI Plan Error:', error);
        res.status(500).json({ message: 'Failed to save plan' });
    }
};

/**
 * @desc    Get all saved plans for the user
 * @route   GET /api/ai/my-plans
 * @access  Private
 */
const getUserPlans = async (req, res) => {
    try {
        const userId = req.user._id;
        const plans = await AIPlan.find({ userId }).sort({ createdAt: -1 });
        res.json(plans);
    } catch (error) {
        console.error('Get AI Plans Error:', error);
        res.status(500).json({ message: 'Failed to retrieve plans' });
    }
};

/**
 * @desc    Get AI Dashboard Insights (Reminders, Warnings, Analysis)
 * @route   GET /api/ai/dashboard-insights
 * @access  Private
 */
const getDashboardInsights = async (req, res) => {
    try {
        const user = req.user;
        const recentWorkouts = await Workout.find({ userId: user._id }).sort({ date: -1 }).limit(5);
        const recentWeights = await Weight.find({ userId: user._id }).sort({ date: -1 }).limit(5);

        const bmi = user.weight && user.height 
            ? (user.weight / ((user.height / 100) ** 2)).toFixed(2) 
            : 'N/A';

        const prompt = `
            Analyze the following user fitness data and provide insights:
            - User Goal: ${user.goal || 'maintain'}
            - Current BMI: ${bmi}
            - Current Weight: ${user.weight || '70'} kg
            - Recent Workouts: ${JSON.stringify(recentWorkouts)}
            - Recent Weight History: ${JSON.stringify(recentWeights)}

            Provide exactly:
            1. A daily reminder/motivation (short).
            2. Risk & Health Warning based on BMI (Underweight, Normal, Overweight, Obese) and trends.
            3. A brief progress analysis.

            Format as a clean JSON object:
            {
                "dailyReminder": "...",
                "healthWarning": "...",
                "progressAnalysis": "..."
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI response did not contain valid JSON');
        }
        const insights = JSON.parse(jsonMatch[0]);

        res.json(insights);
    } catch (error) {
        console.error('AI Insights Error:', error);
        res.status(500).json({ message: 'Failed to get AI insights' });
    }
};

/**
 * @desc    Chat with AI Fitness Coach
 * @route   POST /api/ai/chat
 * @access  Private
 */
const chatWithCoach = async (req, res) => {
    const { message, history } = req.body;
    try {
        const chat = model.startChat({
            history: history || [],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        res.json({ message: response.text() });
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ message: 'AI coach is currently unavailable' });
    }
};

/**
 * @desc    Chat about a specific plan
 * @route   POST /api/ai/chat-about-plan
 * @access  Private
 */
const chatAboutPlan = async (req, res) => {
    const { message, planData, history } = req.body;
    try {
        const contextPrompt = `
            You are an AI Fitness Coach. The user is asking about their current plan:
            ${JSON.stringify(planData)}
            
            Please answer their question specifically in the context of this plan.
            User Message: ${message}
        `;

        const chat = model.startChat({
            history: history || [],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(contextPrompt);
        const response = await result.response;
        res.json({ message: response.text() });
    } catch (error) {
        console.error('AI Plan Chat Error:', error);
        res.status(500).json({ message: 'Failed to get AI response for the plan' });
    }
};

/**
 * @desc    Delete a saved plan
 * @route   DELETE /api/ai/plan/:id
 * @access  Private
 */
const deletePlan = async (req, res) => {
    try {
        const plan = await AIPlan.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        
        // Ensure user owns the plan
        if (plan.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await AIPlan.findByIdAndDelete(req.params.id);
        res.json({ message: 'Plan removed' });
    } catch (error) {
        console.error('Delete AI Plan Error:', error);
        res.status(500).json({ message: 'Failed to delete plan' });
    }
};

module.exports = {
    generateWorkoutPlan,
    generateDietPlan,
    savePlan,
    getUserPlans,
    deletePlan,
    chatAboutPlan,
    getDashboardInsights,
    chatWithCoach
};
