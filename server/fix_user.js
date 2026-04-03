const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    age: Number,
    height: Number,
    weight: Number
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function fixUser() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');
        
        const user = await User.findOne({ name: 'Priyanshu' });
        if (user) {
            console.log('User Found:', user.name);
            console.log('Current Height:', user.height);
            
            if (user.height === 138 && user.weight === 74) {
                user.height = 163;
                await user.save();
                console.log('Height fixed to 163cm!');
            } else {
                console.log('User height is already set or doesn\'t match the expected "corrupted" value of 138.');
                // Force it if name matches exactly?
                user.height = 163;
                await user.save();
                console.log('Forced height fix to 163cm!');
            }
        } else {
            console.log('User Priyanshu not found');
        }
        
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

// Since I am running this in the same env, I'll use the MONGO_URI from .env
const MONGO_URI = process.env.MONGO_URI;
fixUser();
