/**
 * BMI Categories based on WHO standards
 * Underweight: < 18.5
 * Healthy: 18.5 - 24.9
 * Overweight: 25.0 - 29.9
 * Obese: >= 30.0
 */

const calculateBMI = (weight, height) => {
    if (!weight || !height || height === 0) return null;
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return parseFloat(bmi.toFixed(2));
};

const getBMIStatus = (bmi) => {
    if (!bmi || bmi === 0) return 'No Data';

    if (bmi < 18.5) {
        return 'Underweight';
    } else if (bmi < 25) {
        return 'Healthy';
    } else if (bmi < 30) {
        return 'Overweight';
    } else {
        return 'Obese';
    }
};

module.exports = {
    calculateBMI,
    getBMIStatus
};
