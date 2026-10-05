const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { executeWithResilience } = require('../services/aiService');

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
});
