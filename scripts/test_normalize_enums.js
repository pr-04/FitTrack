const assert = require('assert');
const {
    normalizeWorkoutLocation,
    normalizeDietType,
    normalizeGoal,
    normalizeUserEnums,
    runEnumNormalization,
} = require('./normalize-enums');

async function testNormalizeEnums() {
    console.log('Running unit tests for normalize-enums.js (stubbed, no live database)...');

    // 1. Test normalizeWorkoutLocation
    assert.strictEqual(normalizeWorkoutLocation('Home'), 'home');
    assert.strictEqual(normalizeWorkoutLocation('  gym  '), 'gym');
    assert.strictEqual(normalizeWorkoutLocation('HOME'), 'home');
    assert.strictEqual(normalizeWorkoutLocation('outdoors'), 'outdoors', 'Unknown value should remain unchanged');
    assert.strictEqual(normalizeWorkoutLocation(null), null, 'Null should remain unchanged');

    // 2. Test normalizeDietType
    assert.strictEqual(normalizeDietType('Veg'), 'vegetarian');
    assert.strictEqual(normalizeDietType('Non-veg'), 'non-vegetarian');
    assert.strictEqual(normalizeDietType('  VEGAN  '), 'vegan');
    assert.strictEqual(normalizeDietType('pescatarian'), 'pescatarian');
    assert.strictEqual(normalizeDietType('any'), 'any');
    assert.strictEqual(normalizeDietType('keto'), 'keto', 'Unknown value should remain unchanged');

    // 3. Test normalizeGoal
    assert.strictEqual(normalizeGoal('lose_weight'), 'fat_loss');
    assert.strictEqual(normalizeGoal('  FAT_LOSS  '), 'fat_loss');
    assert.strictEqual(normalizeGoal('muscle_gain'), 'muscle_gain');
    assert.strictEqual(normalizeGoal('body_recomposition'), 'body_recomposition');
    assert.strictEqual(normalizeGoal('maintain'), 'maintain');
    assert.strictEqual(normalizeGoal('custom_goal'), 'custom_goal', 'Unknown value should remain unchanged');

    console.log('✔ Individual normalization function mapping tests passed');

    // 4. Test normalizeUserEnums helper
    const unnormalizedUser = {
        workoutLocation: ' Home ',
        dietType: 'Veg',
        goal: 'lose_weight',
    };
    const norm = normalizeUserEnums(unnormalizedUser);
    assert.strictEqual(norm.workoutLocation, 'home');
    assert.strictEqual(norm.dietType, 'vegetarian');
    assert.strictEqual(norm.goal, 'fat_loss');
    console.log('✔ normalizeUserEnums helper test passed');

    // 5. Test runEnumNormalization Dry Run and Execution
    const mockUsers = [
        { _id: 'u1', name: 'Alice', workoutLocation: 'Home', dietType: 'Veg', goal: 'lose_weight' },
        { _id: 'u2', name: 'Bob', workoutLocation: 'gym', dietType: 'non-vegetarian', goal: 'fat_loss' },
        { _id: 'u3', name: 'Charlie', workoutLocation: 'outdoors', dietType: 'keto', goal: 'maintain' },
    ];

    const updatedDocs = {};

    const MockUserModel = {
        find: () => ({
            lean: async () => mockUsers,
        }),
        updateOne: async (query, update) => {
            const id = query._id;
            assert.ok(update.$set, 'Must use $set operator');
            const allowedKeys = new Set(['workoutLocation', 'dietType', 'goal']);
            for (const key of Object.keys(update.$set)) {
                assert.ok(allowedKeys.has(key), `Must only set enum fields, forbidden key: ${key}`);
            }
            updatedDocs[id] = update.$set;
            return { acknowledged: true, modifiedCount: 1 };
        },
    };

    // Dry Run Test
    const dryRes = await runEnumNormalization({
        UserModel: MockUserModel,
        isDryRun: true,
        isProd: false,
    });
    assert.strictEqual(dryRes.totalUsers, 3);
    assert.strictEqual(dryRes.usersNeedingUpdate, 1, 'Only u1 needs update');
    assert.strictEqual(dryRes.updatedUsersCount, 0, 'Dry run creates 0 DB updates');
    assert.strictEqual(dryRes.unknownValues.workoutLocation['outdoors'], 1);
    assert.strictEqual(dryRes.unknownValues.dietType['keto'], 1);
    console.log('✔ Dry run test passed');

    // Execute Mode Test
    const execRes = await runEnumNormalization({
        UserModel: MockUserModel,
        isDryRun: false,
        confirmDbName: 'fittrack_test',
        targetDbName: 'fittrack_test',
        isProd: false,
    });
    assert.strictEqual(execRes.updatedUsersCount, 1);
    assert.deepStrictEqual(updatedDocs['u1'], {
        workoutLocation: 'home',
        dietType: 'vegetarian',
        goal: 'fat_loss',
    });
    console.log('✔ Execute mode test passed');

    // 6. Test Idempotency (Second execute run)
    const mockPostUsers = [
        { _id: 'u1', name: 'Alice', workoutLocation: 'home', dietType: 'vegetarian', goal: 'fat_loss' },
        { _id: 'u2', name: 'Bob', workoutLocation: 'gym', dietType: 'non-vegetarian', goal: 'fat_loss' },
        { _id: 'u3', name: 'Charlie', workoutLocation: 'outdoors', dietType: 'keto', goal: 'maintain' },
    ];

    const MockPostUserModel = {
        find: () => ({ lean: async () => mockPostUsers }),
        updateOne: async () => {
            assert.fail('updateOne should not be called when data is already normalized');
        },
    };

    const secondRes = await runEnumNormalization({
        UserModel: MockPostUserModel,
        isDryRun: false,
        confirmDbName: 'fittrack_test',
        targetDbName: 'fittrack_test',
        isProd: false,
    });
    assert.strictEqual(secondRes.usersNeedingUpdate, 0, 'Idempotency: second run needs 0 updates');
    assert.strictEqual(secondRes.updatedUsersCount, 0);
    console.log('✔ Idempotency test (second run updates 0 users) passed');

    // 7. Test DB Confirmation Mismatch Guard
    await assert.rejects(
        async () => {
            await runEnumNormalization({
                UserModel: MockUserModel,
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

    // 8. Test Production Guard
    await assert.rejects(
        async () => {
            await runEnumNormalization({
                UserModel: MockUserModel,
                isDryRun: true,
                isProd: true,
            });
        },
        /Refusing to run enum normalization in production environment/,
        'Should refuse to run when in production environment'
    );
    console.log('✔ Production environment guard test passed');

    console.log('\nAll unit tests for normalize-enums.js passed successfully!');
}

testNormalizeEnums().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
