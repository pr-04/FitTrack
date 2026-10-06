const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Reps Classifier Unit Tests', () => {
    it('correctly classifies rep-based and timed/distance exercise inputs', async () => {
        const { isTimedOrDistance, formatRepChip } = await import('../../client/src/utils/repsClassifier.js');

        const repBasedCases = [
            "12",
            "8-10",
            "10 reps (slow tempo)",
            "AMRAP",
            "12 each arm",
            "Max reps"
        ];

        const timedCases = [
            "45 sec",
            "45 seconds",
            "30 min",
            "500 m",
            "1.5 km",
            "30s"
        ];

        repBasedCases.forEach((input) => {
            assert.equal(
                isTimedOrDistance(input),
                false,
                `Expected isTimedOrDistance("${input}") to be false (rep-based)`
            );
        });

        timedCases.forEach((input) => {
            assert.equal(
                isTimedOrDistance(input),
                true,
                `Expected isTimedOrDistance("${input}") to be true (timed/distance)`
            );
        });

        // Chip formatting checks
        assert.equal(formatRepChip("12"), "12 reps");
        assert.equal(formatRepChip("8-10"), "8-10 reps");
        assert.equal(formatRepChip("10 reps (slow tempo)"), "10 reps (slow tempo)");
        assert.equal(formatRepChip("AMRAP"), "AMRAP");
        assert.equal(formatRepChip("12 each arm"), "12 each arm");
        assert.equal(formatRepChip("Max reps"), "Max reps");

        assert.equal(formatRepChip("45 sec"), "45 sec");
        assert.equal(formatRepChip("45 seconds"), "45 seconds");
        assert.equal(formatRepChip("30 min"), "30 min");
        assert.equal(formatRepChip("500 m"), "500 m");
        assert.equal(formatRepChip("1.5 km"), "1.5 km");
        assert.equal(formatRepChip("30s"), "30s");
    });
});
