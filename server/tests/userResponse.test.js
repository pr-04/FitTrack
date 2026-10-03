const assert = require('assert');
const path = require('path');
module.paths.push(path.join(__dirname, '../node_modules'));

const { formatUserResponse } = require('../utils/userResponse');

function runUserResponseTests() {
    console.log('=== RUNNING USER RESPONSE SERIALIZER UNIT TESTS ===');

    // 1. Explicit Allowlist & Field Exclusion Test
    const rawUserDoc = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: '$2a$10$encryptedPasswordHashKeyHere',
        age: 28,
        weight: 65,
        height: 170,
        goal: 'lose_weight',
        dietType: 'Veg',
        activityLevel: 'moderate',
        workoutLocation: 'Home',
        isOnboarded: true,
        createdAt: '2026-01-15T10:00:00.000Z',
        __v: 0,
        secretInternalKey: 'should_be_stripped'
    };

    const token = 'mock.jwt.token.string';
    const serialized = formatUserResponse(rawUserDoc, token);

    // Verify all allowed fields are present
    assert.strictEqual(serialized._id, '507f1f77bcf86cd799439011', '_id must be included');
    assert.strictEqual(serialized.name, 'Jane Doe', 'name must be included');
    assert.strictEqual(serialized.email, 'jane@example.com', 'email must be included');
    assert.strictEqual(serialized.age, 28, 'age must be included');
    assert.strictEqual(serialized.weight, 65, 'weight must be included');
    assert.strictEqual(serialized.height, 170, 'height must be included');
    assert.strictEqual(serialized.activityLevel, 'moderate', 'activityLevel must be included');
    assert.strictEqual(serialized.isOnboarded, true, 'isOnboarded must be included');
    assert.strictEqual(serialized.createdAt, '2026-01-15T10:00:00.000Z', 'createdAt must be included');
    assert.strictEqual(serialized.token, token, 'token must be included when provided');

    // Verify sensitive and internal fields are EXCLUDED
    assert.strictEqual(serialized.password, undefined, 'password MUST be excluded');
    assert.strictEqual(serialized.__v, undefined, '__v MUST be excluded');
    assert.strictEqual(serialized.secretInternalKey, undefined, 'unsupported internal fields MUST be excluded');
    console.log('✓ PASSED: Explicit allowlist enforcement & password/internal field exclusion verified');

    // 2. Enum Normalization in Serializer Test
    assert.strictEqual(serialized.goal, 'fat_loss', 'goal lose_weight must normalize to fat_loss');
    assert.strictEqual(serialized.dietType, 'vegetarian', 'dietType Veg must normalize to vegetarian');
    assert.strictEqual(serialized.workoutLocation, 'home', 'workoutLocation Home must normalize to home');
    console.log('✓ PASSED: Enum normalization via enums.js verified in serializer output');

    // 3. Stubbed Auth Handlers Response Payload Test
    const newSignUpDoc = {
        _id: '507f1f77bcf86cd799439012',
        name: 'New User',
        email: 'new@example.com',
        createdAt: '2026-02-01T12:00:00.000Z',
    };
    const signupSerialized = formatUserResponse(newSignUpDoc, 'signup.token.123');
    assert.strictEqual(signupSerialized._id, '507f1f77bcf86cd799439012');
    assert.strictEqual(signupSerialized.name, 'New User');
    assert.strictEqual(signupSerialized.email, 'new@example.com');
    assert.strictEqual(signupSerialized.token, 'signup.token.123');
    assert.strictEqual(signupSerialized.isOnboarded, false, 'New user without age/weight/height has isOnboarded = false');
    assert.strictEqual(signupSerialized.password, undefined);
    console.log('✓ PASSED: Signup response payload structure verified');

    console.log('\nAll unit tests for formatUserResponse passed successfully!');
}

try {
    runUserResponseTests();
} catch (err) {
    console.error('User response serializer test failed:', err);
    process.exit(1);
}
