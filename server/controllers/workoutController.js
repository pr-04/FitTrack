const Workout = require('../models/Workout');
const Log = require('../models/Log');
const WorkoutLog = require('../models/WorkoutLog');
const { genAI, safetySettings } = require('../config/gemini');

// Helper to clean AI JSON responses
const cleanAIJSON = (text) => {
    return text.replace(/```json|```/g, "").trim();
};

// @desc Generate an AI Workout Plan
// @route POST /api/workout/generate
exports.generateWorkout = async (req, res) => {
    try {
        const { goal, fitnessLevel } = req.body;
        
        if (!req.user) {
            return res.status(401).json({ message: "User session expired. Please log in again." });
        }

        // 1. Initialize modern model with System Instructions
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are an elite AI performance coach for FitTrack Premium. Your mission is to architect high-depth, strictly structured 7-day training programs. You must output ONLY valid JSON that conforms to the user requested schema. Never include conversational text before or after the JSON.",
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
        const userLevel = fitnessLevel || req.user.activityLevel || 'moderate';

        const prompt = `
            Create a professional 7-day workout plan for a user with the goal: ${userGoal.replace('_', ' ')}.
            Fitness Level: ${userLevel}

            Special Instructions for Goals:
            - Flexibility: Focus on yoga, static stretching, and mobility routines.
            - Endurance: Focus on zone 2 cardio, long-distance running/cycling, and high-rep endurance circuits.
            - Strength: Focus on heavy compound lifts, low reps (1-5), and longer rest periods.
            - Body Recomposition: Balance resistance training with minimal cardio and focus on bodyweight/weighted movements.
            - Fat Loss: High-intensity interval training (HIIT) paired with steady-state cardio.
            - Muscle Gain: Hypertrophy focus (8-12 reps) with progressive overload.
            - General Fitness: A balanced mix of cardio and resistance training.
            - Maintain: Steady maintenance routine to keep current fitness levels.

            JSON Schema:
            {
              "plan": {
                "title": "ELITE PERFORMANCE: [Title]",
                "overview": "[Strategy summary]",
                "days": [
                  {
                    "day": "Day 1",
                    "type": "[Focus]",
                    "exercises": [
                      { "name": "[Name]", "sets": number, "reps": "string", "rest": "string" }
                    ]
                  }
                ]
              }
            }
            Ensure exactly 7 days are included.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error("The AI coach is currently unavailable due to safety filters. Try a different goal.");
        }

        const text = response.text();
        let workoutData;
        
        try {
            const cleanedText = cleanAIJSON(text);
            workoutData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("Native JSON Parse Failure:", text);
            throw new Error("Failed to parse the coach's plan. Please try again.");
        }

        // Flatten if AI returned an array, and extract inner plan if exists
        let planData = Array.isArray(workoutData) ? workoutData[0] : workoutData;
        const finalPlan = planData.plan || planData;

        const newWorkout = await Workout.create({
            userId: req.user._id,
            plan: finalPlan
        });

        res.status(201).json(newWorkout);
    } catch (error) {
        console.error('MODERN_GEN_FAIL:', error.message);
        res.status(500).json({ 
            message: 'Coach Generation Failed: ' + error.message,
            tip: "Check your API key and network connection."
        });
    }
};

// @desc Get Workout Plan History
// @route GET /api/workout/history
exports.getWorkoutHistory = async (req, res) => {
    try {
        const history = await Workout.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'History retrieval failed' });
    }
};

// @desc Log a completed workout exercise
// @route POST /api/workout/log
exports.logWorkout = async (req, res) => {
    try {
        const { exercise, sets, reps, weight, date } = req.body;
        
        if (!exercise || !sets || !reps) {
            return res.status(400).json({ message: 'Exercise, sets, and reps are required' });
        }

        const log = await WorkoutLog.create({
            userId: req.user._id,
            exercise,
            sets,
            reps,
            weight: weight || 0,
            date: date || Date.now()
        });

        res.status(201).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get recent unique exercises for suggestions
// @route GET /api/workout/recent-exercises
exports.getRecentExercises = async (req, res) => {
    try {
        const logs = await WorkoutLog.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        
        const uniqueExercises = [...new Set(logs.map(l => l.exercise))].slice(0, 10);
        res.json(uniqueExercises);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch suggestions' });
    }
};

// @desc Delete a Specific Workout Plan
// @route DELETE /api/workout/history/:id
exports.deleteWorkout = async (req, res) => {
    try {
        const workout = await Workout.findById(req.params.id);
        
        if (!workout) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Check ownership
        if (workout.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await workout.deleteOne();
        res.json({ message: 'Plan removed securely' });
    } catch (error) {
        console.error('Workout Deletion Error:', error);
        res.status(500).json({ message: 'Architecture disposal failed' });
    }
};
