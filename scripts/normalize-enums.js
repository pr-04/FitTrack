// WARNING: Do NOT run --execute on live database until approved.

const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/models/User');

/**
 * Mapping rules for canonical enum values.
 * Performs case-insensitive, trimmed matching.
 * Unknown / null / undefined values return unchanged.
 */
function normalizeWorkoutLocation(value) {
    if (typeof value !== 'string') return value;
    const clean = value.trim().toLowerCase();
    if (clean === 'home') return 'home';
    if (clean === 'gym') return 'gym';
    return value; // unknown value left unchanged
}

function normalizeDietType(value) {
    if (typeof value !== 'string') return value;
    const clean = value.trim().toLowerCase();
    if (clean === 'veg' || clean === 'vegetarian') return 'vegetarian';
    if (clean === 'non-veg' || clean === 'non-vegetarian') return 'non-vegetarian';
    if (clean === 'vegan') return 'vegan';
    if (clean === 'pescatarian') return 'pescatarian';
    if (clean === 'any') return 'any';
    return value; // unknown value left unchanged
}

function normalizeGoal(value) {
    if (typeof value !== 'string') return value;
    const clean = value.trim().toLowerCase();
    if (clean === 'lose_weight' || clean === 'fat_loss') return 'fat_loss';
    if ([
        'muscle_gain',
        'body_recomposition',
        'maintain',
        'strength',
        'endurance',
        'general_fitness',
        'flexibility'
    ].includes(clean)) {
        return clean;
    }
    return value; // unknown value left unchanged
}

/**
 * Normalize all 3 user enum fields on a user object/document.
 */
function normalizeUserEnums(userDoc) {
    if (!userDoc) return userDoc;
    const normalized = {};

    if (userDoc.workoutLocation !== undefined) {
        normalized.workoutLocation = normalizeWorkoutLocation(userDoc.workoutLocation);
    }
    if (userDoc.dietType !== undefined) {
        normalized.dietType = normalizeDietType(userDoc.dietType);
    }
    if (userDoc.goal !== undefined) {
        normalized.goal = normalizeGoal(userDoc.goal);
    }

    return normalized;
}

/**
 * Core migration logic, runnable in dry-run or execute mode.
 */
