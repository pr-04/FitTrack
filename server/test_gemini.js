const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testGemini() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        console.log("Testing Gemini with key:", process.env.GEMINI_API_KEY);
        
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (error) {
        console.error("Gemini Test Failed:", error.message);
    }
}

testGemini();
