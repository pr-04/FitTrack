export const isTimedOrDistance = (raw) => {
    return /\d\s*(?:sec(?:ond)?s?|s|min(?:ute)?s?|m|km|meters?|miles?)\b/i.test(String(raw || '').trim());
};

export const formatRepChip = (repsStr) => {
    const raw = String(repsStr || '').trim();
    if (!raw) return '';
    if (!isTimedOrDistance(raw) && /^\d+(?:\s*-\s*\d+)?$/.test(raw)) {
        return `${raw} reps`;
    }
    return raw;
};
