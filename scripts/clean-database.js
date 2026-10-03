// WARNING: Do NOT run --execute on the live database.

const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/models/User');
const DietLog = require('../server/models/DietLog');
const WorkoutLog = require('../server/models/WorkoutLog');
const Log = require('../server/models/Log');
const Diet = require('../server/models/Diet');
const Workout = require('../server/models/Workout');
const OAuthCode = require('../server/models/OAuthCode');
const NutritionCache = require('../server/models/NutritionCache');

/**
 * Print usage instructions
 */
function printUsage() {
    console.log(`
Usage: node scripts/clean-database.js [--dry-run | --execute] [--all | --emails=user1@example.com,user2@example.com]

Flags:
  --dry-run                    Simulate cleanup without deleting data (default)
  --execute                    Execute actual database deletes (requires confirmation)
  --all                        Clean all application collections (including sessions & NutritionCache)
  --emails=a@x.com,b@y.com     Delete specific users by exact email and all referenced logs/data

Examples:
  node scripts/clean-database.js --all
  node scripts/clean-database.js --emails=test@example.com --execute
`);
}

/**
 * Core Database Cleanup logic (runnable against stubbed or real mongoose connection)
 */
async function runCleanDatabase({
    dbConnection = mongoose.connection,
    models = { User, DietLog, WorkoutLog, Log, Diet, Workout, OAuthCode, NutritionCache },
    mode = null, // 'all' or { emails: string[] }
    isDryRun = true,
    confirmDbName = null,
    targetDbName = null,
    isProd = process.env.NODE_ENV === 'production'
} = {}) {
    if (isProd) {
        throw new Error('Refusing to run database cleanup in production environment (NODE_ENV=production).');
    }

    if (!mode || (mode !== 'all' && (!mode.emails || !Array.isArray(mode.emails)))) {
        throw new Error('Invalid mode. Must specify either --all or --emails=a@x.com,b@y.com.');
    }

    if (!isDryRun && confirmDbName !== targetDbName) {
        throw new Error(`Database name confirmation mismatch. Expected "${targetDbName}", got "${confirmDbName}". Aborting.`);
    }

    const report = {
        mode: typeof mode === 'string' ? mode : 'emails',
        targetDbName,
        isDryRun,
        matchedUsers: [],
        unmatchedEmails: [],
        collectionCountsBefore: {},
        collectionCountsAfter: {},
        deletedCounts: {},
    };

    // 1. Get collection counts before cleanup (excluding system collections)
    if (dbConnection && dbConnection.db) {
        const collections = await dbConnection.db.listCollections().toArray();
        for (const col of collections) {
            if (!col.name.startsWith('system.')) {
                const count = await dbConnection.db.collection(col.name).countDocuments();
                report.collectionCountsBefore[col.name] = count;
            }
        }
    } else {
        // Fallback for stubbed models
        for (const [name, model] of Object.entries(models)) {
            if (model && model.countDocuments) {
                report.collectionCountsBefore[name] = await model.countDocuments();
            }
        }
    }

    if (mode === 'all') {
        // Mode: ALL
        console.log('\n--- CLEANUP MODE: ALL COLLECTIONS ---');
        console.log('NOTE: Clearing all collections (including sessions) will log out all active user sessions.\n');

        for (const [name, model] of Object.entries(models)) {
            const count = (report.collectionCountsBefore[name] !== undefined)
                ? report.collectionCountsBefore[name]
                : (model.countDocuments ? await model.countDocuments() : 0);

            report.deletedCounts[name] = count;

            if (!isDryRun) {
                if (model.deleteMany) {
                    await model.deleteMany({});
                }
            }
        }

        // Also clean express sessions collection if connected to real DB
        if (dbConnection && dbConnection.db) {
            const collections = await dbConnection.db.listCollections().toArray();
            for (const col of collections) {
                if (!col.name.startsWith('system.') && !models[col.name]) {
                    const count = await dbConnection.db.collection(col.name).countDocuments();
                    report.deletedCounts[col.name] = count;
                    if (!isDryRun) {
                        await dbConnection.db.collection(col.name).deleteMany({});
                    }
                }
            }
        }
    } else if (mode.emails) {
        // Mode: EMAILS (Exact match only, trimmed, case-insensitive)
        const targetEmails = mode.emails.map(e => e.trim().toLowerCase()).filter(Boolean);

        console.log(`\n--- CLEANUP MODE: SPECIFIC EMAILS (${targetEmails.length}) ---`);
        console.log('NOTE: Deleting specific user sessions/tokens will log out those users.\n');

        const matchedUserIds = [];

        // Exact email match query
        for (const email of targetEmails) {
            // Case-insensitive exact match regex: ^email$
            const exactEmailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            const foundUsers = await models.User.find({ email: exactEmailRegex }).lean();

            if (foundUsers && foundUsers.length > 0) {
                for (const u of foundUsers) {
                    matchedUserIds.push(u._id);
                    report.matchedUsers.push({ email: u.email, id: u._id.toString() });
                }
            } else {
                report.unmatchedEmails.push(email);
            }
        }

        if (matchedUserIds.length > 0) {
            const userRefs = {
                User: { _id: { $in: matchedUserIds } },
                DietLog: { userId: { $in: matchedUserIds } },
                WorkoutLog: { userId: { $in: matchedUserIds } },
                Log: { userId: { $in: matchedUserIds } },
                Diet: { userId: { $in: matchedUserIds } },
                Workout: { userId: { $in: matchedUserIds } },
                OAuthCode: { userId: { $in: matchedUserIds } },
            };

            for (const [name, filter] of Object.entries(userRefs)) {
                const model = models[name];
                if (model) {
                    const toDeleteCount = await model.countDocuments(filter);
                    report.deletedCounts[name] = toDeleteCount;

                    if (!isDryRun && toDeleteCount > 0) {
                        await model.deleteMany(filter);
                    }
                }
            }
        }
    }

    return report;
}

