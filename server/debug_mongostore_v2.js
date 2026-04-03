const MongoStoreRaw = require('connect-mongo');
const MongoStore = MongoStoreRaw.default || MongoStoreRaw;

console.log('Final MongoStore type:', typeof MongoStore);
console.log('Has .create:', typeof MongoStore.create === 'function');
