import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { Loader2, ArrowRight, ArrowLeft, Target, Activity, Utensils, Ruler, Dumbbell, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Onboarding = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    
    const [step, setStep] = useState(1);
    
    const [formData, setFormData] = useState({
        age: user?.age || '',
        weight: user?.weight || '',
        height: user?.height || '',
        goal: user?.goal || 'maintain',
        dietType: user?.dietType || 'any',
        activityLevel: user?.activityLevel || 'light',
        isOnboarded: true
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleNext = () => setStep((prev) => prev + 1);
    const handleBack = () => setStep((prev) => prev - 1);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await userAPI.updateProfile(formData);
            updateUser(res.data);
            navigate('/app/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to sync profile');
            setLoading(false);
        }
    };

    const isStep1Valid = formData.age && formData.weight && formData.height;

    const pageVariants = {
        initial: { opacity: 0, x: 40 },
        in: { opacity: 1, x: 0 },
        out: { opacity: 0, x: -40 }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <motion.div
                        key="step1"
                        variants={pageVariants}
                        initial="initial" animate="in" exit="out" transition={{ duration: 0.5, ease: "easeOut" }}
                        className="space-y-8"
                    >
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                <Ruler className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 font-display">The Basics</h3>
                        </div>
                        <p className="text-gray-500 -mt-6">We need these to calculate your BMI and daily requirements.</p>
                        
                        <div className="grid grid-cols-1 gap-6">
                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Your Age</label>
                                <input type="number" required placeholder="Years" min="12" max="100"
                                    className="block w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white transition-all text-lg font-medium"
                                    value={formData.age} onChange={(e) => setFormData({...formData, age: Number(e.target.value)})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Weight (kg)</label>
                                    <input type="number" required placeholder="70" min="30" max="250"
                                        className="block w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white transition-all text-lg font-medium"
                                        value={formData.weight} onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Height (cm)</label>
                                    <input type="number" required placeholder="175" min="100" max="250"
                                        className="block w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white transition-all text-lg font-medium"
                                        value={formData.height} onChange={(e) => setFormData({...formData, height: Number(e.target.value)})} />
                                </div>
                            </div>
                        </div>
                        <button onClick={handleNext} disabled={!isStep1Valid}
                            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100">
                            Continue <ArrowRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div
                        key="step2"
                        variants={pageVariants}
                        initial="initial" animate="in" exit="out" transition={{ duration: 0.5, ease: "easeOut" }}
                        className="space-y-8"
                    >
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                                <Target className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 font-display">Define Your Goal</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { id: 'fat_loss', label: 'Fat Loss', desc: 'Burn fat & get lean', color: 'border-orange-200 text-orange-600' },
                                { id: 'muscle_gain', label: 'Muscle Gain', desc: 'Build size & power', color: 'border-purple-200 text-purple-600' },
                                { id: 'body_recomposition', label: 'Recomposition', desc: 'Fat loss & muscle gain', color: 'border-blue-200 text-blue-600' },
                                { id: 'maintain', label: 'Maintain', desc: 'Keep current status', color: 'border-green-200 text-green-600' },
                                { id: 'strength', label: 'Strength', desc: 'Focus on heavy lifts', color: 'border-red-200 text-red-600' },
                                { id: 'endurance', label: 'Endurance', desc: 'Stamina & cardio', color: 'border-cyan-200 text-cyan-600' },
                                { id: 'general_fitness', label: 'General Fitness', desc: 'Stay healthy & active', color: 'border-emerald-200 text-emerald-600' },
                                { id: 'flexibility', label: 'Flexibility', desc: 'Mobility & yoga', color: 'border-teal-200 text-teal-600' }
                            ].map(goal => (
                                <div key={goal.id} onClick={() => setFormData({...formData, goal: goal.id})}
                                    className={`cursor-pointer group p-4 border-2 rounded-[24px] flex items-center justify-between transition-all duration-300 ${formData.goal === goal.id ? 'border-primary bg-green-50/50 shadow-md translate-x-1' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-8 rounded-full transition-all ${formData.goal === goal.id ? 'bg-primary' : 'bg-gray-100'}`}></div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 font-display leading-tight">{goal.label}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">{goal.desc}</p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.goal === goal.id ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                                        {formData.goal === goal.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleBack} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                <ArrowLeft className="w-5 h-5" /> Back
                            </button>
                            <button onClick={handleNext} className="flex-[2] btn-primary py-4 text-lg">
                                Next Step
                            </button>
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div
                        key="step3"
                        variants={pageVariants}
                        initial="initial" animate="in" exit="out" transition={{ duration: 0.5, ease: "easeOut" }}
                        className="space-y-8"
                    >
                         <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                                <Utensils className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 font-display">Dietary Preference</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'any', label: 'No Preference', desc: 'Standard balanced diet' },
                                { id: 'vegetarian', label: 'Vegetarian', desc: 'Plant-based with dairy' },
                                { id: 'vegan', label: 'Vegan', desc: 'Strictly plant-based' },
                                { id: 'pescatarian', label: 'Pescatarian', desc: 'Vegetarian plus seafood' },
                                { id: 'non-vegetarian', label: 'High Protein', desc: 'Focus on lean meats' }
                            ].map(diet => (
                                <div key={diet.id} onClick={() => setFormData({...formData, dietType: diet.id})}
                                    className={`cursor-pointer p-5 border-2 rounded-[20px] flex items-center justify-between transition-all duration-200 ${formData.dietType === diet.id ? 'border-amber-500 bg-amber-50/30' : 'border-gray-50 hover:bg-gray-50'}`}>
                                    <div>
                                        <p className="font-bold text-lg text-gray-900 font-display">{diet.label}</p>
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{diet.desc}</p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${formData.dietType === diet.id ? 'border-amber-500 bg-amber-500' : 'border-gray-200'}`}>
                                        {formData.dietType === diet.id && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleBack} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                <ArrowLeft className="w-5 h-5" /> Back
                            </button>
                            <button onClick={handleNext} className="flex-[2] btn-primary py-4 text-lg">
                                Next Step
                            </button>
                        </div>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div
                        key="step4"
                        variants={pageVariants}
                        initial="initial" animate="in" exit="out" transition={{ duration: 0.5, ease: "easeOut" }}
                        className="space-y-8"
                    >
                         <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 font-display">Lifestyle & Rhythm</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { id: 'sedentary', label: 'Sedentary', desc: 'Mainly desk work, low activity' },
                                { id: 'light', label: 'Lightly Active', desc: '1-3 days of light training' },
                                { id: 'moderate', label: 'Moderate', desc: '3-5 days of consistent work' },
                                { id: 'active', label: 'Elite / Highly Active', desc: 'Daily intensive training' }
                            ].map(level => (
                                <div key={level.id} onClick={() => setFormData({...formData, activityLevel: level.id})}
                                    className={`cursor-pointer p-6 border-2 rounded-[24px] flex flex-col gap-1 transition-all duration-200 ${formData.activityLevel === level.id ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-50 hover:bg-gray-50'}`}>
                                   <div className="flex justify-between items-center">
                                       <p className="font-bold text-xl text-gray-900 font-display">{level.label}</p>
                                       {formData.activityLevel === level.id && <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
                                   </div>
                                   <p className="text-sm text-gray-500 font-medium">{level.desc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleBack} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                <ArrowLeft className="w-5 h-5" /> Back
                            </button>
                            <button onClick={handleSubmit} disabled={loading} className="flex-[2] btn-primary py-4 text-lg">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Complete Setup"}
                            </button>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 px-6 sm:px-6 lg:px-8 relative overflow-hidden bg-white">
            
            {/* Global Background Blobs */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-green-200/20 rounded-full blur-[100px] animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="text-center mb-12">
                    <motion.div initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} className="w-16 h-16 bg-primary rounded-[20px] shadow-2xl shadow-green-500/30 flex items-center justify-center mx-auto mb-8">
                        <Dumbbell className="w-8 h-8 text-white" />
                    </motion.div>
                    <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight font-display">
                        Design Your Lifestyle
                    </h2>
                    <p className="mt-4 text-lg text-gray-500 font-medium max-w-sm mx-auto">
                        Personalizing your FitTrack experience in just {4 - step + 1} more steps.
                    </p>
                    
                    {/* Progress Indicator */}
                    <div className="flex gap-2 justify-center mt-10">
                        {[1,2,3,4].map(s => (
                            <div key={s} className={`h-2.5 rounded-full transition-all duration-500 ${s <= step ? (s === step ? 'w-12 bg-primary' : 'w-6 bg-green-200') : 'w-3 bg-gray-100'}`} />
                        ))}
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-2xl py-12 px-8 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-white/50 sm:rounded-[48px] sm:px-14 relative overflow-hidden">
                    {/* Decorative flare */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/5 blur-[50px] -mr-16 -mt-16 rounded-full"></div>

                    {error && (
                        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="bg-red-50 border-2 border-red-100 p-5 mb-8 rounded-[24px] text-sm text-red-700 font-semibold flex items-center gap-3">
                            <Shield className="w-5 h-5 text-red-500" />
                            {error}
                        </motion.div>
                    )}
                    
                    <AnimatePresence mode="wait">
                        {renderStepContent()}
                    </AnimatePresence>
                </div>

                <p className="mt-12 text-center text-sm text-gray-400 font-bold uppercase tracking-widest">
                    Level Up Your Potential • SaaS Elite
                </p>
            </div>
        </div>
    );
};

export default Onboarding;
