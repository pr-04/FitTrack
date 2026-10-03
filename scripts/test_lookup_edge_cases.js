const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const { lookupNutrition } = require('../server/services/aiService');

const cases = [
    { name: "empty string", query: "" },
    { name: "gibberish", query: "asdf qwer" },
    { name: "non-food", query: "a brick" },
    { name: "very large quantity", query: "50 kg rice" },
    { name: "non-English query", query: "दो रोटी और दाल" }
];

async function runEdgeCases() {
    console.log("--- RUNNING 5 LOOKUP EDGE CASES ---");
    const results = [];

    for (const c of cases) {
        try {
            const res = await lookupNutrition(c.query);
            results.push({
                Query: c.query || '""',
                Description: c.name,
                Result: `${res.calories} kcal | ${res.protein}g P | ${res.carbs}g C | ${res.fats}g F`,
                Status: "SUCCESS",
                NeedsConfirmation: res.needsConfirmation ? "TRUE (Needs Confirmation)" : "FALSE",
                Error: null
            });
        } catch (err) {
            results.push({
                Query: c.query || '""',
                Description: c.name,
                Result: `Clean Error: ${err.message}`,
                Status: err.message === 'COULD_NOT_ESTIMATE' ? "CLEAN_ERROR" : "FAILED",
                NeedsConfirmation: "N/A",
                Error: err.message
            });
        }
    }

    console.table(results);
}

runEdgeCases();
