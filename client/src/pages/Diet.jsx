import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dietAPI, trackerAPI } from '../services/api';
import { Loader2, Plus, Sparkles, Apple } from 'lucide-react';
import { motion } from 'framer-motion';
import LogFoodModal from '../components/modals/LogFoodModal';
import { getGoalLabel, getDietTypeLabel } from '../utils/labels';
import { toast } from 'react-hot-toast';

const Diet = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [initialFood, setInitialFood] = useState(null);
    const [dailyCalories, setDailyCalories] = useState(0);
    const [error, setError] = useState(null);

    const handleOpenLogModal = (foodSuggestion = null) => {
        setInitialFood(foodSuggestion);
        setIsLogModalOpen(true);
    };

    const handleCloseLogModal = () => {
        setIsLogModalOpen(false);
        setInitialFood(null);
    };

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
    };

    useEffect(() => {
        fetchHistory();
        fetchTodayStats();
    }, []);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await dietAPI.generate({ goal: user.goal, dietType: user.dietType });
            setPlan(res.data.plan);
            fetchHistory();
        } catch (err) {
            console.error("Failed to generate diet plan", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to generate nutrition plan.";
            setError(errorMsg);
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
    const isOverTarget = dailyCalories > targetCalories;
    const calorieDifference = Math.abs(targetCalories - dailyCalories);
    const calorieSubtext = isOverTarget
        ? `Over by ${calorieDifference} kcal`
        : `${calorieDifference} kcal left`;

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-16">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Daily Nutrition Plan</h1>
                    <p className="text-slate-600 mt-1 font-medium">
                        Customized for {getDietTypeLabel(user?.dietType)} · {getGoalLabel(user?.goal)}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => handleOpenLogModal(null)} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center transition-colors shadow-sm font-semibold">
                        <Plus className="w-4 h-4 mr-2" /> Log food
                    </button>
                    <button onClick={handleGenerate} disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {plan ? "Regenerate plan" : "Generate plan"}
                    </button>
                </div>
            </header>

            {error && !loading && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div>
                        <p className="font-semibold">{error}</p>
                        <p className="text-sm text-red-600 mt-0.5">The AI Nutritionist is experiencing high demand. Please try again.</p>
                    </div>
                    <button onClick={handleGenerate} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center shadow-sm">
                        <Sparkles className="w-4 h-4 mr-2" /> Retry generation
                    </button>
                </div>
            )}

            {/* Daily Progress Bar */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Today's Macros</h3>
                        <p className={`text-sm font-semibold ${isOverTarget ? 'text-red-600' : 'text-slate-600'}`}>
                            {calorieSubtext}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-slate-900 flex items-center gap-1.5">
                            {dailyCalories} <span className="text-sm font-medium text-slate-500">/ {targetCalories} kcal</span>
                        </p>
                    </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 mt-4 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${progressPercent}%` }} 
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-3 rounded-full ${isOverTarget ? 'bg-red-600' : 'bg-green-600'}`}
                    />
                </div>
            </div>

            {!plan && !loading && (
                <div className="bg-white rounded-2xl p-12 text-center flex flex-col items-center border border-slate-200 shadow-sm">
                    <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4 text-green-600">
                        <Apple className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No nutrition plan</h3>
                    <p className="text-slate-600 max-w-md text-base font-medium mb-6">
                        Generate a daily nutrition plan with calorie and macro targets.
                    </p>
                    <button onClick={handleGenerate} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors">
                        Generate plan
                    </button>
                </div>
            )}

            {loading && (
                <div className="bg-white rounded-2xl p-16 flex flex-col items-center justify-center text-center border border-slate-200 shadow-sm space-y-4">
                    <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                    <div>
                        <p className="text-lg font-bold text-slate-900">Generating your nutrition plan...</p>
                        <p className="text-slate-500 text-sm mt-1">This can take up to 30s</p>
                    </div>
                </div>
            )}

            {plan && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    {/* Macro Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 border-t-2 border-t-slate-400 shadow-sm flex flex-col items-center text-center">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Target</h3>
                            <p className="text-2xl font-bold text-slate-900">{plan.dailyCalories || 2000} kcal</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 border-t-2 border-t-red-400 shadow-sm flex flex-col items-center text-center">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Protein</h3>
                            <p className="text-2xl font-bold text-slate-900">{plan.macros?.protein || '—'}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 border-t-2 border-t-emerald-400 shadow-sm flex flex-col items-center text-center">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Carbs</h3>
                            <p className="text-2xl font-bold text-slate-900">{plan.macros?.carbs || '—'}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 border-t-2 border-t-amber-400 shadow-sm flex flex-col items-center text-center">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fats</h3>
                            <p className="text-2xl font-bold text-slate-900">{plan.macros?.fats || '—'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900">Meal suggestions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {plan.meals && Array.isArray(plan.meals) ? plan.meals.map((mealObj, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                                        <h3 className="font-bold text-slate-900 capitalize">{mealObj.category || mealObj.name}</h3>
                                    </div>
                                    <div className="p-4 flex-1">
                                        <ul className="space-y-3">
                                            {mealObj.options?.map((opt, j) => (
                                                <li key={j} className="flex justify-between items-start gap-3 text-slate-700 text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                                    <span className="leading-relaxed font-medium">• {opt}</span>
                                                    <button onClick={() => handleOpenLogModal({ name: opt, category: mealObj.category || mealObj.name })}
                                                        className="flex-shrink-0 text-green-600 hover:bg-green-50 p-1.5 rounded-lg transition-colors" title="Log this meal" >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )) : (
                                Object.keys(plan.meals || {}).map((category, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                                            <h3 className="font-bold text-slate-900 capitalize">{category}</h3>
                                        </div>
                                        <div className="p-4 flex-1">
                                            <ul className="space-y-3">
                                                {plan.meals[category]?.map((opt, j) => (
                                                    <li key={j} className="flex justify-between items-start gap-3 text-slate-700 text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                                        <span className="leading-relaxed font-medium">• {opt}</span>
                                                        <button onClick={() => handleOpenLogModal({ name: opt, category })}
                                                            className="flex-shrink-0 text-green-600 hover:bg-green-50 p-1.5 rounded-lg transition-colors" title="Log this meal" >
                                                            <Plus className="w-4 h-4" />
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
                onClose={handleCloseLogModal} 
                onSuccess={handleLogSuccess}
                initialFood={initialFood}
            />
        </div>
    );
};

export default Diet;
