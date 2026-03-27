const express = require('express');
const router = express.Router();
const { 
    generateWorkoutPlan, 
    generateDietPlan, 
    savePlan,
    getUserPlans,
    deletePlan,
    updatePlan,
    chatAboutPlan,
    getDashboardInsights, 
    chatWithCoach 
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/workout-plan', generateWorkoutPlan);
router.post('/diet-plan', generateDietPlan);
router.post('/save-plan', savePlan);
router.get('/my-plans', getUserPlans);
router.put('/plan/:id', updatePlan);
router.delete('/plan/:id', deletePlan);
router.post('/chat-about-plan', chatAboutPlan);
router.get('/dashboard-insights', getDashboardInsights);
router.post('/chat', chatWithCoach);

module.exports = router;
