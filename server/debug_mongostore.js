const MongoStore = require('connect-mongo');
console.log('MongoStore type:', typeof MongoStore);
console.log('MongoStore keys:', Object.keys(MongoStore));
if (MongoStore.default) {
    console.log('MongoStore.default type:', typeof MongoStore.default);
    console.log('MongoStore.default keys:', Object.keys(MongoStore.default));
}
