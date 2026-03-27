const User = require('../models/User');
const Workout = require('../models/Workout');
const Weight = require('../models/Weight');
const AIPlan = require('../models/AIPlan');
const { grok, getCompletion } = require('../config/grok');

// Helper to convert Gemini history format to OpenAI/Grok format if needed
const convertHistory = (history) => {
    if (!history || !Array.isArray(history)) return [];
    return history.map(item => {
        // If it's already in OpenAI format
        if (item.content) return item;
        
        // If it's in Gemini format: { role: 'user'/'model', parts: [{ text: '...' }] }
        const role = item.role === 'model' ? 'assistant' : item.role;
        const content = item.parts && item.parts[0] ? item.parts[0].text : '';
        return { role, content };
    });
};

/**
 * @desc    Generate personalized workout plan
 * @route   POST /api/ai/workout-plan
 * @access  Private
 */
const generateWorkoutPlan = async (req, res) => {
    try {
        const { instruction, goal, workoutType, numExercises } = req.body;
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

            The plan MUST include:
            1. A full 7-day schedule (Day 1 to Day 7), NO EXCEPTIONS.
            2. Days 1 through 6 MUST be active workout days.
            3. Day 7 MUST be a Recovery or Optional day.
            4. Environment: This is a **${workoutType === 'home' ? 'HOME-ONLY' : 'GYM-ONLY'}** plan. 
               - If ${workoutType === 'home'}, use **ONLY** bodyweight, callisthenics, or common home items. **DO NOT** mention gym machines or barbells.
               - If ${workoutType === 'gym'}, use **ONLY** commercial gym equipment (cables, machines, barbells, dumbbells). **DO NOT** provide simple home/bodyweight exercises unless they are a standard gym warmup.
            5. Exercise Count: Provide exactly **${numExercises || 5} exercises** per workout day.
            6. Ensure all exercises are highly effective and relevant to the user's selected goal: ${goal || user.goal || 'maintain'}.
            7. Specific exercises for each workout day.
            8. Sets, Reps, and Weight for each exercise.
            9. A "completed" boolean field for each exercise, set to false by default.
            10. A brief motivational tip for the week.

            Please format the response as a clean JSON object with the following structure:
            {
                "title": "...",
                "overview": "...",
                "days": [
                    { 
                        "day": "Day 1", 
                        "type": "...", 
                        "exercises": [
                            { "name": "...", "sets": "...", "reps": "...", "weight": "...", "completed": false }
                        ] 
                    }
                ],
                "motivationalTip": "..."
            }
            CRITICAL: You must provide a plan for ALL 7 DAYS. 
            MUST return ONLY the JSON object.
        `;

        const completion = await getCompletion({
            model: "grok-4",
            messages: [
                { role: "system", content: "You are a professional AI Fitness Coach. Return only valid JSON." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        });

        const text = completion.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Invalid JSON from AI:', text);
            return res.status(500).json({ message: 'Invalid AI response format. Please try again.' });
        }
        const plan = JSON.parse(jsonMatch[0]);

        res.json(plan);
    } catch (error) {
        console.error('AI Workout Plan Error:', error);
        
        // Graceful Fallback if AI fails (e.g. no credits)
        if (error.status === 403 || error.status === 401) {
            return res.json({
                title: "Classic Strength Starter",
                overview: "Your AI Coach is currently on break, but here's a standard effective plan to keep you moving!",
                days: [
                    { 
                        day: "Day 1", 
                        type: "Full Body (Home)", 
                        exercises: [
                            { name: "Pushups", sets: "3", reps: "12", weight: "Bodyweight", completed: false }, 
                            { name: "Air Squats", sets: "3", reps: "20", weight: "Bodyweight", completed: false },
                            { name: "Lunges", sets: "3", reps: "10/side", weight: "Bodyweight", completed: false },
                            { name: "Burpees", sets: "3", reps: "10", weight: "Bodyweight", completed: false }
                        ] 
                    },
                    { 
                        day: "Day 2", 
                        type: "Upper Body (Gym)", 
                        exercises: [
                            { name: "Bench Press", sets: "3", reps: "10", weight: "40kg", completed: false }, 
                            { name: "Lat Pulldown", sets: "3", reps: "12", weight: "35kg", completed: false },
                            { name: "Dumbbell Rows", sets: "3", reps: "12/side", weight: "12kg", completed: false },
                            { name: "Overhead Press", sets: "3", reps: "10", weight: "20kg", completed: false }
                        ] 
                    },
                    { 
                        day: "Day 3", 
                        type: "Core & Cardio", 
                        exercises: [
                            { name: "Plank", sets: "3", reps: "60s", weight: "Bodyweight", completed: false }, 
                            { name: "Running", sets: "1", reps: "15 min", weight: "N/A", completed: false },
                            { name: "Mountain Climbers", sets: "3", reps: "30s", weight: "Bodyweight", completed: false },
                            { name: "Leg Raises", sets: "3", reps: "15", weight: "Bodyweight", completed: false }
                        ] 
                    },
                    { 
                        day: "Day 4", 
                        type: "Lower Body (Gym)", 
                        exercises: [
                            { name: "Leg Press", sets: "3", reps: "12", weight: "80kg", completed: false }, 
                            { name: "Leg Curls", sets: "3", reps: "10", weight: "25kg", completed: false },
                            { name: "Calf Raises", sets: "4", reps: "15", weight: "40kg", completed: false },
                            { name: "Goblet Squats", sets: "3", reps: "12", weight: "16kg", completed: false }
                        ] 
                    },
                    { 
                        day: "Day 5", 
                        type: "Push (Gym/Home Mix)", 
                        exercises: [
                            { name: "Dumbbell Shoulder Press", sets: "3", reps: "12", weight: "10kg/side", completed: false }, 
                            { name: "Diamond Pushups", sets: "3", reps: "10", weight: "Bodyweight", completed: false },
                            { name: "Tricep Dips", sets: "3", reps: "12", weight: "Bench", completed: false },
                            { name: "Lateral Raises", sets: "3", reps: "15", weight: "5kg", completed: false }
                        ] 
                    },
                    { 
                        day: "Day 6", 
                        type: "Pull (Gym/Home Mix)", 
                        exercises: [
                            { name: "Seated Rows", sets: "3", reps: "12", weight: "30kg", completed: false }, 
                            { name: "Reverse Crunches", sets: "3", reps: "15", weight: "Bodyweight", completed: false },
                            { name: "Hammer Curls", sets: "3", reps: "12", weight: "10kg", completed: false },
                            { name: "Face Pulls", sets: "3", reps: "15", weight: "15kg", completed: false }
                        ] 
                    },
                    { day: "Day 7", type: "Recovery & Optional", exercises: [] }
                ],
                motivationalTip: "Consistency is more important than perfection. Keep going!"
            });
        }
        
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

        const completion = await getCompletion({
            model: "grok-4",
            messages: [
                { role: "system", content: "You are a professional Nutritionist AI. Return only valid JSON." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        });

        const text = completion.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Invalid JSON from AI:', text);
            return res.status(500).json({ message: 'Invalid AI response format for diet. Please try again.' });
        }
        const diet = JSON.parse(jsonMatch[0]);

        res.json(diet);
    } catch (error) {
        console.error('AI Diet Plan Error:', error);

        // Graceful Fallback
        if (error.status === 403 || error.status === 401) {
            return res.json({
                dailyCalories: "2000-2200",
                macros: { protein: "150g", carbs: "200g", fats: "70g" },
                meals: { 
                    breakfast: ["Oatmeal with berries and nuts"], 
                    lunch: ["Grilled chicken salad with quinoa"], 
                    dinner: ["Baked salmon with steamed vegetables"], 
                    snacks: ["Greek yogurt", "A handful of almonds"] 
                },
                hydrationAdvice: "Aim for at least 3-4 liters of water daily."
            });
        }

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

        const completion = await getCompletion({
            model: "grok-4",
            messages: [
                { role: "system", content: "Analyze the user fitness data and provide insights. Return only valid JSON." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        });

        const text = completion.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI response did not contain valid JSON');
        }
        const insights = JSON.parse(jsonMatch[0]);

        res.json(insights);
    } catch (error) {
        console.error('AI Insights Error:', error);

        // Graceful Fallback for Dashboard
        if (error.status === 403 || error.status === 401) {
            return res.json({
                dailyReminder: "Focus on the process, and the results will follow. You've got this!",
                healthWarning: "AI Analysis is currently paused. Please check your account credits at console.x.ai.",
                progressAnalysis: "Analyzing your data requires active AI credits. However, keep logging your data to track it manually!"
            });
        }

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
        const messages = [
            { role: "system", content: "You are a professional AI Fitness Coach. Provide helpful, concise fitness and nutrition advice." },
            ...convertHistory(history),
            { role: "user", content: message }
        ];

        const completion = await getCompletion({
            model: "grok-4",
            messages,
            max_tokens: 500,
        });

        res.json({ message: completion.choices[0].message.content });
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
        const messages = [
            { role: "system", content: "You are an AI Fitness Coach. The user is asking about their current plan. Answer specifically in the context of this plan." },
            { role: "system", content: `CURRENT PLAN DATA: ${JSON.stringify(planData)}` },
            ...convertHistory(history),
            { role: "user", content: message }
        ];

        const completion = await getCompletion({
            model: "grok-4",
            messages,
            max_tokens: 500,
        });

        res.json({ message: completion.choices[0].message.content });
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

/**
 * @desc    Update an AI-generated plan (e.g. checkbox state)
 * @route   PUT /api/ai/plan/:id
 * @access  Private
 */
const updatePlan = async (req, res) => {
    try {
        const { data } = req.body;
        const plan = await AIPlan.findById(req.params.id);
        
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        
        // Ensure user owns the plan
        if (plan.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const updatedPlan = await AIPlan.findByIdAndUpdate(
            req.params.id,
            { data },
            { new: true }
        );
        
        res.json(updatedPlan);
    } catch (error) {
        console.error('Update AI Plan Error:', error);
        res.status(500).json({ message: 'Failed to update plan' });
    }
};

module.exports = {
    generateWorkoutPlan,
    generateDietPlan,
    savePlan,
    getUserPlans,
    deletePlan,
    updatePlan,
    chatAboutPlan,
    getDashboardInsights,
    chatWithCoach
};
