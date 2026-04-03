import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dumbbell, Save, Loader2, History, Plus, Minus } from 'lucide-react';
import { workoutAPI } from '../../services/api';

const LogWorkoutModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        exercise: '',
        sets: '',
        reps: '',
        weight: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchSuggestions();
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const fetchSuggestions = async () => {
        try {
            const res = await workoutAPI.getRecentExercises();
            setSuggestions(res.data);
        } catch (err) {
            console.error("Failed to fetch suggestions", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            await workoutAPI.log(formData);
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to log workout');
        } finally {
            setLoading(false);
        }
    };

    const selectSuggestion = (name) => {
        setFormData(prev => ({ ...prev, exercise: name }));
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                                <Dumbbell className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Log Workout</h3>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Protocol Entry</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Exercise Name</label>
                            <input 
                                ref={inputRef}
                                name="exercise"
                                value={formData.exercise}
                                onChange={handleChange}
                                placeholder="e.g. Bench Press"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                            
                            {suggestions.length > 0 && !formData.exercise && (
                                <div className="flex flex-wrap gap-2 mt-3 pl-1">
                                    <span className="text-[10px] font-black text-slate-300 uppercase flex items-center gap-1 w-full mb-1">
                                        <History className="w-3 h-3" /> Recent Exercises
                                    </span>
                                    {suggestions.map((s, i) => (
                                        <button 
                                            key={i}
                                            type="button"
                                            onClick={() => selectSuggestion(s)}
                                            className="text-[11px] font-bold px-3 py-1.5 bg-white border border-slate-100 text-slate-500 rounded-full hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Sets</label>
                                <input 
                                    type="number"
                                    name="sets"
                                    value={formData.sets}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Reps</label>
                                <input 
                                    type="number"
                                    name="reps"
                                    value={formData.reps}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Weight (Optional kg)</label>
                            <input 
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                placeholder="0.0"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        {error && <p className="text-xs font-bold text-red-500 ml-1">{error}</p>}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-5 bg-blue-600 text-white rounded-[22px] font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Complete Entry
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LogWorkoutModal;
