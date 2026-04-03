const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const listModels = async () => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await axios.get(url);
        
        const models = response.data.models.map(m => m.name);
        console.log("--- START ---");
        for (const m of models) {
            console.log(m);
        }
        console.log("--- END ---");
    } catch (error) {
        console.error("Error:", error.message);
    }
};

listModels();
