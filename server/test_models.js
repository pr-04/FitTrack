const OpenAI = require("openai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

const models = ["grok-4", "grok-3", "grok-4-1-fast-non-reasoning", "grok-4.20-non-reasoning"];

async function testModels() {
  for (const model of models) {
    try {
      console.log(`Testing model: ${model}...`);
      const completion = await grok.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5,
      });
      console.log(`Success with ${model}:`, completion.choices[0].message.content);
      return; // Stop if success
    } catch (error) {
      console.error(`Failed ${model}:`, error.message);
    }
  }
}

testModels();
