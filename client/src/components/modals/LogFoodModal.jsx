import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Apple, Save, Loader2, History, Beef, Zap, LayoutGrid, Sparkles } from 'lucide-react';
import { dietAPI } from '../../services/api';

const LogFoodModal = ({ isOpen, onClose, onSuccess }) => {
    const [mode, setMode] = useState('quick'); // 'quick' or 'detailed'
    const [formData, setFormData] = useState({
        name: '',
        weight: '',
        quantity: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [fetching, setFetching] = useState(false);
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
            const res = await dietAPI.getRecentFoods();
            setSuggestions(res.data);
        } catch (err) {
            console.error("Failed to fetch suggestions", err);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.name && formData.name.length > 2) {
                handleLookup();
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [formData.name, formData.weight, formData.quantity]);

    const handleLookup = async () => {
        try {
            setFetching(true);
            setError(null);
            
            // Build query based on what the user entered
            let lookupQuery = '';
            const quantity = Number(formData.quantity);
            const weight = Number(formData.weight);

            if (quantity > 0) {
                lookupQuery += `${quantity} `;
            }
            if (weight > 0 && weight !== 100) {
                lookupQuery += `${weight}g `;
            } else if (quantity === 0 || !quantity) {
                // If no quantity, use weight even if it's default
                lookupQuery += `${weight}g `;
            }
            
            lookupQuery += formData.name;

            const res = await dietAPI.lookup(lookupQuery.trim());
            const data = res.data;
            setFormData(prev => ({
                ...prev,
                calories: data.calories,
                protein: data.protein,
                carbs: data.carbs,
                fats: data.fats
            }));
        } catch (err) {
            console.error("Lookup failed", err);
            setError(err.response?.data?.message || "Estimation failed. Try a different food name.");
        } finally {
            setFetching(false);
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
            await dietAPI.log(formData);
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to log food');
        } finally {
            setLoading(false);
        }
    };

    const selectSuggestion = (food) => {
        setFormData(prev => ({ 
            ...prev, 
            name: food.name,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fats: food.fats
        }));
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
                    className="relative bg-white rounded-[32px] p-8 shadow-2xl max-w-md w-full overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -ml-16 -mt-16" />
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                <Apple className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 font-display italic">Log Nutrition</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> AI Powered
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Food Name</label>
                            <input 
                                ref={inputRef}
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Scrambled Eggs"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all"
                                required
                            />
                            
                            {suggestions.length > 0 && !formData.name && (
                                <div className="flex flex-wrap gap-2 mt-3 pl-1">
                                    <span className="text-[9px] font-black text-slate-300 uppercase flex items-center gap-1 w-full mb-1">
                                        <History className="w-3 h-3" /> Recent entries
                                    </span>
                                    {suggestions.map((s, i) => (
                                        <button 
                                            key={i}
                                            type="button"
                                            onClick={() => selectSuggestion(s)}
                                            className="text-[11px] font-bold px-3 py-1.5 bg-white border border-slate-100 text-slate-500 rounded-full hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Weight (g)</label>
                                <input 
                                    type="number"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    placeholder="100"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:border-emerald-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Quantity</label>
                                <input 
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    placeholder="1"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:border-emerald-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">AI Estimated Calories</label>
                            <div className="relative">
                                <Zap className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${fetching ? 'text-indigo-400 animate-pulse' : 'text-emerald-400'}`} />
                                <input 
                                    type="number"
                                    name="calories"
                                    value={formData.calories}
                                    readOnly
                                    required
                                    placeholder="Analyzing food..."
                                    className="w-full bg-emerald-50/30 border border-emerald-100 rounded-2xl pl-12 pr-5 py-4 text-emerald-700 font-black focus:outline-none transition-all"
                                />
                                {fetching && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-400" />}
                            </div>
                        </div>

                        {mode === 'detailed' && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="grid grid-cols-3 gap-3 pt-2"
                            >
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Protein</label>
                                    <input type="number" name="protein" value={formData.protein} readOnly placeholder="0g" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Carbs</label>
                                    <input type="number" name="carbs" value={formData.carbs} readOnly placeholder="0g" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Fats</label>
                                    <input type="number" name="fats" value={formData.fats} readOnly placeholder="0g" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none transition-all" />
                                </div>
                            </motion.div>
                        )}

                        {error && <p className="text-xs font-bold text-red-500 ml-1">{error}</p>}

                        <button 
                            type="submit" 
                            disabled={loading || fetching || !formData.calories}
                            className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Log Food
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LogFoodModal;
