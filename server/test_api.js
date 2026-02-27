const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.CALORIE_NINJAS_API_KEY;
const query = 'chicken';

console.log('Key:', apiKey);
console.log('Key Length:', apiKey?.length);

async function test() {
    try {
        const response = await axios.get('https://api.calorieninjas.com/v1/nutrition', {
            params: { query },
            headers: { 'X-Api-Key': apiKey?.trim() }
        });
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Error Message:', error.message);
    }
}

test();
