import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { workoutAPI } from '../services/api';
import { Loader2, CheckCircle, Sparkles, Dumbbell, Target, Clock, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import LogWorkoutModal from '../components/modals/LogWorkoutModal';
import { getGoalLabel } from '../utils/labels';
import { isTimedOrDistance, formatRepChip } from '../utils/repsClassifier';
import { toast } from 'react-hot-toast';

const Workout = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [plan, setPlan] = useState(null);
    const [planId, setPlanId] = useState(null);
    const [completedExercises, setCompletedExercises] = useState({});
    const [error, setError] = useState(null);

    const fetchHistory = async () => {
        try {
            const res = await workoutAPI.getHistory();
            if (res.data.length > 0) {
                setPlan(res.data[0].plan); 
                setPlanId(res.data[0]._id);
            } else {
                setPlan(null);
                setPlanId(null);
            }
        } catch (error) {
            console.error("Failed to fetch workouts", error);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const getTodayKey = (pid) => `fittrack_completed_${pid}_${new Date().toISOString().slice(0, 10)}`;

    useEffect(() => {
        if (!planId) {
            setCompletedExercises({});
            return;
        }
        try {
            const stored = localStorage.getItem(getTodayKey(planId));
            if (stored) {
                setCompletedExercises(JSON.parse(stored));
            } else {
                setCompletedExercises({});
            }
        } catch (e) {
            console.error("Failed to read completed exercises from localStorage", e);
            setCompletedExercises({});
        }
    }, [planId]);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await workoutAPI.generate({ goal: user.goal, fitnessLevel: user.activityLevel });
            setPlan(res.data.plan);
            setPlanId(res.data._id);
            fetchHistory();
        } catch (err) {
            console.error("Failed to generate plan", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to generate workout plan.";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePlan = async () => {
        if (!planId) return;
        if (!window.confirm("Discard this plan?")) return;
        
        setLoading(true);
        try {
            await workoutAPI.delete(planId);
            setPlan(null);
            setPlanId(null);
            setCompletedExercises({});
            toast.success("Plan discarded");
        } catch (error) {
            console.error("Failed to delete plan", error);
            toast.error(error.response?.data?.message || "Failed to discard plan");
        } finally {
            setLoading(false);
        }
    };

    const handleLogSuccess = () => {
        toast.success("Workout logged successfully!");
        fetchHistory();
    };

    const parseExercisePayload = (name, sets, repsStr) => {
        const rawReps = String(repsStr || '').trim();
        if (isTimedOrDistance(rawReps)) {
            const exerciseName = name.includes(`(${rawReps})`) ? name : `${name} (${rawReps})`;
            return {
                exercise: exerciseName,
                sets: Number(sets) || 1,
                reps: 1
            };
        } else {
            const match = rawReps.match(/\d+/);
            const repCount = match ? parseInt(match[0], 10) : 10;
            return {
                exercise: name,
                sets: Number(sets) || 3,
                reps: repCount
            };
        }
    };

    const handleLogWorkout = async (dayIndex, exerciseIndex, name, sets, repsStr) => {
        const key = `${dayIndex}-${exerciseIndex}`;
        if (completedExercises[key]) return; 

        const payload = parseExercisePayload(name, sets, repsStr);

        try {
            await workoutAPI.log({ ...payload, weight: 0 });
            const updated = { ...completedExercises, [key]: true };
            setCompletedExercises(updated);
            if (planId) {
                try {
                    localStorage.setItem(getTodayKey(planId), JSON.stringify(updated));
                } catch (e) {
                    console.error("Failed to save completed exercises", e);
                }
            }
            toast.success(`Logged ${payload.exercise}!`);
        } catch (error) {
            console.error("Failed to log workout", error);
            toast.error(error.response?.data?.message || "Failed to log workout exercise");
        }
    };

    let totalExCount = 0;
    let completedExCount = Object.keys(completedExercises).length;
    
    if (plan?.days) {
        plan.days.forEach(d => {
            if(d.exercises) totalExCount += d.exercises.length;
        });
    }
    const progressPercent = totalExCount > 0 ? (completedExCount / totalExCount) * 100 : 0;

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 pb-16">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Workout Plan</h1>
                    <p className="text-slate-600 mt-1 font-medium">
                        Plan for <span className="font-semibold text-slate-900">{getGoalLabel(user?.goal)}</span>.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={() => setIsLogModalOpen(true)}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold flex items-center transition-colors shadow-sm"
                    >
                         <Plus className="w-4 h-4 mr-2" />
                         <span>Log workout</span>
                    </button>
                    {plan && (
                        <button 
                            onClick={handleDeletePlan}
                            disabled={loading}
                            className="bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 px-4 py-2.5 rounded-xl font-semibold flex items-center transition-colors shadow-sm"
                            title="Discard plan"
                        >
                             <Trash2 className="w-4 h-4 mr-2" />
                             <span>Discard plan</span>
                        </button>
                    )}
                    <button 
                        onClick={handleGenerate} 
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span>{plan ? "Generate new weekly plan" : "Generate weekly plan"}</span>
                    </button>
                </div>
            </header>

            {error && !loading && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div>
                        <p className="font-semibold">{error}</p>
                        <p className="text-sm text-red-600 mt-0.5">The AI Coach is experiencing high demand. Please try again.</p>
                    </div>
                    <button 
                        onClick={handleGenerate}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center shadow-sm"
                    >
                        <Sparkles className="w-4 h-4 mr-2" /> Retry generation
                    </button>
                </div>
            )}

            {!plan && !loading && (
                <div className="bg-white rounded-2xl p-12 text-center flex flex-col items-center border border-slate-200 shadow-sm">
                    <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4 text-green-600">
                        <Dumbbell className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No workout plan</h3>
                    <p className="text-slate-600 max-w-md text-base font-medium mb-6">
                        Generate a custom weekly workout program tailored to your goals.
                    </p>
                    <button onClick={handleGenerate} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors">
                        Generate weekly plan
                    </button>
                </div>
            )}

            {loading && (
                <div className="bg-white rounded-2xl p-16 flex flex-col items-center justify-center text-center border border-slate-200 shadow-sm space-y-4">
                    <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                    <div>
                        <p className="text-lg font-bold text-slate-900">Generating your workout plan...</p>
                        <p className="text-slate-500 text-sm mt-1">This can take up to 30s</p>
                    </div>
                </div>
            )}

            {plan && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    
                    {/* Progress Bar */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
                        <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                            <Target className="w-6 h-6" />
                        </div>
                        <div className="flex-1 w-full text-center md:text-left">
                            <div className="flex flex-col md:flex-row justify-between items-center text-sm font-semibold text-slate-700 gap-2 mb-2">
                                <h3 className="text-lg font-bold text-slate-900">Progress</h3>
                                <span className="text-slate-600">{completedExCount} of {totalExCount} exercises done ({Math.round(progressPercent)}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: `${progressPercent}%` }} 
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full rounded-full bg-green-600"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h2 className="text-2xl font-bold text-slate-900">{plan.title || 'Your workout plan'}</h2>
                        {plan.overview && <p className="text-slate-600 font-medium mt-2 leading-relaxed">{plan.overview}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plan.days?.map((dayObj, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50">
                                    <h3 className="text-lg font-bold text-slate-900">{dayObj.day}</h3>
                                    <p className="text-xs font-semibold text-green-700 mt-0.5 uppercase tracking-wider">{dayObj.type}</p>
                                </div>
                                <div className="p-5 flex-1">
                                    {dayObj.exercises?.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center py-8 text-slate-400">
                                            <Clock className="w-8 h-8 mb-2" />
                                            <p className="font-semibold text-sm">Rest day</p>
                                        </div>
                                    ) : (
                                        <ul className="space-y-4">
                                            {dayObj.exercises?.map((ex, j) => {
                                                const key = `${i}-${j}`;
                                                const isDone = completedExercises[key];
                                                return (
                                                <li key={j} className={`flex flex-col gap-2 pb-4 border-b border-slate-100 last:border-0 last:pb-0 transition-opacity ${isDone ? 'opacity-50' : 'opacity-100'}`}>
                                                    <div className="flex justify-between items-start gap-2">
                                                        <span className={`text-base font-bold ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{ex.name}</span>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleLogWorkout(i, j, ex.name, ex.sets, ex.reps); }}
                                                            disabled={isDone}
                                                            className={`p-1.5 rounded-lg transition-colors ${isDone ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-green-600 hover:text-white'}`}
                                                            title="Log completion"
                                                        >
                                                            {isDone ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                                        <span className="bg-slate-100 px-2.5 py-1 rounded-md">{ex.sets} sets</span>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        <span className="bg-slate-100 px-2.5 py-1 rounded-md">{formatRepChip(ex.reps)}</span>
                                                    </div>
                                                </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            <LogWorkoutModal 
                isOpen={isLogModalOpen} 
                onClose={() => setIsLogModalOpen(false)} 
                onSuccess={handleLogSuccess}
            />
        </div>
    );
};

export default Workout;
