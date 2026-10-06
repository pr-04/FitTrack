import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Apple, Save, Loader2, History, Zap, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { dietAPI } from '../../services/api';

const LogFoodModal = ({ isOpen, onClose, onSuccess, initialFood = null }) => {
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
    const lastLookupQueryRef = useRef('');

    const fetchSuggestions = async () => {
        try {
            const res = await dietAPI.getRecentFoods();
            setSuggestions(res.data);
        } catch (err) {
            console.error("Failed to fetch suggestions", err);
        }
    };

    const handleLookup = async (nameVal, weightVal, quantityVal) => {
        if (!nameVal || !nameVal.trim()) return;
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
            }
            
            lookupQuery += nameVal.trim();
            const trimmedQuery = lookupQuery.trim();
            lastLookupQueryRef.current = trimmedQuery;

            const res = await dietAPI.lookup(trimmedQuery);
            
            // Race-condition guard: ignore stale responses if a newer request was dispatched
            if (currentRequestId !== requestIdRef.current) {
                return;
            }

            const data = res.data;
            setFormData(prev => ({
                ...prev,
                calories: data.calories !== undefined ? data.calories : prev.calories,
                protein: data.protein !== undefined ? data.protein : prev.protein,
                carbs: data.carbs !== undefined ? data.carbs : prev.carbs,
                fats: data.fats !== undefined ? data.fats : prev.fats
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

    // Reset state whenever modal opens or closes, and prefill / trigger lookup if initialFood is provided
    useEffect(() => {
        if (isOpen) {
            setNeedsConfirmation(false);
            setIsConfirmed(false);
            setError(null);
            fetchSuggestions();

            const initialName = (typeof initialFood === 'string' ? initialFood : initialFood?.name) || '';

            if (initialName) {
                const newForm = {
                    name: initialName,
                    weight: '',
                    quantity: '',
                    calories: '',
                    protein: '',
                    carbs: '',
                    fats: '',
                    date: new Date().toISOString().split('T')[0]
                };
                setFormData(newForm);
                // Trigger immediate AI lookup without waiting for 1s debounce
                handleLookup(initialName, '', '');
            } else {
                setFormData({
                    name: '',
                    weight: '',
                    quantity: '',
                    calories: '',
                    protein: '',
                    carbs: '',
                    fats: '',
                    date: new Date().toISOString().split('T')[0]
                });
                lastLookupQueryRef.current = '';
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        } else {
            setNeedsConfirmation(false);
            setIsConfirmed(false);
            setError(null);
            setFetching(false);
            requestIdRef.current++;
            lastLookupQueryRef.current = '';
            setFormData({
                name: '',
                weight: '',
                quantity: '',
                calories: '',
                protein: '',
                carbs: '',
                fats: '',
                date: new Date().toISOString().split('T')[0]
            });
        }
    }, [isOpen, initialFood]);

    // 1-second debounce for auto nutrition estimation when user types
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.name && formData.name.trim().length > 2) {
                let currentQuery = '';
                const q = Number(formData.quantity);
                const w = Number(formData.weight);
                if (q > 0) currentQuery += `${q} `;
                if (w > 0 && w !== 100) currentQuery += `${w}g `;
                currentQuery += formData.name.trim();

                if (currentQuery.trim() !== lastLookupQueryRef.current) {
                    handleLookup(formData.name, formData.weight, formData.quantity);
                }
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
                            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-sm border border-slate-200">
                                <Apple className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 font-display">Log Nutrition</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-green-50 text-green-700 rounded-md border border-green-200 flex items-center gap-1">
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
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Food Name</label>
                            <input 
                                ref={inputRef}
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Scrambled Eggs"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 font-medium focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none transition-all"
                                required
                            />
                            
                            {suggestions.length > 0 && !formData.name && (
                                <div className="flex flex-wrap gap-2 mt-3 pl-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 w-full mb-1">
                                        <History className="w-3 h-3" /> Recent entries
                                    </span>
                                    {suggestions.map((s, i) => (
                                        <button 
                                            key={i}
                                            type="button"
                                            onClick={() => selectSuggestion(s)}
                                            className="text-[11px] font-semibold px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:border-green-600 hover:text-green-600 transition-all shadow-sm"
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Weight (g)</label>
                                <input 
                                    type="number"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    placeholder="100"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 font-medium focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Quantity</label>
                                <input 
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    placeholder="1"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 font-medium focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Calories (kcal)</label>
                                <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                    AI Estimate
                                </span>
                            </div>
                            <div className="relative">
                                <Zap className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${fetching ? 'text-green-600 animate-pulse' : 'text-green-600'}`} />
                                <input 
                                    type="number"
                                    name="calories"
                                    value={formData.calories}
                                    onChange={handleChange}
                                    required
                                    placeholder={fetching ? "Analyzing food..." : "0"}
                                    className="w-full bg-green-50/50 border border-green-200 rounded-2xl pl-12 pr-5 py-3.5 text-green-900 font-bold focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none transition-all"
                                />
                                {fetching && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-green-600" />}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Macros (g) - Editable</label>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pl-1">Protein</label>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        name="protein" 
                                        value={formData.protein} 
                                        onChange={handleChange}
                                        placeholder="0g" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none transition-all" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pl-1">Carbs</label>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        name="carbs" 
                                        value={formData.carbs} 
                                        onChange={handleChange}
                                        placeholder="0g" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none transition-all" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pl-1">Fats</label>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        name="fats" 
                                        value={formData.fats} 
                                        onChange={handleChange}
                                        placeholder="0g" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none transition-all" 
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

                        {error && <p className="text-xs font-semibold text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">{error}</p>}

                        <button 
                            type="submit" 
                            disabled={loading || fetching || formData.calories === '' || (needsConfirmation && !isConfirmed)}
                            className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-lg shadow-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
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
