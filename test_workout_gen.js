const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const testGeneration = async () => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing from .env");
            return;
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const goal = "lose_weight";
        const fitnessLevel = "beginner";
        const prompt = `
            You are an elite AI performance coach for FitTrack Premium. 
            Analyze the following user profile and architect a high-depth 7-day training program.
            
            User Goal: ${goal}
            Fitness Level: ${fitnessLevel}
            
            Requirements:
            1. Output MUST be ONLY a JSON object.
            2. Schema:
            {
              "plan": {
                "title": "ELITE PERFORMANCE: [Title]",
                "overview": "[Detailed strategic summary of the 7-day cycle]",
                "days": [
                  {
                    "day": "Day 1",
                    "type": "[Focus, e.g., Hypertrophy, Recovery]",
                    "exercises": [
                      { "name": "[Name]", "sets": 3, "reps": "10-12", "rest": "60s" }
                    ]
                  }
                ]
              }
            }
            3. Ensure at least one dedicated recovery day.
            4. Tailor exercises for ${goal}.
            5. EXACTLY 7 DAYS: The "days" array MUST contain exactly 7 entries (Day 1 through Day 7).
        `;

        console.log("Generating content with models/gemini-2.5-flash...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("RAW TEXT RECEIVED (first 100 chars):", text.substring(0, 100));
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("NO JSON MATCH FOUND");
            return;
        }
        
        const data = JSON.parse(jsonMatch[0]);
        console.log("SUCCESS: Plan received with", data.plan.days.length, "days");
    } catch (error) {
        console.error("GENERATION ERROR:", error.message);
    }
}

testGeneration();
