/**
 * Utilities for time zone handling using Intl API without external dependencies.
 */

function getValidatedTZ(tz) {
    if (!tz || typeof tz !== 'string') return 'UTC';
    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return tz;
    } catch (e) {
        return 'UTC';
    }
}

/**
 * Returns "YYYY-MM-DD" date string in specified time zone.
 */
function dayKey(tz = 'UTC', date = new Date()) {
    const validTZ = getValidatedTZ(tz);
    const d = date instanceof Date ? date : new Date(date);
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: validTZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(d);
    const p = {};
    parts.forEach(item => { p[item.type] = item.value; });
    return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Returns Date object representing midnight 00:00:00.000 in the given time zone.
 */
function startOfDayInTZ(tz = 'UTC', date = new Date()) {
    const validTZ = getValidatedTZ(tz);
    const d = date instanceof Date ? date : new Date(date);
    const key = dayKey(validTZ, d); // "YYYY-MM-DD"
    const [year, month, day] = key.split('-').map(Number);

    const utcCandidate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: validTZ,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });

    const getOffsetMs = (targetDate) => {
        const parts = formatter.formatToParts(targetDate);
        const p = {};
        parts.forEach(item => { p[item.type] = item.value; });
        let h = parseInt(p.hour, 10);
        if (h === 24) h = 0;
        const asUTC = Date.UTC(
            parseInt(p.year, 10),
            parseInt(p.month, 10) - 1,
            parseInt(p.day, 10),
            h,
            parseInt(p.minute, 10),
            parseInt(p.second, 10)
        );
        return asUTC - targetDate.getTime();
    };

    const offsetMs = getOffsetMs(utcCandidate);
    return new Date(utcCandidate.getTime() - offsetMs);
}

/**
 * Calculates real consecutive-day workout streak in user's time zone.
 * Counts back from today, or from yesterday if nothing logged today yet.
 */
function calculateStreak(workoutLogs = [], tz = 'UTC', refDate = new Date()) {
    const validTZ = getValidatedTZ(tz);
    const loggedDayKeys = new Set(
        workoutLogs.map(l => dayKey(validTZ, l.date || l.createdAt))
    );

    const ref = refDate instanceof Date ? refDate : new Date(refDate);
    const todayStr = dayKey(validTZ, ref);

    const refStart = startOfDayInTZ(validTZ, ref);
    const yesterdayDate = new Date(refStart.getTime() - (12 * 60 * 60 * 1000));
    const yesterdayStr = dayKey(validTZ, yesterdayDate);

    let startStr = null;
    if (loggedDayKeys.has(todayStr)) {
        startStr = todayStr;
    } else if (loggedDayKeys.has(yesterdayStr)) {
        startStr = yesterdayStr;
    } else {
        return 0;
    }

    let streak = 0;
    const [sYear, sMonth, sDay] = startStr.split('-').map(Number);
    let currentMs = startOfDayInTZ(validTZ, new Date(Date.UTC(sYear, sMonth - 1, sDay, 12, 0, 0))).getTime();

    while (true) {
        const checkStr = dayKey(validTZ, new Date(currentMs));
        if (loggedDayKeys.has(checkStr)) {
            streak++;
            currentMs -= (24 * 60 * 60 * 1000);
        } else {
            break;
        }
    }

    return streak;
}

module.exports = {
    getValidatedTZ,
    dayKey,
    startOfDayInTZ,
    calculateStreak
};
