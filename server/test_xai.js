require('dotenv').config();
const https = require('https');
const fs = require('fs');

console.log('Using key starting with:', process.env.XAI_API_KEY?.substring(0, 15));

const options = {
  hostname: 'api.x.ai',
  path: '/v1/models',
  headers: { 'Authorization': 'Bearer ' + process.env.XAI_API_KEY }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const output = `Status: ${res.statusCode}\nResponse: ${data}`;
    fs.writeFileSync('api_test_result.txt', output);
    console.log('Status:', res.statusCode);
    console.log('Written to api_test_result.txt');
  });
}).on('error', e => console.error(e));
