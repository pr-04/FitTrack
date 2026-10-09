const { z } = require('zod');
const {
    normalizeWorkoutLocation,
    normalizeDietType,
    normalizeGoal,
} = require('../utils/enums');

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

// Auth Schemas
const signupSchema = z.object({
    body: z.object({
        name: z.string({ message: 'Name is required' }).trim().min(1, 'Name is required'),
        email: z.string({ message: 'Email is required' }).trim().toLowerCase().email('Invalid email address'),
        password: z.string({ message: 'Password is required' }).min(6, 'Password must be at least 6 characters')
    })
});

const loginSchema = z.object({
    body: z.object({
        email: z.string({ message: 'Email is required' }).trim().toLowerCase().email('Invalid email address'),
        password: z.string({ message: 'Password is required' }).min(1, 'Password is required')
    })
});


const exchangeOAuthSchema = z.object({
    body: z.object({
        code: z.string({ message: 'Authorization code is required' }).trim().min(1, 'Authorization code is required')
    })
});

const ALLOWED_GOALS = [
    'fat_loss',
    'muscle_gain',
    'body_recomposition',
    'maintain',
    'strength',
    'endurance',
    'general_fitness',
    'flexibility'
];

const ALLOWED_DIET_TYPES = [
    'vegetarian',
    'non-vegetarian',
    'vegan',
    'pescatarian',
    'any'
];

const ALLOWED_ACTIVITY_LEVELS = [
    'sedentary',
    'light',
    'moderate',
    'active',
    'very_active'
];

const ALLOWED_WORKOUT_LOCATIONS = [
    'home',
    'gym'
];

const ALLOWED_SEX_VALUES = [
    'male',
    'female',
    'unspecified'
];

// User Profile Schemas
const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1).optional(),
        age: z.coerce.number().int().min(10, 'Age must be at least 10').max(120, 'Age must be less than 120').optional(),
        weight: z.coerce.number().positive('Weight must be positive').optional(),
        height: z.coerce.number().positive('Height must be positive').optional(),
        sex: z.string().optional()
            .transform(val => val ? val.trim().toLowerCase() : val)
            .refine(val => !val || ALLOWED_SEX_VALUES.includes(val), { message: 'Invalid sex' }),
        goal: z.string().optional()
            .transform(val => val ? normalizeGoal(val) : val)
            .refine(val => !val || ALLOWED_GOALS.includes(val), { message: 'Invalid goal' }),
        dietType: z.string().optional()
            .transform(val => val ? normalizeDietType(val) : val)
            .refine(val => !val || ALLOWED_DIET_TYPES.includes(val), { message: 'Invalid dietType' }),
        activityLevel: z.string().optional()
            .transform(val => val ? val.trim().toLowerCase() : val)
            .refine(val => !val || ALLOWED_ACTIVITY_LEVELS.includes(val), { message: 'Invalid activityLevel' }),
        workoutLocation: z.string().optional()
            .transform(val => val ? normalizeWorkoutLocation(val) : val)
            .refine(val => !val || ALLOWED_WORKOUT_LOCATIONS.includes(val), { message: 'Invalid workoutLocation' }),
        isOnboarded: z.boolean().optional()
    }).passthrough()
});

// Workout Schemas
const generateWorkoutSchema = z.object({
    body: z.object({
        fitnessGoal: z.string().optional().transform(val => val ? normalizeGoal(val) : val),
        workoutLocation: z.string().optional().transform(val => val ? normalizeWorkoutLocation(val) : val),
        daysPerWeek: z.union([z.number(), z.string()]).optional(),
        fitnessLevel: z.string().optional()
    }).passthrough().optional()
});

const logWorkoutSchema = z.object({
    body: z.object({
        exercise: z.string({ message: 'Exercise name is required' }).trim().min(1, 'Exercise name is required'),
        sets: z.coerce.number({ message: 'Number of sets is required' }).int().min(1, 'Sets must be at least 1'),
        reps: z.coerce.number({ message: 'Number of reps is required' }).int().min(1, 'Reps must be at least 1'),
        weight: z.coerce.number().min(0, 'Weight cannot be negative').optional().default(0),
        date: z.union([z.string(), z.date()]).optional()
    }).passthrough()
});

const deleteWorkoutSchema = z.object({
    params: z.object({
        id: z.string().regex(mongoIdRegex, 'Invalid workout ID format')
    })
});

// Diet Schemas
const generateDietSchema = z.object({
    body: z.object({
        dietType: z.string().optional().transform(val => val ? normalizeDietType(val) : val),
        allergies: z.union([z.string(), z.array(z.string())]).optional(),
        targetCalories: z.coerce.number().optional()
    }).passthrough().optional()
});

const logDietSchema = z.object({
    body: z.object({
        name: z.string({ message: 'Food name is required' }).trim().min(1, 'Food name is required'),
        calories: z.coerce.number({ message: 'Calories are required' }).min(0, 'Calories cannot be negative'),
        protein: z.coerce.number().min(0).optional().default(0),
        carbs: z.coerce.number().min(0).optional().default(0),
        fats: z.coerce.number().min(0).optional().default(0),
        date: z.union([z.string(), z.date()]).optional()
    }).passthrough()
});

const lookupNutritionSchema = z.object({
    query: z.object({
        query: z.string({ message: 'Query is required' })
            .trim()
            .min(1, 'Query is required')
            .max(200, 'Query cannot exceed 200 characters')
            .regex(/^[^\x00-\x1F\x7F]+$/, 'Query cannot contain control characters or newlines')
    }).passthrough()
});

module.exports = {
    signupSchema,
    loginSchema,
    exchangeOAuthSchema,
    updateProfileSchema,
    generateWorkoutSchema,
    logWorkoutSchema,
    deleteWorkoutSchema,
    generateDietSchema,
    logDietSchema,
    lookupNutritionSchema
};
