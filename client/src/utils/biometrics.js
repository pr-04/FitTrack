/**
 * BMI Categories based on WHO standards
 * Underweight: < 18.5
 * Healthy: 18.5 - 24.9
 * Overweight: 25.0 - 29.9
 * Obese: >= 30.0
 */

export const calculateBMI = (weight, height) => {
    if (!weight || !height || height === 0) return '00.0';
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
};

export const getBMIStatus = (bmiValue) => {
    const bmi = parseFloat(bmiValue);
    
    if (!bmi || bmi === 0) {
        return {
            label: 'No Data',
            color: 'bg-gray-100 text-gray-700',
            borderColor: 'border-gray-200',
            textColor: 'text-gray-500'
        };
    }

    if (bmi < 18.5) {
        return {
            label: 'Underweight',
            color: 'bg-blue-100 text-blue-700',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-600'
        };
    } else if (bmi < 25) {
        return {
            label: 'Healthy',
            color: 'bg-green-100 text-green-700',
            borderColor: 'border-green-200',
            textColor: 'text-green-600'
        };
    } else if (bmi < 30) {
        return {
            label: 'Overweight',
            color: 'bg-orange-100 text-orange-700',
            borderColor: 'border-orange-200',
            textColor: 'text-orange-600'
        };
    } else {
        return {
            label: 'Obese',
            color: 'bg-red-100 text-red-700',
            borderColor: 'border-red-200',
            textColor: 'text-red-600'
        };
    }
};
