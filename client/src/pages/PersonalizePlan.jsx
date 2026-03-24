import React, { useState, useEffect, useRef } from 'react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    Calendar, Dumbbell, Utensils, ChevronRight, Loader2, Sparkles, 
    Trash2, ArrowLeft, Send, MessageSquare, Zap, CheckCircle, Info 
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';

const PersonalizePlan = () => {
    const { user } = useAuth();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingWorkout, setGeneratingWorkout] = useState(false);
    const [generatingDiet, setGeneratingDiet] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [error, setError] = useState('');
    
    // Generation states
    const [goal, setGoal] = useState(user?.goal || 'maintain');
    const [instruction, setInstruction] = useState('');
    
    // Chat states
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    const goalOptions = [
        { value: 'lose_weight', label: 'Lose Weight' },
        { value: 'gain_muscle', label: 'Gain Muscle' },
        { value: 'maintain', label: 'Maintain Weight' },
        { value: 'improve_fitness', label: 'Improve Fitness' },
    ];

    const fetchPlans = async () => {
        try {
            const res = await aiAPI.getUserPlans();
            setPlans(res.data);
            if (res.data.length > 0 && !selectedPlan) {
                // Optionally auto-select the latest plan? 
                // For now, let's just keep the list.
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleGenerate = async (type) => {
        const setGenerating = type === 'workout' ? setGeneratingWorkout : setGeneratingDiet;
        setGenerating(true);
        setError('');
        try {
            const endpoint = type === 'workout' ? aiAPI.getWorkoutPlan : aiAPI.getDietPlan;
            const res = await endpoint({ instruction, goal });
            const generatedData = res.data;

            // Auto-save the plan
            const saveRes = await aiAPI.savePlan({
                type,
                data: generatedData,
                instruction: instruction.trim() || undefined
            });

            const newSavedPlan = saveRes.data;
            setPlans([newSavedPlan, ...plans]);
            setSelectedPlan(newSavedPlan);
            setChatHistory([]); // Reset chat for new plan
        } catch (err) {
            console.error('Generation/Save error:', err);
            setError(err.response?.data?.message || 'Failed to generate plan. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this plan?')) return;
        try {
            await aiAPI.deletePlan(id);
            setPlans(plans.filter(p => p._id !== id));
            if (selectedPlan?._id === id) setSelectedPlan(null);
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleChat = async (e) => {
        e.preventDefault();
        if (!chatMessage.trim() || chatLoading) return;

        const userMsg = { role: 'user', parts: [{ text: chatMessage }] };
        setChatHistory(prev => [...prev, userMsg]);
        setChatMessage('');
        setChatLoading(true);

        try {
            const res = await aiAPI.chatAboutPlan(chatMessage, selectedPlan.data, chatHistory);
            const aiMsg = { role: 'model', parts: [{ text: res.data.message }] };
            setChatHistory(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: 'Sorry, I had trouble processing that. Please try again.' }] }]);
        } finally {
            setChatLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-10 h-10 text-accent-blue animate-spin" />
            </div>
        );
    }

    // --- Sub-component: Plan Detail View ---
    const renderPlanDetail = (planObj) => {
        const plan = planObj.data;
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button 
                        onClick={() => setSelectedPlan(null)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition group w-fit"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition" /> 
                        Back to All Plans
                    </button>
                    <button 
                        onClick={(e) => handleDelete(planObj._id, e)}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 transition text-sm font-medium w-fit"
                    >
                        <Trash2 size={16} /> Delete Plan
                    </button>
                </div>

                <Card className="bg-gray-800 border-gray-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                         {planObj.type === 'workout' ? <Dumbbell size={120} /> : <Utensils size={120} />}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`p-3 rounded-2xl ${planObj.type === 'workout' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                            {planObj.type === 'workout' ? <Dumbbell size={28} /> : <Utensils size={28} />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                {planObj.type === 'workout' ? plan.title : 'Personalized Nutrition Guide'}
                            </h2>
                            <p className="text-slate-400 text-sm flex items-center gap-2">
                                <Calendar size={14} /> Created on {new Date(planObj.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {planObj.instruction && (
                        <div className="mb-8 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-start gap-3">
                            <Info size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-slate-300 text-sm italic">" {planObj.instruction} "</p>
                        </div>
                    )}

                    {planObj.type === 'workout' ? (
                        <div className="space-y-6">
                            <p className="text-slate-300 leading-relaxed text-lg">{plan.overview}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plan.days.map((day, idx) => (
                                    <div key={idx} className="bg-gray-900/40 border border-gray-700/50 rounded-2xl overflow-hidden hover:border-blue-500/30 transition group">
                                        <div className="bg-gray-800/80 px-5 py-3 border-b border-gray-700 flex justify-between items-center group-hover:bg-blue-500/10 transition">
                                            <span className="font-bold text-blue-400">{day.day}</span>
                                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{day.type}</span>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            {day.exercises.map((ex, i) => (
                                                <div key={i} className="border-l-2 border-slate-700 pl-4 py-0.5">
                                                    <p className="font-bold text-white text-md">{ex.name}</p>
                                                    <p className="text-slate-400 text-xs mt-1">
                                                        {ex.sets} sets × {ex.reps} reps {ex.weight ? `• ${ex.weight}` : ''}
                                                    </p>
                                                </div>
                                            ))}
                                            {day.exercises.length === 0 && (
                                                <p className="text-center text-slate-500 py-4 italic text-sm">Recovery Day</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="bg-gray-900/40 p-6 rounded-3xl border border-gray-700/50 text-center flex flex-col justify-center">
                                    <p className="text-4xl font-black text-green-400">{plan.dailyCalories}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-2">Daily Calories</p>
                                </div>
                                <div className="bg-gray-900/40 p-6 rounded-3xl border border-gray-700/50 flex justify-around items-center col-span-2">
                                    <div className="text-center">
                                        <p className="text-xl font-black text-blue-400">{plan.macros.protein}</p>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Protein</p>
                                    </div>
                                    <div className="w-px h-12 bg-gray-700/50" />
                                    <div className="text-center">
                                        <p className="text-xl font-black text-yellow-400">{plan.macros.carbs}</p>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Carbs</p>
                                    </div>
                                    <div className="w-px h-12 bg-gray-700/50" />
                                    <div className="text-center">
                                        <p className="text-xl font-black text-red-500">{plan.macros.fats}</p>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Fats</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(plan.meals).map(([meal, items], i) => (
                                    <div key={i} className="bg-gray-900/40 p-6 rounded-3xl border border-gray-700/50 hover:border-green-500/30 transition">
                                        <h4 className="font-black text-white capitalize text-lg mb-3 flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-green-500 rounded-full" /> {meal}
                                        </h4>
                                        <ul className="text-slate-300 space-y-2">
                                            {Array.isArray(items) ? items.map((it, j) => (
                                                <li key={j} className="flex gap-2 text-sm">
                                                   <span className="text-green-500 font-bold">•</span> {it}
                                                </li>
                                            )) : <li className="text-sm">• {items}</li>}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Plan Chat Logic */}
                <div className="mt-12 space-y-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 px-1">
                        <MessageSquare className="text-accent-blue" /> Ask AI about this plan
                    </h3>
                    <div className="bg-gray-900/50 border border-gray-700 rounded-3xl overflow-hidden flex flex-col h-[400px]">
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                            {chatHistory.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <Sparkles size={40} className="mb-4" />
                                    <p className="text-sm">Ask anything! e.g., "What can I substitute for the snacks?"<br/> or "Is this plan safe for a beginner?"</p>
                                </div>
                            )}
                            {chatHistory.map((item, idx) => (
                                <div key={idx} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                                        item.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' 
                                            : 'bg-gray-800 text-slate-200 border border-gray-700 rounded-tl-none'
                                    }`}>
                                        {item.parts[0].text}
                                    </div>
                                </div>
                            ))}
                            {chatLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin text-accent-blue" />
                                        <span className="text-xs text-slate-400">Thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <form onSubmit={handleChat} className="p-4 bg-gray-800/80 border-t border-gray-700 flex gap-2">
                            <input 
                                type="text"
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder="Type your question..."
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            />
                            <button 
                                type="submit"
                                disabled={!chatMessage.trim() || chatLoading}
                                className="w-12 h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition disabled:opacity-50 disabled:hover:bg-blue-600"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto pb-10">
            {selectedPlan ? (
                renderPlanDetail(selectedPlan)
            ) : (
                <>
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                                <Sparkles className="text-yellow-400" /> Personalize Plan
                            </h1>
                            <p className="text-slate-400 text-lg mt-2">AI-powered fitness and nutrition, built just for you.</p>
                        </div>
                    </header>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                             <span className="font-bold">Error:</span> {error}
                        </div>
                    )}

                    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-white/5 shadow-2xl p-8 relative overflow-hidden group">
                        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-accent-blue/10 rounded-full blur-3xl group-hover:bg-accent-blue/20 transition-all duration-1000" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Your Fitness Goal</label>
                                    <Select 
                                        name="goal" 
                                        value={goal} 
                                        onChange={(e) => setGoal(e.target.value)} 
                                        options={goalOptions}
                                        className="bg-gray-900/50 border-gray-700 rounded-2xl h-14"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Special Adjustments <span className="text-xs font-normal opacity-50">(Optional)</span></label>
                                        <Zap size={14} className="text-accent-blue" />
                                    </div>
                                    <textarea 
                                        value={instruction}
                                        onChange={(e) => setInstruction(e.target.value)}
                                        placeholder="e.g. 'No eggs in diet', 'Knee injury - no jumping', 'I only have dumbbells'"
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col justify-end space-y-4">
                                <div className="p-5 bg-blue-500/5 rounded-3xl border border-blue-500/10 mb-2">
                                    <h4 className="text-blue-400 font-bold flex items-center gap-2 mb-2">
                                        <Sparkles size={16} /> Powerful AI Generation
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Our AI will analyze your physical profile, current weight history, and your specific goal to create a 7-day optimized routine.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Button 
                                        onClick={() => handleGenerate('workout')}
                                        loading={generatingWorkout}
                                        disabled={generatingDiet}
                                        className="h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-lg font-black tracking-tight"
                                    >
                                        <Dumbbell className="mr-2" size={24} /> Create Workout
                                    </Button>
                                    <Button 
                                        onClick={() => handleGenerate('diet')}
                                        loading={generatingDiet}
                                        disabled={generatingWorkout}
                                        className="h-16 rounded-2xl bg-green-600 hover:bg-green-500 text-lg font-black tracking-tight border-none"
                                    >
                                        <Utensils className="mr-2" size={24} /> Create Diet
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="pt-6 space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Calendar className="text-slate-500" /> Your Plan History
                            </h2>
                            <span className="text-xs text-slate-500 font-mono italic">{plans.length} plan{plans.length !== 1 ? 's' : ''} saved</span>
                        </div>

                        {plans.length === 0 ? (
                            <div className="bg-gray-800/20 border-2 border-dashed border-gray-700 rounded-[40px] py-20 text-center group">
                                <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <Zap size={36} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <p className="text-slate-500 font-medium text-lg">Your history is clear. Generate a plan above to get started!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map((plan) => (
                                    <button 
                                        key={plan._id} 
                                        onClick={() => setSelectedPlan(plan)}
                                        className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 rounded-[32px] p-6 text-left transition-all duration-300 transform hover:-translate-y-2 group relative overflow-hidden"
                                    >
                                        <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 scale-110 pointer-events-none transition-transform group-hover:scale-125 ${plan.type === 'workout' ? 'text-blue-500' : 'text-green-500'}`}>
                                            {plan.type === 'workout' ? <Dumbbell size={128} /> : <Utensils size={128} />}
                                        </div>

                                        <div className="flex items-start justify-between mb-6 relative z-10">
                                            <div className={`p-3 rounded-2xl ${plan.type === 'workout' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {plan.type === 'workout' ? <Dumbbell size={24} /> : <Utensils size={24} />}
                                            </div>
                                            <div className="bg-gray-900/80 px-3 py-1.5 rounded-full border border-gray-700 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                {new Date(plan.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        
                                        <h3 className="text-xl font-black text-white mb-2 line-clamp-1 relative z-10 transition group-hover:text-accent-blue">
                                            {plan.type === 'workout' ? plan.data.title : 'Personal Diet'}
                                        </h3>
                                        
                                        {plan.instruction ? (
                                            <p className="text-sm text-slate-500 line-clamp-2 italic mb-6 relative z-10">
                                                "{plan.instruction}"
                                            </p>
                                        ) : (
                                            <div className="h-4 mb-6" /> // spacer
                                        )}

                                        <div className="flex items-center justify-between relative z-10 pt-4 border-t border-gray-700/50">
                                            <div className="flex items-center gap-1.5 text-accent-blue text-xs font-black uppercase tracking-widest group-hover:gap-2.5 transition-all">
                                                View Plan <ChevronRight size={14} />
                                            </div>
                                            <div onClick={(e) => handleDelete(plan._id, e)} className="p-2 hover:bg-red-500/10 rounded-xl text-slate-600 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default PersonalizePlan;
