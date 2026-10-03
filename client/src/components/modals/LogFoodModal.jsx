import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Apple, Save, Loader2, History, Zap, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { dietAPI } from '../../services/api';

const LogFoodModal = ({ isOpen, onClose, onSuccess }) => {
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
    const [needsConfirmation, setNeedsConfirmation] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    
    const inputRef = useRef(null);
    const requestIdRef = useRef(0);

    // Reset state whenever modal opens or closes
    useEffect(() => {
        if (isOpen) {
            setNeedsConfirmation(false);
            setIsConfirmed(false);
            setError(null);
            fetchSuggestions();
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setNeedsConfirmation(false);
            setIsConfirmed(false);
            setError(null);
            requestIdRef.current++;
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

    const handleLookup = async (nameVal, weightVal, quantityVal) => {
        const currentRequestId = ++requestIdRef.current;
        try {
            setFetching(true);
            setError(null);
            
            let lookupQuery = '';
            const quantity = Number(quantityVal);
            const weight = Number(weightVal);

            if (quantity > 0) {
                lookupQuery += `${quantity} `;
            }
            if (weight > 0 && weight !== 100) {
                lookupQuery += `${weight}g `;
            } else if (quantity === 0 || !quantity) {
                lookupQuery += `${weight}g `;
            }
            
            lookupQuery += nameVal;

            const res = await dietAPI.lookup(lookupQuery.trim());
            
            // Race-condition guard: ignore stale responses if a newer request was dispatched
            if (currentRequestId !== requestIdRef.current) {
                return;
            }

            const data = res.data;
            setFormData(prev => ({
                ...prev,
                calories: data.calories,
                protein: data.protein,
                carbs: data.carbs,
                fats: data.fats
            }));

            if (data.needsConfirmation || data.calories > 5000) {
                setNeedsConfirmation(true);
                setIsConfirmed(false);
            } else {
                setNeedsConfirmation(false);
                setIsConfirmed(true);
            }
        } catch (err) {
            if (currentRequestId !== requestIdRef.current) {
                return;
            }
            console.error("Lookup failed", err);
            setNeedsConfirmation(false);
            setError(err.response?.data?.message || "Could not estimate nutrition. Please enter values manually.");
        } finally {
            if (currentRequestId === requestIdRef.current) {
                setFetching(false);
            }
        }
    };

    // 1-second debounce for auto nutrition estimation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.name && formData.name.trim().length > 2) {
                handleLookup(formData.name, formData.weight, formData.quantity);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [formData.name, formData.weight, formData.quantity]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'calories') {
            const calNum = Number(value);
            if (calNum > 5000) {
                setNeedsConfirmation(true);
                setIsConfirmed(false);
            } else {
                setNeedsConfirmation(false);
                setIsConfirmed(true);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (needsConfirmation && !isConfirmed) {
            setError("That's a very large amount (5,000+ kcal). Please confirm before saving.");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await dietAPI.log(formData);
            
            // Reset confirmation states after successful save
            setNeedsConfirmation(false);
            setIsConfirmed(false);
            
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
                    
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                <Apple className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 font-display italic">Log Nutrition</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> AI Estimate (Editable)
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Food Name</label>
                            <input 
                                ref={inputRef}
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Scrambled Eggs"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all"
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
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 font-bold focus:border-emerald-500 outline-none transition-all"
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
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 font-bold focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Calories (kcal)</label>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                    AI Estimate
                                </span>
                            </div>
                            <div className="relative">
                                <Zap className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${fetching ? 'text-indigo-400 animate-pulse' : 'text-emerald-400'}`} />
                                <input 
                                    type="number"
                                    name="calories"
                                    value={formData.calories}
                                    onChange={handleChange}
                                    required
                                    placeholder={fetching ? "Analyzing food..." : "0"}
                                    className="w-full bg-emerald-50/30 border border-emerald-100 rounded-2xl pl-12 pr-5 py-3.5 text-emerald-700 font-black focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all"
                                />
                                {fetching && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-400" />}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Macros (g) - Editable</label>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Protein</label>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        name="protein" 
                                        value={formData.protein} 
                                        onChange={handleChange}
                                        placeholder="0g" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none transition-all" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Carbs</label>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        name="carbs" 
                                        value={formData.carbs} 
                                        onChange={handleChange}
                                        placeholder="0g" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none transition-all" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Fats</label>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        name="fats" 
                                        value={formData.fats} 
                                        onChange={handleChange}
                                        placeholder="0g" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none transition-all" 
                                    />
                                </div>
                            </div>
                        </div>

                        {needsConfirmation && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>That's a very large amount (5,000+ kcal). Confirm?</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsConfirmed(true)}
                                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${isConfirmed ? 'bg-amber-600 text-white' : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-100'}`}
                                >
                                    {isConfirmed ? <><CheckCircle2 className="w-4 h-4" /> Confirmed Large Quantity</> : "Click to Confirm Large Amount"}
                                </button>
                            </div>
                        )}

                        {error && <p className="text-xs font-bold text-red-500 ml-1 bg-red-50 p-2.5 rounded-xl border border-red-100">{error}</p>}

                        <button 
                            type="submit" 
                            disabled={loading || fetching || formData.calories === '' || (needsConfirmation && !isConfirmed)}
                            className="w-full py-4 bg-emerald-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
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
