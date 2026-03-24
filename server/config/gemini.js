const { GoogleGenerativeAI } = require("@google/generative-ai");

// Specify v1beta as some newer models are only available there for this key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, { apiVersion: "v1beta" });
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

module.exports = model;
