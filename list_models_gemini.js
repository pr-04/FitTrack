const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const listModels = async () => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await axios.get(url);
        
        const models = response.data.models.map(m => m.name.replace('models/', ''));
        console.log("MODELS_START");
        console.log(models.join(','));
        console.log("MODELS_END");
    } catch (error) {
        console.error("Error:", error.message);
    }
};

listModels();
