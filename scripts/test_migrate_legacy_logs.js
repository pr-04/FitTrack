const assert = require('assert');
const { runMigration, getWorkoutLogKey, getDietLogKey } = require('./migrate-legacy-logs');

async function testMigrateLegacyLogs() {
    console.log('Running unit tests for migrate-legacy-logs.js (stubbed, no live database)...');

    // Sample legacy logs
    const mockLegacyLogs = [
        { _id: '1', userId: 'userA', type: 'workout', exercise: 'Bench Press', sets: 3, reps: 10, liftWeight: 60, date: new Date('2026-10-01') },
        { _id: '2', userId: 'userA', type: 'diet', foodItem: 'Oatmeal', calories: 350, date: new Date('2026-10-01') },
        { _id: '3', userId: 'userA', type: 'workout', exercise: 'Bench Press', sets: 3, reps: 10, liftWeight: 60, date: new Date('2026-10-01') }, // Intra-batch duplicate
        { _id: '4', userId: 'userB', type: 'workout', exercise: 'Squat', sets: 4, reps: 8, liftWeight: 100, date: new Date('2026-10-01') }, // Pre-existing duplicate
        { _id: '5', userId: 'userA', type: 'weight', bodyWeight: 75, date: new Date('2026-10-01') }, // Non-migratable type
    ];

    // Mock target database logs
    const mockExistingWorkouts = [
        { _id: 'w1', userId: 'userB', exercise: 'Squat', sets: 4, reps: 8, weight: 100, date: new Date('2026-10-01') },
    ];
    const mockExistingDiets = [];

    const createdWorkouts = [];
    const createdDiets = [];

    // Mock Models
    const MockLogModel = {
        find: () => ({
            lean: async () => mockLegacyLogs,
        }),
    };

    const MockWorkoutLogModel = {
        find: () => ({
            lean: async () => mockExistingWorkouts,
        }),
        create: async (doc) => {
            createdWorkouts.push(doc);
            return doc;
        },
    };

    const MockDietLogModel = {
        find: () => ({
            lean: async () => mockExistingDiets,
        }),
        create: async (doc) => {
            createdDiets.push(doc);
            return doc;
        },
    };

    // Test 1: Dry Run
    const dryRunStats = await runMigration({
        LogModel: MockLogModel,
        WorkoutLogModel: MockWorkoutLogModel,
        DietLogModel: MockDietLogModel,
        isDryRun: true,
        isProd: false,
    });

    assert.strictEqual(dryRunStats.found, 5, 'Should find 5 legacy logs');
    assert.strictEqual(dryRunStats.wouldCreate, 2, 'Should plan to create 2 items (1 workout, 1 diet)');
    assert.strictEqual(dryRunStats.created, 0, 'Dry run should create 0 items in DB');
    assert.strictEqual(dryRunStats.skippedAsDuplicate, 2, 'Should skip 1 intra-batch duplicate + 1 pre-existing duplicate');
    assert.strictEqual(dryRunStats.skippedNonMigratable, 1, 'Should skip 1 weight log');
    assert.strictEqual(createdWorkouts.length, 0, 'No workouts created in dry run');
    console.log('✔ Dry run test passed');

    // Test 2: Execute Mode (Successful execution)
    const executeStats = await runMigration({
        LogModel: MockLogModel,
        WorkoutLogModel: MockWorkoutLogModel,
        DietLogModel: MockDietLogModel,
        isDryRun: false,
        confirmDbName: 'fittrack_test',
        targetDbName: 'fittrack_test',
        isProd: false,
    });

    assert.strictEqual(executeStats.created, 2, 'Execute mode should create 2 logs');
    assert.strictEqual(createdWorkouts.length, 1, 'Should create 1 WorkoutLog');
    assert.strictEqual(createdDiets.length, 1, 'Should create 1 DietLog');
    assert.strictEqual(createdWorkouts[0].exercise, 'Bench Press');
    assert.strictEqual(createdDiets[0].name, 'Oatmeal');
    console.log('✔ Execute mode test passed');

    // Test 3: DB Confirmation Mismatch Guard
    await assert.rejects(
        async () => {
            await runMigration({
                LogModel: MockLogModel,
                WorkoutLogModel: MockWorkoutLogModel,
                DietLogModel: MockDietLogModel,
                isDryRun: false,
                confirmDbName: 'wrong_db',
                targetDbName: 'fittrack_test',
                isProd: false,
            });
        },
        /Database name confirmation mismatch/,
        'Should abort if database name confirmation fails'
    );
    console.log('✔ Database confirmation mismatch guard test passed');

    // Test 4: Production Guard
    await assert.rejects(
        async () => {
            await runMigration({
                LogModel: MockLogModel,
                WorkoutLogModel: MockWorkoutLogModel,
                DietLogModel: MockDietLogModel,
                isDryRun: true,
                isProd: true,
            });
        },
        /Refusing to run migration script in production environment/,
        'Should refuse to run when in production environment'
    );
    // Test 5: Double Execute Run (Idempotency check)
    const mockDbWorkouts = [...mockExistingWorkouts, ...createdWorkouts];
    const mockDbDiets = [...mockExistingDiets, ...createdDiets];

    const MockIdempotentWorkoutLogModel = {
        find: () => ({ lean: async () => mockDbWorkouts }),
        create: async (doc) => { mockDbWorkouts.push(doc); return doc; },
    };
    const MockIdempotentDietLogModel = {
        find: () => ({ lean: async () => mockDbDiets }),
        create: async (doc) => { mockDbDiets.push(doc); return doc; },
    };

    const secondRunStats = await runMigration({
        LogModel: MockLogModel,
        WorkoutLogModel: MockIdempotentWorkoutLogModel,
        DietLogModel: MockIdempotentDietLogModel,
        isDryRun: false,
        confirmDbName: 'fittrack_test',
        targetDbName: 'fittrack_test',
        isProd: false,
    });

    assert.strictEqual(secondRunStats.created, 0, 'Second execute run should create 0 new documents');
    assert.strictEqual(secondRunStats.wouldCreate, 0, 'Second execute run should have 0 would-create documents');
    assert.strictEqual(secondRunStats.skippedAsDuplicate, 4, 'Second run should skip all 4 workout/diet items as duplicates');
    console.log('✔ Idempotency test (double --execute creates 0 docs) passed');

    console.log('\nAll 5 unit tests for migrate-legacy-logs.js passed successfully!');
}

testMigrateLegacyLogs().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
