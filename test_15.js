const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const test15 = async () => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        console.log("Testing with gemini-2.5-flash (Simple Prompt)...");
        const result = await model.generateContent("Hi");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (error) {
        console.error("1.5 Test Error:", error.message);
    }
}

test15();
