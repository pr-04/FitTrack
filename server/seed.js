const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const User = require('./models/User');
const Workout = require('./models/Workout');
const Food = require('./models/Food');
const Weight = require('./models/Weight');

// Connect to DB
connectDB();

// Exercises to randomly pick from
const EXERCISES = [
    'Bench Press', 'Squat', 'Deadlift', 'Pull-ups', 'Push-ups',
    'Shoulder Press', 'Bicep Curl', 'Rows'
];

// Helper to get a date offset by days
const getDateOffset = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(12, 0, 0, 0); // Noon
    return d;
};

// Seed function
const importData = async () => {
    try {
        // Clear existing data
        await User.deleteMany();
        await Workout.deleteMany();
        await Food.deleteMany();
        await Weight.deleteMany();

        console.log('Existing DB Cleared...');

        // 1. Create a Demo User
        const user = await User.create({
            name: 'Demo User',
            email: 'demo@demo.com',
            password: 'password123', // Will be hashed by pre-save hook
            height: 180,
            weight: 80,
            goal: 'lose_weight',
        });

        const userId = user._id;
        console.log('Created Demo User: demo@demo.com / password123');

        // 2. Generate 14 days of Weight data (progressively losing weight)
        let currentWeight = 82;
        for (let i = 13; i >= 0; i--) {
            // Lose ~0.1 to 0.3 kg per day
            currentWeight -= (Math.random() * 0.2 + 0.1);

            await Weight.create({
                userId,
                weight: Number(currentWeight.toFixed(1)),
                date: getDateOffset(i)
            });
        }
        console.log('Inserted Weight history');

        // 3. Generate 7 days of Calories/Foods
        const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
        for (let i = 6; i >= 0; i--) {
            const date = getDateOffset(i);

            // Add 3-4 meals per day
            const mealsToday = 3 + Math.floor(Math.random() * 2);
            for (let j = 0; j < mealsToday; j++) {
                await Food.create({
                    userId,
                    foodName: `Demo Meal ${j + 1}`,
                    calories: 300 + Math.floor(Math.random() * 400), // 300 - 700 kcal
                    mealType: meals[j % 4],
                    date: date
                });
            }
        }
        console.log('Inserted Food logs');

        // 4. Generate Workouts for the last 7 days (working out every other day)
        for (let i = 6; i >= 0; i -= 2) {
            const date = getDateOffset(i);

            // 3-4 exercises per workout
            const exercisesToday = 3 + Math.floor(Math.random() * 2);
            for (let j = 0; j < exercisesToday; j++) {
                const exercise = EXERCISES[Math.floor(Math.random() * EXERCISES.length)];
                await Workout.create({
                    userId,
                    exercise,
                    sets: 3,
                    reps: 8 + Math.floor(Math.random() * 5),
                    weight: 20 + Math.floor(Math.random() * 60),
                    date: date
                });
            }
        }
        console.log('Inserted Workout logs');

        console.log('✅ DATABASE SUCCESSFULLY SEEDED WITH DEMO DATA!');
        process.exit();

    } catch (error) {
        console.error(`❌ Error seeding database: ${error.message}`);
        process.exit(1);
    }
};

importData();
