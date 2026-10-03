const { workoutPlanSchema, dietPlanSchema } = require('../validators/planSchemas');

function createValidWorkoutPlan() {
    return {
        title: "ELITE STRENGTH & HYPERTROPHY",
        overview: "7-day hypertrophy split",
        days: Array.from({ length: 7 }, (_, i) => ({
            day: `Day ${i + 1}`,
            type: "Strength",
            exercises: [
                { name: "Bench Press", sets: 4, reps: "8-10", rest: "90s" },
                { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rest: "60s" }
            ]
        }))
    };
}

function createValidDietPlan() {
    return {
        dailyCalories: 2400,
        macros: { protein: "180g", carbs: "250g", fats: "70g" },
        meals: {
            Breakfast: ["Oatmeal with whey protein", "Eggs and toast"],
            Lunch: ["Grilled chicken bowl", "Turkey wrap"],
            Snacks: ["Greek yogurt", "Almonds"],
            Dinner: ["Salmon with quinoa", "Lean beef steak with sweet potato"]
        }
    };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✓ PASSED: ${message}`);
        passed++;
    } else {
        console.error(`✗ FAILED: ${message}`);
        failed++;
    }
}

console.log("=== RUNNING PLAN SCHEMA UNIT TESTS ===");

// 1. Valid Plan Test
const validWorkout = createValidWorkoutPlan();
const parseValidWorkout = workoutPlanSchema.safeParse(validWorkout);
assert(parseValidWorkout.success, "Valid 7-day workout plan parses successfully");

const validDiet = createValidDietPlan();
const parseValidDiet = dietPlanSchema.safeParse(validDiet);
assert(parseValidDiet.success, "Valid diet blueprint parses successfully");

// 2. 6-Day Plan Test (Must fail)
const sixDayWorkout = createValidWorkoutPlan();
sixDayWorkout.days = sixDayWorkout.days.slice(0, 6);
const parseSixDay = workoutPlanSchema.safeParse(sixDayWorkout);
assert(!parseSixDay.success, "6-day workout plan is rejected (requires exactly 7 days)");

// 3. Missing Fields Test (Must fail)
const missingTitleWorkout = createValidWorkoutPlan();
delete missingTitleWorkout.title;
const parseMissingTitle = workoutPlanSchema.safeParse(missingTitleWorkout);
assert(!parseMissingTitle.success, "Workout plan missing title is rejected");

const missingMacrosDiet = createValidDietPlan();
delete missingMacrosDiet.macros;
const parseMissingMacros = dietPlanSchema.safeParse(missingMacrosDiet);
assert(!parseMissingMacros.success, "Diet plan missing macros is rejected");

// 4. String-Instead-Of-Number Test (Must coerce & pass)
const stringNumberWorkout = createValidWorkoutPlan();
stringNumberWorkout.days[0].exercises[0].sets = "5";
const parseStringNumWorkout = workoutPlanSchema.safeParse(stringNumberWorkout);
assert(
    parseStringNumWorkout.success && parseStringNumWorkout.data.days[0].exercises[0].sets === 5,
    "String-instead-of-number '5' for sets is coerced to number 5"
);

const stringNumberDiet = createValidDietPlan();
stringNumberDiet.dailyCalories = "2200";
const parseStringNumDiet = dietPlanSchema.safeParse(stringNumberDiet);
assert(
    parseStringNumDiet.success && parseStringNumDiet.data.dailyCalories === 2200,
    "String-instead-of-number '2200' for dailyCalories is coerced to number 2200"
);

// 5. Extra Fields Test (Must pass and STRIP unknown keys)
const extraFieldsWorkout = createValidWorkoutPlan();
extraFieldsWorkout.coachNote = "Hydrate well during training";
extraFieldsWorkout.days[0].exercises[0].tempo = "3-0-1-0";
const parseExtraFieldsWorkout = workoutPlanSchema.safeParse(extraFieldsWorkout);
assert(
    parseExtraFieldsWorkout.success &&
    parseExtraFieldsWorkout.data.coachNote === undefined &&
    parseExtraFieldsWorkout.data.days[0].exercises[0].tempo === undefined,
    "Workout plan with extra fields passes validation but unknown keys are stripped"
);

// 6. Harmless Fields Clamping Test (Sets clamped 1-30)
const hugeNumberWorkout = createValidWorkoutPlan();
hugeNumberWorkout.days[0].exercises[0].sets = 9999;
const parseHugeNumWorkout = workoutPlanSchema.safeParse(hugeNumberWorkout);
assert(
    parseHugeNumWorkout.success && parseHugeNumWorkout.data.days[0].exercises[0].sets === 30,
    "Huge sets number 9999 is clamped to max bound 30"
);

// 7. Calorie Bounds Test (Out-of-bounds 50000 and 100 MUST BE REJECTED)
const hugeCalDiet = createValidDietPlan();
hugeCalDiet.dailyCalories = 50000;
const parseHugeCalDiet = dietPlanSchema.safeParse(hugeCalDiet);
assert(!parseHugeCalDiet.success, "dailyCalories 50000 is rejected (outside 1200-5000 range)");

const tinyCalDiet = createValidDietPlan();
tinyCalDiet.dailyCalories = 100;
const parseTinyCalDiet = dietPlanSchema.safeParse(tinyCalDiet);
assert(!parseTinyCalDiet.success, "dailyCalories 100 is rejected (outside 1200-5000 range)");

console.log(`\n=== UNIT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) process.exit(1);