// CLI Execution Handler
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        printUsage();
        process.exit(0);
    }

    const isExecute = args.includes('--execute');
    const isDryRun = !isExecute;

    const isAll = args.includes('--all');
    const emailArg = args.find(a => a.startsWith('--emails='));

    if (isAll && emailArg) {
        console.error('Error: Cannot specify both --all and --emails at the same time.');
        printUsage();
        process.exit(1);
    }

    if (!isAll && !emailArg) {
        console.error('Error: Must specify either --all or --emails=user@example.com.');
        printUsage();
        process.exit(1);
    }

    if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: Cannot run clean-database script in production environment.');
        process.exit(1);
    }

    const mode = isAll ? 'all' : { emails: emailArg.split('=')[1].split(',') };

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('Error: MONGO_URI is missing in server/.env');
        process.exit(1);
    }

    await mongoose.connect(mongoUri);
    const targetDbName = mongoose.connection.name;

    console.log(`\n=============================================================`);
    console.log(`       FITTRACK DATABASE CLEANUP SCRIPT`);
    console.log(`=============================================================`);
    console.log(`Target Database: "${targetDbName}"`);
    console.log(`Mode:            ${isDryRun ? 'DRY RUN (No data will be deleted)' : 'EXECUTE'}`);

    if (isExecute) {
        console.log(`\n-------------------------------------------------------------`);
        console.log(`REMINDER: Please ensure you have created a mongodump backup`);
        console.log(`(e.g., 'mongodump --uri="${mongoUri}"') before executing database cleanup.`);
        console.log(`-------------------------------------------------------------\n`);

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const confirmDbName = await new Promise((resolve) => {
            rl.question(`Type the exact database name ("${targetDbName}") to confirm execution: `, (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        });

        if (confirmDbName !== targetDbName) {
            console.error(`Database name mismatch ("${confirmDbName}" !== "${targetDbName}"). Aborting cleanup.`);
            await mongoose.disconnect();
            process.exit(1);
        }

        try {
            const report = await runCleanDatabase({
                dbConnection: mongoose.connection,
                mode,
                isDryRun: false,
                confirmDbName,
                targetDbName,
            });

            console.log(`\n--- Cleanup Report ---`);
            if (report.matchedUsers.length > 0) {
                console.log(`Matched Users (${report.matchedUsers.length}):`);
                report.matchedUsers.forEach(u => console.log(`  - ${u.email} (ID: ${u.id})`));
            }
            if (report.unmatchedEmails.length > 0) {
                console.log(`Requested Emails Not Found (${report.unmatchedEmails.length}):`);
                report.unmatchedEmails.forEach(e => console.log(`  - ${e}`));
            }
            console.log(`\nDeleted Document Counts per Collection:`, JSON.stringify(report.deletedCounts, null, 2));
            console.log(`=============================================================\n`);
        } catch (err) {
            console.error('Cleanup execution error:', err.message);
        } finally {
            await mongoose.disconnect();
        }
    } else {
        // Dry Run
        try {
            const report = await runCleanDatabase({
                dbConnection: mongoose.connection,
                mode,
                isDryRun: true,
                targetDbName,
            });

            console.log(`\n--- Dry Run Report ---`);
            if (report.matchedUsers.length > 0) {
                console.log(`Matched Users (${report.matchedUsers.length}):`);
                report.matchedUsers.forEach(u => console.log(`  - ${u.email} (ID: ${u.id})`));
            }
            if (report.unmatchedEmails.length > 0) {
                console.log(`Requested Emails Not Found (${report.unmatchedEmails.length}):`);
                report.unmatchedEmails.forEach(e => console.log(`  - ${e}`));
            }
            console.log(`\nDocuments That WOULD Be Deleted per Collection:`, JSON.stringify(report.deletedCounts, null, 2));
            console.log(`=============================================================\n`);
        } catch (err) {
            console.error('Dry run error:', err.message);
        } finally {
            await mongoose.disconnect();
        }
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    runCleanDatabase,
};
