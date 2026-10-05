const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { startOfDayInTZ, dayKey, calculateStreak, getValidatedTZ } = require('../utils/time');

describe('Time Zone & Streak Unit Tests', () => {
    it('falls back safely to UTC for invalid time zone names', () => {
        assert.equal(getValidatedTZ('Invalid/Timezone_Name'), 'UTC');
        assert.equal(getValidatedTZ(null), 'UTC');
        assert.equal(getValidatedTZ('Asia/Kolkata'), 'Asia/Kolkata');
    });

    it('correctly calculates dayKey and startOfDayInTZ around midnight in Asia/Kolkata', () => {
        const tz = 'Asia/Kolkata';

        // 2026-10-04 18:45:00 UTC is 2026-10-05 00:15:00 IST (Asia/Kolkata is UTC+5:30)
        const dateJustAfterMidnightIST = new Date('2026-10-04T18:45:00.000Z');
        assert.equal(dayKey(tz, dateJustAfterMidnightIST), '2026-10-05');

        const startOfDayIST = startOfDayInTZ(tz, dateJustAfterMidnightIST);
        // Midnight Oct 5 in IST is 2026-10-04T18:30:00.000Z UTC
        assert.equal(startOfDayIST.toISOString(), '2026-10-04T18:30:00.000Z');

        // 2026-10-04 18:15:00 UTC is 2026-10-04 23:45:00 IST
        const dateJustBeforeMidnightIST = new Date('2026-10-04T18:15:00.000Z');
        assert.equal(dayKey(tz, dateJustBeforeMidnightIST), '2026-10-04');

        const startOfDayPreviousIST = startOfDayInTZ(tz, dateJustBeforeMidnightIST);
        // Midnight Oct 4 in IST is 2026-10-03T18:30:00.000Z UTC
        assert.equal(startOfDayPreviousIST.toISOString(), '2026-10-03T18:30:00.000Z');
    });

    it('calculates real consecutive-day workout streak in user time zone', () => {
        const tz = 'Asia/Kolkata';
        const refDate = new Date('2026-10-05T10:00:00.000Z'); // Oct 5 in IST

        // Case 1: Workouts logged on Oct 5, Oct 4, Oct 3
        const logs1 = [
            { date: new Date('2026-10-05T04:00:00.000Z') }, // Oct 5 IST
            { date: new Date('2026-10-04T04:00:00.000Z') }, // Oct 4 IST
            { date: new Date('2026-10-03T04:00:00.000Z') }  // Oct 3 IST
        ];
        assert.equal(calculateStreak(logs1, tz, refDate), 3);

        // Case 2: No workout logged yet today (Oct 5), but logged on Oct 4 and Oct 3
        const logs2 = [
            { date: new Date('2026-10-04T04:00:00.000Z') }, // Oct 4 IST
            { date: new Date('2026-10-03T04:00:00.000Z') }  // Oct 3 IST
        ];
        assert.equal(calculateStreak(logs2, tz, refDate), 2);

        // Case 3: No workout logged today (Oct 5) or yesterday (Oct 4), last logged on Oct 3
        const logs3 = [
            { date: new Date('2026-10-03T04:00:00.000Z') }  // Oct 3 IST
        ];
        assert.equal(calculateStreak(logs3, tz, refDate), 0);
    });
});
