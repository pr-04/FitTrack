const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const testAPI = async (modelName = "gemini-2.5-flash") => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        console.log(`\n--- Testing with model: ${modelName} ---`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Respond with 'SUCCESS'");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (error) {
        console.error("FAILURE:", error.message);
    }
};

(async () => {
    await testAPI("gemini-2.5-flash");
})();
