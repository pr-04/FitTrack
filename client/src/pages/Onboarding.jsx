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
        sex: user?.sex || 'unspecified',
        goal: user?.goal === 'lose_weight' ? 'fat_loss' : (user?.goal || 'maintain'),
        dietType: user?.dietType === 'Veg' ? 'vegetarian' : (user?.dietType === 'Non-veg' ? 'non-vegetarian' : (user?.dietType || 'any')),
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
                            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-slate-200 shadow-sm">
                                <Ruler className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 font-display">The Basics</h3>
                        </div>
                        <p className="text-slate-500 -mt-6 font-medium">We need these to calculate your BMI and daily requirements.</p>
                        
                        <div className="grid grid-cols-1 gap-6">
                            <div className="relative">
                                <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Your Age</label>
                                <input type="number" required placeholder="Years" min="12" max="100"
                                    className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none text-lg font-medium text-slate-900 transition-colors"
                                    value={formData.age} onChange={(e) => setFormData({...formData, age: Number(e.target.value)})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Weight (kg)</label>
                                    <input type="number" required placeholder="70" min="30" max="250"
                                        className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none text-lg font-medium text-slate-900 transition-colors"
                                        value={formData.weight} onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Height (cm)</label>
                                    <input type="number" required placeholder="175" min="100" max="250"
                                        className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none text-lg font-medium text-slate-900 transition-colors"
                                        value={formData.height} onChange={(e) => setFormData({...formData, height: Number(e.target.value)})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Sex (Optional)</label>
                                <select
                                    className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none text-lg font-medium text-slate-900 transition-colors"
                                    value={formData.sex} onChange={(e) => setFormData({...formData, sex: e.target.value})}
                                >
                                    <option value="unspecified">Prefer not to say</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-1 ml-1 font-medium">Used only to calculate your calorie target.</p>
                            </div>
                        </div>
                        <button onClick={handleNext} disabled={!isStep1Valid}
                            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50">
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
                            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-slate-200 shadow-sm">
                                <Target className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 font-display">Define Your Goal</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { id: 'fat_loss', label: 'Fat Loss', desc: 'Burn fat & get lean' },
                                { id: 'muscle_gain', label: 'Muscle Gain', desc: 'Build size & power' },
                                { id: 'body_recomposition', label: 'Recomposition', desc: 'Fat loss & muscle gain' },
                                { id: 'maintain', label: 'Maintain', desc: 'Keep current status' },
                                { id: 'strength', label: 'Strength', desc: 'Focus on heavy lifts' },
                                { id: 'endurance', label: 'Endurance', desc: 'Stamina & cardio' },
                                { id: 'general_fitness', label: 'General Fitness', desc: 'Stay healthy & active' },
                                { id: 'flexibility', label: 'Flexibility', desc: 'Mobility & yoga' }
                            ].map(goal => (
                                <div key={goal.id} onClick={() => setFormData({...formData, goal: goal.id})}
                                    className={`cursor-pointer p-4 rounded-2xl flex items-center justify-between transition-all ${formData.goal === goal.id ? 'bg-green-50 border-2 border-green-600' : 'bg-white border border-slate-200 hover:border-slate-300'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-8 rounded-full transition-all ${formData.goal === goal.id ? 'bg-green-600' : 'bg-slate-200'}`}></div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-900 font-display leading-tight">{goal.label}</p>
                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{goal.desc}</p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.goal === goal.id ? 'border-green-600 bg-green-600' : 'border-slate-300'}`}>
                                        {formData.goal === goal.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleBack} className="flex-1 py-4 border border-slate-200 rounded-2xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
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
                            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-slate-200 shadow-sm">
                                <Utensils className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 font-display">Dietary Preference</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'any', label: 'No Preference', desc: 'Standard balanced diet' },
                                { id: 'vegetarian', label: 'Vegetarian', desc: 'Plant-based with dairy' },
                                { id: 'vegan', label: 'Vegan', desc: 'Strictly plant-based' },
                                { id: 'pescatarian', label: 'Pescatarian', desc: 'Vegetarian plus seafood' },
                                { id: 'non-vegetarian', label: 'Non-vegetarian', desc: 'Includes poultry, meats & fish' }
                            ].map(diet => (
                                <div key={diet.id} onClick={() => setFormData({...formData, dietType: diet.id})}
                                    className={`cursor-pointer p-5 rounded-2xl flex items-center justify-between transition-all ${formData.dietType === diet.id ? 'bg-green-50 border-2 border-green-600' : 'bg-white border border-slate-200 hover:border-slate-300'}`}>
                                    <div>
                                        <p className="font-bold text-lg text-slate-900 font-display">{diet.label}</p>
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{diet.desc}</p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${formData.dietType === diet.id ? 'border-green-600 bg-green-600' : 'border-slate-300'}`}>
                                        {formData.dietType === diet.id && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleBack} className="flex-1 py-4 border border-slate-200 rounded-2xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
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
                            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-slate-200 shadow-sm">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 font-display">Lifestyle & Rhythm</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { id: 'sedentary', label: 'Sedentary', desc: 'Mainly desk work, low activity' },
                                { id: 'light', label: 'Light', desc: '1-3 days of light training' },
                                { id: 'moderate', label: 'Moderate', desc: '3-5 days of consistent work' },
                                { id: 'active', label: 'Active', desc: '6-7 days of active work' },
                                { id: 'very_active', label: 'Very active', desc: 'Daily intensive training or physical labor' }
                            ].map(level => (
                                <div key={level.id} onClick={() => setFormData({...formData, activityLevel: level.id})}
                                    className={`cursor-pointer p-6 rounded-2xl flex flex-col gap-1 transition-all ${formData.activityLevel === level.id ? 'bg-green-50 border-2 border-green-600' : 'bg-white border border-slate-200 hover:border-slate-300'}`}>
                                   <div className="flex justify-between items-center">
                                       <p className="font-bold text-xl text-slate-900 font-display">{level.label}</p>
                                       {formData.activityLevel === level.id && <div className="w-3 h-3 bg-green-600 rounded-full" />}
                                   </div>
                                   <p className="text-sm text-slate-500 font-medium">{level.desc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleBack} className="flex-1 py-4 border border-slate-200 rounded-2xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
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
        <div className="min-h-screen flex flex-col justify-center py-12 px-6 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
            <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="text-center mb-12">
                    <motion.div initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} className="w-16 h-16 bg-green-600 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-8">
                        <Dumbbell className="w-8 h-8 text-white" />
                    </motion.div>
                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight font-display">
                        Design Your Lifestyle
                    </h2>
                    <p className="mt-4 text-lg text-slate-500 font-medium max-w-sm mx-auto">
                        Personalizing your FitTrack experience in just {4 - step + 1} more steps.
                    </p>
                    
                    {/* Progress Indicator */}
                    <div className="flex gap-2 justify-center mt-10">
                        {[1,2,3,4].map(s => (
                            <div key={s} className={`h-2.5 rounded-full transition-all duration-300 ${s <= step ? (s === step ? 'w-10 bg-green-600' : 'w-5 bg-green-200') : 'w-2.5 bg-slate-200'}`} />
                        ))}
                    </div>
                </div>

                <div className="bg-white py-12 px-8 shadow-sm border border-slate-200 sm:rounded-3xl sm:px-14 relative overflow-hidden">
                    {error && (
                        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="bg-red-50 border border-red-200 p-4 mb-8 rounded-xl text-sm text-red-700 font-semibold flex items-center gap-3">
                            <Shield className="w-5 h-5 text-red-600 shrink-0" />
                            {error}
                        </motion.div>
                    )}
                    
                    <AnimatePresence mode="wait">
                        {renderStepContent()}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
