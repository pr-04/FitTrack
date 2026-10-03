const assert = require('assert');
const { runCleanDatabase } = require('./clean-database');

async function testCleanDatabase() {
    console.log('Running unit tests for clean-database.js (stubbed, no live database)...');

    function createMockModel(name, initialDocs = []) {
        let docs = JSON.parse(JSON.stringify(initialDocs));
        return {
            find: (query) => ({
                lean: async () => {
                    if (query && query.email) {
                        return docs.filter(d => query.email.test(d.email));
                    }
                    return docs;
                }
            }),
            countDocuments: async (filter = {}) => {
                if (!filter || Object.keys(filter).length === 0) return docs.length;
                if (filter._id && filter._id.$in) {
                    const ids = filter._id.$in.map(String);
                    return docs.filter(d => ids.includes(String(d._id))).length;
                }
                if (filter.userId && filter.userId.$in) {
                    const ids = filter.userId.$in.map(String);
                    return docs.filter(d => ids.includes(String(d.userId))).length;
                }
                return docs.length;
            },
            deleteMany: async (filter) => {
                if (!filter || Object.keys(filter).length === 0) {
                    const count = docs.length;
                    docs = [];
                    return { acknowledged: true, deletedCount: count };
                }
                if (filter.userId && filter.userId.$in) {
                    const ids = filter.userId.$in.map(String);
                    const before = docs.length;
                    docs = docs.filter(d => !ids.includes(String(d.userId)));
                    return { acknowledged: true, deletedCount: before - docs.length };
                }
                if (filter._id && filter._id.$in) {
                    const ids = filter._id.$in.map(String);
                    const before = docs.length;
                    docs = docs.filter(d => !ids.includes(String(d._id)));
                    return { acknowledged: true, deletedCount: before - docs.length };
                }
                return { acknowledged: true, deletedCount: 0 };
            }
        };
    }

    function getFreshMockModels() {
        const mockUsers = [
            { _id: 'u1', email: 'alice@example.com', name: 'Alice' },
            { _id: 'u2', email: 'bob@example.com', name: 'Bob' },
        ];
        return {
            User: createMockModel('User', mockUsers),
            DietLog: createMockModel('DietLog', [{ _id: 'dl1', userId: 'u1', name: 'Apple' }, { _id: 'dl2', userId: 'u2', name: 'Banana' }]),
            WorkoutLog: createMockModel('WorkoutLog', [{ _id: 'wl1', userId: 'u1', exercise: 'Pushup' }]),
            Log: createMockModel('Log', [{ _id: 'l1', userId: 'u1', type: 'weight' }]),
            Diet: createMockModel('Diet', []),
            Workout: createMockModel('Workout', []),
            OAuthCode: createMockModel('OAuthCode', []),
            NutritionCache: createMockModel('NutritionCache', [{ _id: 'nc1', key: 'apple' }]),
        };
    }

    // 1. Dry Run Test (Emails Mode)
    const dryRunRes = await runCleanDatabase({
        dbConnection: null,
        models: getFreshMockModels(),
        mode: { emails: ['alice@example.com', 'unknown@example.com'] },
        isDryRun: true,
        isProd: false,
    });

    assert.strictEqual(dryRunRes.matchedUsers.length, 1);
    assert.strictEqual(dryRunRes.matchedUsers[0].email, 'alice@example.com');
    assert.strictEqual(dryRunRes.unmatchedEmails.length, 1);
    assert.strictEqual(dryRunRes.unmatchedEmails[0], 'unknown@example.com');
    assert.strictEqual(dryRunRes.deletedCounts.User, 1);
    assert.strictEqual(dryRunRes.deletedCounts.DietLog, 1);
    assert.strictEqual(dryRunRes.deletedCounts.WorkoutLog, 1);
    console.log('✔ Dry run test passed');

    // 2. Exact Match Test (Partial email should NOT match)
    const partialMatchRes = await runCleanDatabase({
        dbConnection: null,
        models: getFreshMockModels(),
        mode: { emails: ['alice'] }, // 'alice' is substring, but exact match requires 'alice'
        isDryRun: true,
        isProd: false,
    });
    assert.strictEqual(partialMatchRes.matchedUsers.length, 0, 'Partial email substring should NOT match');
    assert.strictEqual(partialMatchRes.unmatchedEmails[0], 'alice');
    console.log('✔ Exact email match (no partial substring match) test passed');

    // 3. Execute Mode Test (Emails Mode)
    const freshModelsForExec = getFreshMockModels();
    const execEmailsRes = await runCleanDatabase({
        dbConnection: null,
        models: freshModelsForExec,
        mode: { emails: ['alice@example.com'] },
        isDryRun: false,
        confirmDbName: 'fittrack_test',
        targetDbName: 'fittrack_test',
        isProd: false,
    });
    assert.strictEqual(execEmailsRes.deletedCounts.User, 1);
    assert.strictEqual(execEmailsRes.deletedCounts.DietLog, 1);
    assert.strictEqual(execEmailsRes.deletedCounts.WorkoutLog, 1);
    assert.strictEqual(await freshModelsForExec.User.countDocuments(), 1, '1 user should remain');
    console.log('✔ Execute mode (emails) test passed');

    // 3b. Nonexistent Email Test (Execute mode)
    const freshModelsForNonexistent = getFreshMockModels();
    const execNonexistentRes = await runCleanDatabase({
        dbConnection: null,
        models: freshModelsForNonexistent,
        mode: { emails: ['nonexistent@example.com'] },
        isDryRun: false,
        confirmDbName: 'fittrack_test',
        targetDbName: 'fittrack_test',
        isProd: false,
    });
    assert.strictEqual(execNonexistentRes.matchedUsers.length, 0);
    assert.strictEqual(execNonexistentRes.unmatchedEmails.length, 1);
    assert.strictEqual(execNonexistentRes.unmatchedEmails[0], 'nonexistent@example.com');
    assert.strictEqual(Object.keys(execNonexistentRes.deletedCounts).length, 0, '0 deletes executed for nonexistent email');
    assert.strictEqual(await freshModelsForNonexistent.User.countDocuments(), 2, 'No users should be deleted');
    console.log('✔ Nonexistent email execute mode test passed');

    // 4. Execute Mode Test (ALL Mode)
    const freshModelsForAll = getFreshMockModels();
    const execAllRes = await runCleanDatabase({
        dbConnection: null,
        models: freshModelsForAll,
        mode: 'all',
        isDryRun: false,
        confirmDbName: 'fittrack_test',
        targetDbName: 'fittrack_test',
        isProd: false,
    });
    assert.strictEqual(execAllRes.deletedCounts.User, 2);
    assert.strictEqual(execAllRes.deletedCounts.NutritionCache, 1);
    assert.strictEqual(await freshModelsForAll.User.countDocuments(), 0, '0 users should remain after --all');
    console.log('✔ Execute mode (all collections) test passed');

    // 5. Database Confirmation Mismatch Guard
    await assert.rejects(
        async () => {
            await runCleanDatabase({
                dbConnection: null,
                models: getFreshMockModels(),
                mode: 'all',
                isDryRun: false,
                confirmDbName: 'wrong_db',
                targetDbName: 'fittrack_test',
                isProd: false,
            });
        },
        /Database name confirmation mismatch/,
        'Should abort if database confirmation fails'
    );
    console.log('✔ Database confirmation mismatch guard test passed');

    // 6. Production Guard
    await assert.rejects(
        async () => {
            await runCleanDatabase({
                dbConnection: null,
                models: getFreshMockModels(),
                mode: 'all',
                isDryRun: true,
                isProd: true,
            });
        },
        /Refusing to run database cleanup in production environment/,
        'Should refuse to run when in production environment'
    );
    console.log('✔ Production environment guard test passed');

    console.log('\nAll unit tests for clean-database.js passed successfully!');
}

testCleanDatabase().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
