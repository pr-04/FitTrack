const OpenAI = require("openai");
require('dotenv').config({ path: 'server/.env' });

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

async function test() {
    try {
        console.log("Testing with model: grok-4...");
        const completion = await grok.chat.completions.create({
            model: "grok-4",
            messages: [{ role: "user", content: "Hi" }],
        });
        console.log("Success:", completion.choices[0].message.content);
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Status:", error.status);
            console.error("Data:", error.response.data);
        }
    }
}

test();
