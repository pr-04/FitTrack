import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dietAPI, trackerAPI } from '../services/api';
import { Loader2, Plus, Sparkles, CheckCircle, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogFoodModal from '../components/modals/LogFoodModal';
import { toast } from 'react-hot-toast';

const Diet = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [dailyCalories, setDailyCalories] = useState(0);

    const fetchHistory = async () => {
        try {
            const res = await dietAPI.getHistory();
            if (res.data.length > 0) {
                setPlan(res.data[0].plan);
            }
        } catch (error) {
            console.error("Failed to fetch diets", error);
        }
    };

    const fetchTodayStats = async () => {
        try {
            const res = await trackerAPI.getStats();
            setDailyCalories(res.data.dailyCalories || 0);
        } catch (error) {
            console.error("Failed to fetch today stats", error);
        }
    }

    useEffect(() => {
        fetchHistory();
        fetchTodayStats();
    }, []);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await dietAPI.generate({ goal: user.goal, dietType: user.dietType });
            setPlan(res.data.plan);
            fetchHistory();
        } catch (error) {
            console.error("Failed to generate diet plan", error);
            alert("Failed to generate AI plan. " + (error.response?.data?.message || 'Please try again later.'));
        } finally {
            setLoading(false);
        }
    };

    const handleLogSuccess = () => {
        toast.success("Food logged successfully!");
        fetchTodayStats();
    };

    const targetCalories = plan?.dailyCalories || 2000;
    const progressPercent = Math.min((dailyCalories / targetCalories) * 100, 100);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Diet Plan</h1>
                    <p className="text-gray-500 mt-2">Customized for {user?.dietType} / {user?.goal?.replace('_', ' ')}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsLogModalOpen(true)} className="bg-white border text-gray-700 hover:bg-gray-50 hover:scale-105 px-4 py-2.5 rounded-lg flex items-center transition-all duration-200 shadow-sm font-medium">
                        <Plus className="w-4 h-4 mr-2" /> Log Food
                    </button>
                    <button onClick={handleGenerate} disabled={loading}
                        className="bg-emerald-500 hover:bg-emerald-600 hover:scale-105 shadow-md text-white px-6 py-2.5 rounded-lg font-medium flex items-center justify-center transition-all duration-200 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                        Generate Plan
                    </button>
                </div>
            </header>

            {/* Daily Progress Bar */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-container p-6 bg-white shadow-xl border border-gray-100">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Today's Macros</h3>
                        <p className="text-sm text-gray-500">Keep up the good work!</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            {dailyCalories} <span className="text-sm font-medium text-gray-400">/ {targetCalories} kcal</span>
                        </p>
                    </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mt-4">
                    <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${progressPercent}%` }} 
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-3 rounded-full ${progressPercent >= 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    />
                </div>
            </motion.div>

            {/* Manual Entry Modal removed and replaced by LogFoodModal */}

            {!plan && !loading && (
                <div className="card-container p-12 text-center flex flex-col items-center">
                    <Sparkles className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No diet plan generated yet</h3>
                    <p className="text-gray-500 max-w-sm mb-6">Let our AI act as your personal nutritionist and generate a meal plan today.</p>
                    <button onClick={handleGenerate} className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-black transition-colors shadow-md">
                        Create Nutrition Plan
                    </button>
                </div>
            )}

            {loading && (
                <div className="card-container p-20 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium animate-pulse">Analyzing macro profiles...</p>
                </div>
            )}

            {plan && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        <div className="card-container p-4 md:p-6 flex flex-col justify-center items-center text-center bg-gray-50">
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Target</h3>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900">{plan.dailyCalories || 2000}</p>
                        </div>
                        <div className="card-container p-4 md:p-6 border-t-4 border-red-400 flex flex-col justify-center items-center text-center">
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Protein</h3>
                            <p className="text-xl md:text-2xl font-bold text-gray-900">{plan.macros?.protein}</p>
                        </div>
                        <div className="card-container p-4 md:p-6 border-t-4 border-blue-400 flex flex-col justify-center items-center text-center">
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Carbs</h3>
                            <p className="text-xl md:text-2xl font-bold text-gray-900">{plan.macros?.carbs}</p>
                        </div>
                        <div className="card-container p-4 md:p-6 border-t-4 border-yellow-400 flex flex-col justify-center items-center text-center">
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Fats</h3>
                            <p className="text-xl md:text-2xl font-bold text-gray-900">{plan.macros?.fats}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Meal Suggestions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {plan.meals && Array.isArray(plan.meals) ? plan.meals.map((mealObj, i) => (
                                <div key={i} className="card-container hover:-translate-y-1 transition-transform duration-300 flex flex-col shadow-sm">
                                    <div className="p-4 border-b border-gray-100 bg-emerald-50/30">
                                        <h3 className="font-bold text-gray-900 capitalize">{mealObj.category || mealObj.name}</h3>
                                    </div>
                                    <div className="p-4 flex-1">
                                        <ul className="space-y-3">
                                            {mealObj.options?.map((opt, j) => (
                                                <li key={j} className="flex justify-between items-start gap-4 text-gray-700 text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                                    <span className="leading-relaxed">• {opt}</span>
                                                    <button onClick={() => { setManualEntry({foodItem: opt, calories: Math.floor(targetCalories/4)}); setShowManualLog(true); }}
                                                        className="flex-shrink-0 text-emerald-600 hover:bg-emerald-50 p-1.5 rounded transition-colors" title="Log this meal" >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )) : (
                                Object.keys(plan.meals || {}).map((category, i) => (
                                    <div key={i} className="card-container flex flex-col">
                                        <div className="p-4 border-b border-gray-100 bg-emerald-50/30">
                                            <h3 className="font-bold text-gray-900 capitalize">{category}</h3>
                                        </div>
                                        <div className="p-4 flex-1">
                                            <ul className="space-y-3">
                                                {plan.meals[category]?.map((opt, j) => (
                                                    <li key={j} className="flex justify-between items-start gap-4 text-gray-700 text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                                        <span>• {opt}</span>
                                                        <button onClick={() => { setManualEntry({foodItem: opt, calories: Math.floor(targetCalories/4)}); setShowManualLog(true); }}
                                                            className="flex-shrink-0 text-emerald-600 hover:bg-emerald-50 p-1.5 rounded transition-colors" title="Log this meal" >
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            <LogFoodModal 
                isOpen={isLogModalOpen} 
                onClose={() => setIsLogModalOpen(false)} 
                onSuccess={handleLogSuccess}
            />
        </div>
    );
};

export default Diet;
