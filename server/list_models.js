const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // In the latest SDK, listModels might not be directly available or structured differently.
        // But we can try a simple generation with "gemini-pro" which is a safe bet.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("test");
        console.log("Gemini Pro Success!");
    } catch (error) {
        console.error("Gemini Pro Failed:", error.message);
    }
}

listModels();
