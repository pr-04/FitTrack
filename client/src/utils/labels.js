export const goalLabels = {
    fat_loss: 'Fat loss',
    muscle_gain: 'Muscle gain',
    body_recomposition: 'Body recomposition',
    maintain: 'Maintain weight',
    strength: 'Strength',
    endurance: 'Endurance',
    general_fitness: 'General fitness',
    flexibility: 'Flexibility',
    lose_weight: 'Fat loss'
};

export const dietTypeLabels = {
    vegetarian: 'Vegetarian',
    'non-vegetarian': 'Non-vegetarian',
    vegan: 'Vegan',
    pescatarian: 'Pescatarian',
    any: 'No preference',
    Veg: 'Vegetarian',
    'Non-veg': 'Non-vegetarian'
};

export const activityLevelLabels = {
    sedentary: 'Sedentary',
    light: 'Lightly active',
    moderate: 'Moderately active',
    active: 'Active',
    very_active: 'Very active'
};

export const workoutLocationLabels = {
    home: 'Home',
    gym: 'Gym',
    Home: 'Home',
    Gym: 'Gym'
};

export function getGoalLabel(val) {
    if (!val) return 'Fitness goal';
    return goalLabels[val] || String(val).replace(/_/g, ' ');
}

export function getDietTypeLabel(val) {
    if (!val) return 'No preference';
    return dietTypeLabels[val] || String(val);
}

export function getActivityLevelLabel(val) {
    if (!val) return 'Moderately active';
    return activityLevelLabels[val] || String(val);
}

export function getWorkoutLocationLabel(val) {
    if (!val) return 'Gym';
    return workoutLocationLabels[val] || String(val);
}

export function formatDate(dateString) {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
