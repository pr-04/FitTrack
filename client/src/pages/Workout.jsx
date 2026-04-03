import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { workoutAPI } from '../services/api';
import { Loader2, CheckCircle, Sparkles, Trophy, Dumbbell, Target, Clock, Activity, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogWorkoutModal from '../components/modals/LogWorkoutModal';
import { toast } from 'react-hot-toast';

const Workout = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [plan, setPlan] = useState(null);
    const [planId, setPlanId] = useState(null);
    const [completedExercises, setCompletedExercises] = useState({});

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

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await workoutAPI.generate({ goal: user.goal, fitnessLevel: user.activityLevel });
            setPlan(res.data.plan);
            setPlanId(res.data._id);
            // Refresh history to ensure synchronization
            fetchHistory();
        } catch (error) {
            console.error("Failed to generate plan", error);
            const errorMsg = error.response?.data?.message || error.message;
            alert(`Coach Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePlan = async () => {
        if (!planId) return;
        if (!window.confirm("Are you sure you want to discard this 7-day training architecture? This cannot be undone.")) return;
        
        setLoading(true);
        try {
            await workoutAPI.delete(planId);
            setPlan(null);
            setPlanId(null);
            setCompletedExercises({});
            fetchHistory();
        } catch (error) {
            console.error("Failed to delete plan", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogSuccess = () => {
        toast.success("Workout logged successfully!");
        fetchHistory();
    };

    const handleLogWorkout = async (dayIndex, exerciseIndex, name, sets, reps) => {
        const key = `${dayIndex}-${exerciseIndex}`;
        if (completedExercises[key]) return; 

        try {
            await workoutAPI.log({ exercise: name, sets: Number(sets) || 3, reps: Number(reps) || 10, weight: 0 });
            setCompletedExercises(prev => ({...prev, [key]: true}));
        } catch (error) {
            console.error("Failed to log workout", error);
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
        <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-8 rounded-[32px] border border-white/60 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 blur-[80px] -mr-32 -mt-32 rounded-full"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 font-display">
                        Titan Training
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg font-medium">
                        AI-optimized roadmap for <span className="text-blue-600 capitalize">{user?.goal?.replace('_', ' ')}</span> performance.
                    </p>
                </div>
                <div className="flex gap-3 relative z-10">
                    <button 
                        onClick={() => setIsLogModalOpen(true)}
                        className="bg-white/80 hover:bg-blue-50 text-blue-600 border border-blue-100 px-6 py-4 rounded-2xl font-bold flex items-center transition-all duration-300 shadow-sm"
                    >
                         <Plus className="w-5 h-5 mr-0 md:mr-2" />
                         <span className="hidden md:inline">Log Workout</span>
                    </button>
                    {plan && (
                        <button 
                            onClick={handleDeletePlan}
                            disabled={loading}
                            className="bg-white/80 hover:bg-red-50 text-red-500 border border-red-100 px-6 py-4 rounded-2xl font-bold flex items-center transition-all duration-300 shadow-sm"
                            title="Discard current plan"
                        >
                             <Clock className="w-5 h-5 mr-0 md:mr-2" />
                             <span className="hidden md:inline">Discard Plan</span>
                        </button>
                    )}
                    <button 
                        onClick={handleGenerate} 
                        disabled={loading}
                        className="btn-primary flex items-center justify-center gap-3 py-4 px-8 text-lg"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {plan ? "Generate New Weekly Plan" : "Generate Weekly Plan"}
                    </button>
                </div>
            </header>

            {!plan && !loading && (
                <div className="card-elevated p-20 text-center flex flex-col items-center bg-white border-none shadow-[0_45px_100px_-20px_rgba(0,0,0,0.06)]">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-10">
                        <Dumbbell className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-gray-900 font-display italic mb-4">Architecture Foundational Training</h3>
                    <p className="text-gray-500 max-w-md text-lg font-medium mb-10 leading-relaxed">Your profile requires a custom AI training program. Initiate the generation to begin your evolution.</p>
                    <button onClick={handleGenerate} className="btn-primary py-5 px-10 text-xl font-black">
                        Analyze & Generate Plan
                    </button>
                </div>
            )}

            {loading && (
                <div className="card-elevated p-32 flex flex-col items-center justify-center bg-white border-none space-y-8 shadow-[0_45px_100px_-20px_rgba(0,0,0,0.06)]">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 animate-pulse rounded-full"></div>
                        <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative z-10" />
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-gray-900 font-display italic">Instructing AI Coach...</p>
                        <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-xs">Optimizing exercise vectors</p>
                    </div>
                </div>
            )}

            {plan && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                    
                    {/* Weekly Performance Matrix */}
                    <div className="card-elevated p-10 bg-white border-none shadow-[0_40px_100px_-20px_rgba(59,130,246,0.12)] relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 blur-[50px] -ml-10 -mt-10 rounded-full"></div>
                        <div className="w-24 h-24 rounded-[32px] bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-2xl shadow-blue-500/40 relative z-10">
                            <Trophy className="w-12 h-12 text-white" />
                        </div>
                        <div className="flex-1 w-full relative z-10 text-center md:text-left">
                            <h3 className="text-2xl font-extrabold text-gray-900 font-display italic">Weekly Training Matrix</h3>
                            <div className="flex flex-col md:flex-row justify-between items-center text-sm font-black text-gray-400 mt-2 gap-4">
                                <span className="uppercase tracking-widest">{completedExCount} OF {totalExCount} EXERCISES SYNCED</span>
                                <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full">{Math.round(progressPercent)}% COMPLETED</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-4 mt-6 overflow-hidden shadow-inner">
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: `${progressPercent}%` }} 
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card-elevated p-12 bg-white border-none shadow-[0_45px_100px_-20px_rgba(0,0,0,0.06)] relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Activity className="w-48 h-48" />
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 font-display italic relative z-10">{plan.title || 'Elite Plan'}</h2>
                        <p className="text-gray-500 text-xl font-medium mt-6 leading-relaxed max-w-4xl relative z-10">{plan.overview}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {plan.days?.map((dayObj, i) => (
                            <div key={i} className="card-elevated flex flex-col hover:-translate-y-2 transition-all duration-500 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.04)] bg-white border-none group">
                                <div className="p-8 border-b border-gray-50 bg-gray-50/50 group-hover:bg-blue-600 transition-colors duration-500 rounded-t-[32px]">
                                    <h3 className="text-2xl font-black text-gray-900 font-display italic group-hover:text-white transition-colors">{dayObj.day}</h3>
                                    <p className="text-sm font-black text-blue-600 mt-1 uppercase tracking-widest group-hover:text-blue-100 transition-colors">{dayObj.type}</p>
                                </div>
                                <div className="p-8 flex-1">
                                    {dayObj.exercises?.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                                            <Clock className="w-10 h-10 mb-4" />
                                            <p className="font-bold uppercase tracking-tighter italic">Rest & Strategy</p>
                                        </div>
                                    ) : (
                                        <ul className="space-y-6">
                                            {dayObj.exercises?.map((ex, j) => {
                                                const key = `${i}-${j}`;
                                                const isDone = completedExercises[key];
                                                return (
                                                <li key={j} className={`flex flex-col gap-2 pb-6 border-b border-gray-50 last:border-0 last:pb-0 transition-opacity duration-300 ${isDone ? 'opacity-50' : 'opacity-100'}`}>
                                                    <div className="flex justify-between items-start gap-4">
                                                        <span className={`text-lg font-extrabold font-display ${isDone ? 'text-gray-400 line-through italic' : 'text-gray-900 uppercase'}`}>{ex.name}</span>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleLogWorkout(i, j, ex.name, ex.sets, ex.reps); }}
                                                            disabled={isDone}
                                                            className={`p-2 rounded-xl transition-all duration-300 ${isDone ? 'bg-green-100 text-green-600 shadow-none' : 'bg-gray-50 text-blue-600 hover:bg-blue-600 hover:text-white shadow-sm'}`}
                                                            title="Log completion"
                                                        >
                                                            {isDone ? <CheckCircle className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded">{ex.sets} SETS</span>
                                                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded">{ex.reps} REPS</span>
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
