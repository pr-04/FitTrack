const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    age: Number,
    height: Number,
    weight: Number
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const user = await User.findOne({ name: 'Priyanshu' });
        if (user) {
            console.log('User Found:');
            console.log('Name:', user.name);
            console.log('Age:', user.age);
            console.log('Height (stored):', user.height);
            console.log('Weight (stored):', user.weight);
            
            const bmi = user.weight / ((user.height / 100) ** 2);
            console.log('Calculated BMI from these values:', bmi.toFixed(2));
        } else {
            console.log('User Priyanshu not found');
        }
        
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
