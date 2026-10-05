const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { executeWithResilience, sanitizeForLogging } = require('../services/aiService');

describe('AI Resilience Error Classification Unit Tests', () => {
    it('never treats ATTEMPT_TIMEOUT_14040ms as a 404 error', async () => {
        // Mock ai model that throws ATTEMPT_TIMEOUT_14040ms
        const fakeModel = 'fake-gemini-model';
        let caughtError = null;

        try {
            await executeWithResilience({
                primaryModel: fakeModel,
                fallbackModel: null,
                totalDeadlineMs: 50,
                perAttemptTimeoutMs: 20,
                prompt: 'test',
                systemInstruction: 'test',
                requestType: 'Test',
                initialThinkingLevel: null
            });
        } catch (err) {
            caughtError = err;
        }

        assert.ok(caughtError);
        // Error message should NOT say MODEL_NOT_FOUND or contain 404
        assert.notEqual(caughtError.message.includes('MODEL_NOT_FOUND'), true);
        assert.ok(
            caughtError.message.includes('SERVICE_UNAVAILABLE') ||
            caughtError.message.includes('AI_DEADLINE_EXCEEDED')
        );
    });

    it('redacts long AIza key-like strings (>35 chars) from logging output', () => {
        const standardKey = 'AIzaSy' + 'A'.repeat(33); // 39 chars total
        const longApiKey = 'AIzaSy' + 'A'.repeat(45);  // 51 chars total
        const extraLongKey = 'AIzaSy' + 'B'.repeat(60); // 66 chars total

        const testInput = `{"key1": "${standardKey}", "key2": "${longApiKey}", "key3": "${extraLongKey}"}`;
        const sanitized = sanitizeForLogging(testInput);

        assert.ok(sanitized.includes('[REDACTED_API_KEY]'));
        assert.ok(!sanitized.includes(standardKey));
        assert.ok(!sanitized.includes(longApiKey));
        assert.ok(!sanitized.includes(extraLongKey));
    });
});
