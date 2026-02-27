const axios = require('axios');
const apiKey = 'mg3vsaoVWDcKgbXWOsdKqvz7bM9GQaG1HHlqUXri';
const query = 'chicken';

async function test() {
    const url = `https://api.calorieninjas.com/v1/nutrition?query=${query}`;
    console.log('Testing URL:', url);
    console.log('Testing Key:', apiKey);

    try {
        const response = await axios.get(url, {
            headers: { 'X-Api-Key': apiKey }
        });
        console.log('Status:', response.status);
        console.log('Data:', response.data);
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', error.response?.data);
        console.error('Error Message:', error.message);
    }
}

test();