async function runEnumNormalization({
    UserModel = User,
    isDryRun = true,
    confirmDbName = null,
    targetDbName = null,
    isProd = process.env.NODE_ENV === 'production'
} = {}) {
    if (isProd) {
        throw new Error('Refusing to run enum normalization in production environment (NODE_ENV=production).');
    }

    if (!isDryRun && confirmDbName !== targetDbName) {
        throw new Error(`Database name confirmation mismatch. Expected "${targetDbName}", got "${confirmDbName}". Aborting.`);
    }

    const users = await UserModel.find({}).lean();

    const beforeCounts = { workoutLocation: {}, dietType: {}, goal: {} };
    const afterCounts = { workoutLocation: {}, dietType: {}, goal: {} };
    const unknownValues = { workoutLocation: {}, dietType: {}, goal: {} };

    let totalUsers = users.length;
    let usersNeedingUpdate = 0;
    let updatedUsersCount = 0;

    const KNOWN_WORKOUT_LOCATIONS = new Set(['home', 'gym']);
    const KNOWN_DIET_TYPES = new Set(['vegetarian', 'non-vegetarian', 'vegan', 'pescatarian', 'any']);
    const KNOWN_GOALS = new Set(['fat_loss', 'muscle_gain', 'body_recomposition', 'maintain', 'strength', 'endurance', 'general_fitness', 'flexibility']);

    for (const u of users) {
        const origLoc = u.workoutLocation;
        const origDiet = u.dietType;
        const origGoal = u.goal;

        // Record before counts
        const locKey = String(origLoc);
        const dietKey = String(origDiet);
        const goalKey = String(origGoal);

        beforeCounts.workoutLocation[locKey] = (beforeCounts.workoutLocation[locKey] || 0) + 1;
        beforeCounts.dietType[dietKey] = (beforeCounts.dietType[dietKey] || 0) + 1;
        beforeCounts.goal[goalKey] = (beforeCounts.goal[goalKey] || 0) + 1;

        // Compute normalized
        const normLoc = normalizeWorkoutLocation(origLoc);
        const normDiet = normalizeDietType(origDiet);
        const normGoal = normalizeGoal(origGoal);

        // Record after counts
        const normLocKey = String(normLoc);
        const normDietKey = String(normDiet);
        const normGoalKey = String(normGoal);

        afterCounts.workoutLocation[normLocKey] = (afterCounts.workoutLocation[normLocKey] || 0) + 1;
        afterCounts.dietType[normDietKey] = (afterCounts.dietType[normDietKey] || 0) + 1;
        afterCounts.goal[normGoalKey] = (afterCounts.goal[normGoalKey] || 0) + 1;

        // Track unknown values
        if (normLoc !== undefined && !KNOWN_WORKOUT_LOCATIONS.has(normLoc)) {
            unknownValues.workoutLocation[normLocKey] = (unknownValues.workoutLocation[normLocKey] || 0) + 1;
        }
        if (normDiet !== undefined && !KNOWN_DIET_TYPES.has(normDiet)) {
            unknownValues.dietType[normDietKey] = (unknownValues.dietType[normDietKey] || 0) + 1;
        }
        if (normGoal !== undefined && !KNOWN_GOALS.has(normGoal)) {
            unknownValues.goal[normGoalKey] = (unknownValues.goal[normGoalKey] || 0) + 1;
        }

        const updates = {};
        if (origLoc !== normLoc) updates.workoutLocation = normLoc;
        if (origDiet !== normDiet) updates.dietType = normDiet;
        if (origGoal !== normGoal) updates.goal = normGoal;

        if (Object.keys(updates).length > 0) {
            usersNeedingUpdate++;
            if (!isDryRun) {
                // Strict $set on only workoutLocation, dietType, and goal
                await UserModel.updateOne({ _id: u._id }, { $set: updates });
                updatedUsersCount++;
            }
        }
    }

    return {
        totalUsers,
        usersNeedingUpdate,
        updatedUsersCount,
        beforeCounts,
        afterCounts,
        unknownValues,
    };
}

// CLI Execution Handler
async function main() {
    const args = process.argv.slice(2);
    const isExecute = args.includes('--execute');
    const isDryRun = !isExecute;

    if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: Cannot run enum normalization script in production environment.');
        process.exit(1);
    }

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('Error: MONGO_URI is missing in server/.env');
        process.exit(1);
    }

    await mongoose.connect(mongoUri);
    const targetDbName = mongoose.connection.name;

    console.log(`\n--- User Enum Normalization Script ---`);
    console.log(`Target Database: "${targetDbName}"`);
    console.log(`Mode: ${isDryRun ? 'DRY RUN (No database changes will be saved)' : 'EXECUTE'}\n`);

    let confirmDbName = null;

    if (isExecute) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        confirmDbName = await new Promise((resolve) => {
            rl.question(`Type the exact database name ("${targetDbName}") to confirm execution: `, (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        });

        if (confirmDbName !== targetDbName) {
            console.error(`Database name mismatch ("${confirmDbName}" !== "${targetDbName}"). Aborting.`);
            await mongoose.disconnect();
            process.exit(1);
        }
    }

    try {
        const res = await runEnumNormalization({
            isDryRun,
            confirmDbName,
            targetDbName,
        });

        console.log(`\n--- Normalization Summary ---`);
        console.log(`Total Users Checked:     ${res.totalUsers}`);
        console.log(`Users Needing Update:    ${res.usersNeedingUpdate}`);
        console.log(`Users Updated:           ${res.updatedUsersCount}\n`);

        console.log(`Before Counts:`, JSON.stringify(res.beforeCounts, null, 2));
        console.log(`After Counts: `, JSON.stringify(res.afterCounts, null, 2));
        console.log(`Unknown / Unchanged Values:`, JSON.stringify(res.unknownValues, null, 2));
        console.log(`-------------------------------\n`);
    } catch (err) {
        console.error('Normalization error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    normalizeWorkoutLocation,
    normalizeDietType,
    normalizeGoal,
    normalizeUserEnums,
    runEnumNormalization,
};
