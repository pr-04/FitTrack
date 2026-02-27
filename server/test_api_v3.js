const axios = require('axios');
const apiKey = 'mg3vsaoVWDcKgbXWOsdKqvz7bM9GQaG1HHlqUXri';
const query = 'chicken';

async function test(url) {
    console.log(`Testing URL: ${url}`);
    try {
        const response = await axios.get(url, {
            params: { query },
            headers: { 'X-Api-Key': apiKey }
        });
        console.log(`Success ${url}:`, response.status);
        return true;
    } catch (error) {
        console.error(`Error ${url}:`, error.response?.status, error.response?.data);
        return false;
    }
}

async function runTests() {
    await test('https://api.calorieninjas.com/v1/nutrition');
    await test('https://api.api-ninjas.com/v1/nutrition');
}

runTests();
