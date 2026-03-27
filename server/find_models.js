const OpenAI = require("openai");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, ".env") });

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

async function findModels() {
  try {
    console.log("Fetching models...");
    const response = await grok.models.list();
    const modelIds = response.data.map(m => m.id);
    console.log("Found models:", modelIds);
    fs.writeFileSync(path.join(__dirname, "found_models.json"), JSON.stringify(modelIds, null, 2));
    console.log("Saved to found_models.json");
  } catch (error) {
    console.error("Error fetching models:", error.message);
    fs.writeFileSync(path.join(__dirname, "error.log"), error.stack || error.message);
  }
}

findModels();
