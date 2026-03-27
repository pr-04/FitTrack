const OpenAI = require("openai");

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY || "dummy_key", // Fallback to avoid crash during init
  baseURL: "https://api.x.ai/v1",
});

// Use a helper to get completion to ensure key is loaded
const getCompletion = async (params) => {
    if (!process.env.XAI_API_KEY) {
        throw new Error("XAI_API_KEY is not defined in environment variables");
    }
    return grok.chat.completions.create(params);
};

module.exports = { grok, getCompletion };
