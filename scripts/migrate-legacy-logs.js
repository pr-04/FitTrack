const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const Log = require('../server/models/Log');
const WorkoutLog = require('../server/models/WorkoutLog');
const DietLog = require('../server/models/DietLog');

// Generate deterministic duplicate key
function getWorkoutLogKey(userId, date, exercise, sets, reps, weight) {
    const d = new Date(date).toISOString().slice(0, 10);
    const ex = (exercise || 'Workout').toLowerCase().trim();
    return `workout_${userId}_${d}_${ex}_${sets}_${reps}_${weight}`;
}

function getDietLogKey(userId, date, name, calories) {
    const d = new Date(date).toISOString().slice(0, 10);
    const nm = (name || 'Logged Item').toLowerCase().trim();
    return `diet_${userId}_${d}_${nm}_${calories}`;
}

/**
 * Core migration function, exposed for unit testing with stubbed models or real DB
 */
async function runMigration({
    LogModel = Log,
    WorkoutLogModel = WorkoutLog,
    DietLogModel = DietLog,
    isDryRun = true,
    confirmDbName = null,
    targetDbName = null,
    isProd = process.env.NODE_ENV === 'production'
} = {}) {
    if (isProd) {
        throw new Error('Refusing to run migration script in production environment (NODE_ENV=production).');
    }

    if (!isDryRun && confirmDbName !== targetDbName) {
        throw new Error(`Database name confirmation mismatch. Expected "${targetDbName}", got "${confirmDbName}". Aborting.`);
    }

    const stats = {
        found: 0,
        wouldCreate: 0,
        created: 0,
        skippedAsDuplicate: 0,
        skippedNonMigratable: 0,
        failed: 0,
    };

    const legacyLogs = await LogModel.find({}).lean();
    stats.found = legacyLogs.length;

    // Load existing target logs for fast duplicate checking
    const existingWorkouts = await WorkoutLogModel.find({}).lean();
    const existingDiets = await DietLogModel.find({}).lean();

    const existingKeys = new Set();
    for (const w of existingWorkouts) {
        existingKeys.add(getWorkoutLogKey(w.userId, w.date, w.exercise, w.sets, w.reps, w.weight));
    }
    for (const d of existingDiets) {
        existingKeys.add(getDietLogKey(d.userId, d.date, d.name, d.calories));
    }

    for (const item of legacyLogs) {
        try {
            if (item.type === 'workout') {
                const exercise = item.exercise || 'Workout';
                const sets = Math.max(1, item.sets || 1);
                const reps = Math.max(1, item.reps || 1);
                const weight = Math.max(0, item.liftWeight || 0);
                const date = item.date || new Date();
                const key = getWorkoutLogKey(item.userId, date, exercise, sets, reps, weight);

                if (existingKeys.has(key)) {
                    stats.skippedAsDuplicate++;
                    continue;
                }

                if (isDryRun) {
                    stats.wouldCreate++;
                    existingKeys.add(key); // prevent intra-batch duplicates
                } else {
                    await WorkoutLogModel.create({
                        userId: item.userId,
                        exercise,
                        sets,
                        reps,
                        weight,
                        date,
                    });
                    stats.created++;
                    existingKeys.add(key);
                }
            } else if (item.type === 'diet') {
                const name = item.foodItem || 'Logged Item';
                const calories = Math.max(0, item.calories || 0);
                const date = item.date || new Date();
                const key = getDietLogKey(item.userId, date, name, calories);

                if (existingKeys.has(key)) {
                    stats.skippedAsDuplicate++;
                    continue;
                }

                if (isDryRun) {
                    stats.wouldCreate++;
                    existingKeys.add(key); // prevent intra-batch duplicates
                } else {
                    await DietLogModel.create({
                        userId: item.userId,
                        name,
                        calories,
                        protein: 0,
                        carbs: 0,
                        fats: 0,
                        date,
                    });
                    stats.created++;
                    existingKeys.add(key);
                }
            } else {
                // Weight or other legacy types
                stats.skippedNonMigratable++;
            }
        } catch (err) {
            stats.failed++;
            console.error(`Failed to process legacy log ID ${item._id}:`, err.message);
        }
    }

    return stats;
}

// CLI Execution Handler
async function main() {
    const args = process.argv.slice(2);
    const isExecute = args.includes('--execute');
    const isDryRun = !isExecute;

    if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: Cannot run migration script in production environment.');
        process.exit(1);
    }

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('Error: MONGO_URI is missing in server/.env');
        process.exit(1);
    }

    await mongoose.connect(mongoUri);
    const targetDbName = mongoose.connection.name;

    console.log(`\n--- Legacy Log Migration Script ---`);
    console.log(`Target Database: "${targetDbName}"`);
    console.log(`Mode: ${isDryRun ? 'DRY RUN (No changes will be saved)' : 'EXECUTE'}\n`);

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
            console.error(`Database name mismatch ("${confirmDbName}" !== "${targetDbName}"). Aborting migration.`);
            await mongoose.disconnect();
            process.exit(1);
        }
    }

    try {
        const stats = await runMigration({
            isDryRun,
            confirmDbName,
            targetDbName,
        });

        console.log(`\n--- Migration Summary ---`);
        console.log(`Found Legacy Logs:     ${stats.found}`);
        console.log(`Would Create:          ${stats.wouldCreate}`);
        console.log(`Created:               ${stats.created}`);
        console.log(`Skipped as Duplicate:  ${stats.skippedAsDuplicate}`);
        console.log(`Skipped Non-Migratable:${stats.skippedNonMigratable}`);
        console.log(`Failed:                ${stats.failed}`);
        console.log(`-------------------------\n`);
    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    runMigration,
    getWorkoutLogKey,
    getDietLogKey,
};
