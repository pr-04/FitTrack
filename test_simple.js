const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const testSimple = async () => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        console.log("Testing with gemini-2.0-flash (Simple Prompt)...");
        const result = await model.generateContent("Hi");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (error) {
        console.error("Simple Test Error:", error.message);
    }
}

testSimple();
