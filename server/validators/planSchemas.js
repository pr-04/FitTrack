const { z } = require('zod');

/**
 * Clamps numeric values to a range [min, max] during preprocessing.
 * Coerces string numbers like "5" to 5.
 * Used ONLY for harmless fields (sets, reps, rest).
 */
const clampNumber = (min, max) => z.preprocess((val) => {
    if (val === null || val === undefined || val === '') return val;
    const num = Number(val);
    if (isNaN(num)) return val;
    return Math.min(Math.max(num, min), max);
}, z.number());

/**
 * Exercise Schema (strips unknown keys)
 */
const workoutExerciseSchema = z.object({
    name: z.string({ required_error: 'Exercise name is required' }).trim().min(1, 'Exercise name cannot be empty'),
    sets: clampNumber(1, 30),
    reps: z.union([z.string(), z.number()]).transform((v) => String(v)),
    rest: z.string().optional().default('60s')
}).strip();

/**
 * Day Schema (strips unknown keys)
 */
const workoutDaySchema = z.object({
    day: z.string({ required_error: 'Day title is required' }).trim().min(1, 'Day title cannot be empty'),
    type: z.string({ required_error: 'Workout type/focus is required' }).trim().min(1, 'Type cannot be empty'),
    exercises: z.array(workoutExerciseSchema, { required_error: 'Exercises array is required' })
}).strip();

/**
 * Full 7-Day Workout Plan Schema
 * Strict on structure: title required, days must have EXACTLY 7 items.
 * Strips unknown keys (no passthrough).
 * Clamps harmless fields (sets: 1-30).
 */
const workoutPlanSchema = z.object({
    title: z.string({ required_error: 'Plan title is required' }).trim().min(1, 'Title cannot be empty'),
    overview: z.string().optional().default('Custom AI Workout Blueprint'),
    days: z.array(workoutDaySchema, { required_error: 'Days array is required' })
        .length(7, 'Workout plan must contain exactly 7 days')
}).strip();

/**
 * Diet Blueprint Schema
 * Strict on structure & bounds: dailyCalories MUST be within 1200-5000 (FAILS validation outside this range to trigger retry).
 * Strips unknown keys (no passthrough).
 */
const dietPlanSchema = z.object({
    dailyCalories: z.coerce.number({ required_error: 'Daily calories is required' })
        .min(1200, 'Daily calories must be at least 1200')
        .max(5000, 'Daily calories cannot exceed 5000'),
    macros: z.object({
        protein: z.string({ required_error: 'Protein macro string is required' }).min(1),
        carbs: z.string({ required_error: 'Carbs macro string is required' }).min(1),
        fats: z.string({ required_error: 'Fats macro string is required' }).min(1)
    }, { required_error: 'Macros object is required' }).strip(),
    meals: z.object({
        Breakfast: z.array(z.string().min(1), { required_error: 'Breakfast options array is required' }),
        Lunch: z.array(z.string().min(1), { required_error: 'Lunch options array is required' }),
        Snacks: z.array(z.string().min(1), { required_error: 'Snacks options array is required' }),
        Dinner: z.array(z.string().min(1), { required_error: 'Dinner options array is required' })
    }, { required_error: 'Meals object is required' }).strip()
}).strip();

module.exports = {
    workoutPlanSchema,
    dietPlanSchema
};
