import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { calculateBMI, getBMIStatus } from '../utils/biometrics';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, 
    Mail, 
    Calendar, 
    Weight, 
    Ruler, 
    Target, 
    Zap, 
    MapPin, 
    Beef, 
    Camera, 
    Edit2, 
    Save, 
    X, 
    CheckCircle2, 
    AlertCircle,
    ChevronRight,
    Loader2,
    Trash2
} from 'lucide-react';
import Button from '../components/ui/Button';

const Profile = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        age: user?.age || '',
        weight: user?.weight || '',
        height: user?.height || '',
        goal: user?.goal || 'maintain',
        dietType: user?.dietType || 'any',
        activityLevel: user?.activityLevel || 'moderate',
        workoutLocation: user?.workoutLocation || 'Gym'
    });

    const [bmi, setBmi] = useState('0.0');
    const [bmiStatus, setBmiStatus] = useState(getBMIStatus(0));

    useEffect(() => {
        if (formData.weight && formData.height) {
            const calculatedBmi = calculateBMI(formData.weight, formData.height);
            setBmi(calculatedBmi);
            setBmiStatus(getBMIStatus(calculatedBmi));
        }
    }, [formData.weight, formData.height]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            const res = await userAPI.updateProfile(formData);
            updateUser(res.data);
            
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
            
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }

        try {
            setDeleting(true);
            setError(null);
            await userAPI.deleteProfile();
            logout();
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete account');
            setConfirmDelete(false);
        } finally {
            setDeleting(false);
        }
    };

    const cardClasses = "bg-white border border-[#E5E7EB] rounded-[16px] p-6 shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)]";
    const inputClasses = "w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E] outline-none transition-all duration-200";
    const labelClasses = "block text-sm font-semibold text-[#6B7280] mb-2 ml-1";

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1, 
            transition: { duration: 0.5, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-5xl mx-auto space-y-8 pb-12"
        >
            {/* Subtle glow behind the page */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[#22C55E]/5 blur-[120px] -z-10 rounded-full" />

            {/* Profile Header */}
            <section className="bg-white border border-[#E5E7EB] rounded-[20px] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
                <div className="absolute top-6 right-6 z-20">
                     <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-2.5 rounded-full transition-all duration-300 ${
                            isEditing 
                            ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                            : 'bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20'
                        }`}
                    >
                        {isEditing ? <X className="w-5 h-5 pointer-events-none" /> : <Edit2 className="w-5 h-5 pointer-events-none" />}
                    </button>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-[#22C55E]/20 blur-xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity" />
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#22C55E] to-[#16a34a] flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-[#22C55E]/20 border-4 border-white relative z-10">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <button className="absolute bottom-1 right-1 p-2 bg-slate-900 text-white rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
                            {user?.name}
                        </h1>
                        <p className="text-[#6B7280] font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                            <Mail className="w-4 h-4 text-[#22C55E]" />
                            {user?.email}
                        </p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                            <span className="px-3 py-1 bg-[#22C55E]/10 text-[#15803d] text-xs font-bold rounded-full border border-[#22C55E]/20 uppercase tracking-wider">
                                {user?.isOnboarded ? 'Profile Verified' : 'Incomplete'}
                            </span>
                            <span className="text-gray-300 text-sm">•</span>
                            <span className="text-[#6B7280] text-sm font-medium">Joined {new Date(user?.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Status Messages */}
            <AnimatePresence>
                {success && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#15803d] px-6 py-4 rounded-2xl flex items-center gap-3 shadow-sm shadow-[#22C55E]/5"
                    >
                        <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0" />
                        <p className="text-sm font-bold">{success}</p>
                    </motion.div>
                )}
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-red-50 border border-red-100 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-sm font-bold">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Info Card */}
                <motion.div variants={itemVariants} className={cardClasses}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gray-50 text-[#6B7280] rounded-xl border border-gray-100">
                            <User className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-[#111827]">Personal Info</h3>
                    </div>
                    
                    <div className="space-y-5">
                        <div>
                            <label className={labelClasses}>Full Name</label>
                            {isEditing ? (
                                <input 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={inputClasses}
                                    placeholder="Enter your name"
                                />
                            ) : (
                                <p className="text-[#111827] font-semibold text-lg pl-1">{user?.name}</p>
                            )}
                        </div>
                        
                        <div>
                            <label className={labelClasses}>Email Address</label>
                            <div className="flex items-center gap-2 text-[#6B7280] pl-1 font-medium bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                                <Mail className="w-4 h-4" />
                                {user?.email}
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Age</label>
                            {isEditing ? (
                                <input 
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className={inputClasses}
                                />
                            ) : (
                                <p className="text-[#111827] font-semibold text-lg pl-1">{user?.age} <span className="text-[#6B7280] text-sm font-medium ml-1">years old</span></p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Body Metrics Card */}
                <motion.div variants={itemVariants} className={cardClasses}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gray-50 text-[#6B7280] rounded-xl border border-gray-100">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-[#111827]">Body Metrics</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className={labelClasses}>Weight (kg)</label>
                            {isEditing ? (
                                <input 
                                    type="number"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    className={inputClasses}
                                />
                            ) : (
                                <div className="flex items-center gap-2 pl-1 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                                    <Weight className="w-4 h-4 text-[#22C55E]" />
                                    <span className="font-bold text-[#111827]">{user?.weight} kg</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className={labelClasses}>Height (cm)</label>
                            {isEditing ? (
                                <input 
                                    type="number"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                    className={inputClasses}
                                />
                            ) : (
                                <div className="flex items-center gap-2 pl-1 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                                    <Ruler className="w-4 h-4 text-[#22C55E]" />
                                    <span className="font-bold text-[#111827]">{user?.height} cm</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-6 border-t border-gray-100 bg-[#F9FAFB]/50 -mx-6 px-6 pb-2 rounded-b-[16px]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-[0.1em] mb-1">Body Mass Index</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-[#111827]">{bmi}</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${bmiStatus.color.replace('text-white', '')} border border-current bg-white shadow-sm`}>
                                        {bmiStatus.label}
                                    </span>
                                </div>
                            </div>
                            <div className="w-14 h-14 rounded-full border-4 border-white shadow-md flex items-center justify-center relative overflow-hidden bg-white">
                                <div 
                                    className={`absolute bottom-0 left-0 right-0 ${bmiStatus.color.split(' ')[0]} opacity-10`}
                                    style={{ height: `${Math.min(parseFloat(bmi) * 2, 100)}%` }}
                                />
                                <Target className={`w-7 h-7 ${bmiStatus.textColor}`} />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Fitness Preferences Card */}
                <motion.div variants={itemVariants} className={cardClasses}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gray-50 text-[#6B7280] rounded-xl border border-gray-100">
                            <Target className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-[#111827]">Fitness Preferences</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className={labelClasses}>Primary Goal</label>
                            {isEditing ? (
                                <select 
                                    name="goal"
                                    value={formData.goal}
                                    onChange={handleChange}
                                    className={inputClasses}
                                >
                                    <option value="fat_loss">Fat Loss</option>
                                    <option value="muscle_gain">Muscle Gain</option>
                                    <option value="body_recomposition">Body Recomposition</option>
                                    <option value="maintain">Maintain</option>
                                    <option value="strength">Strength</option>
                                    <option value="endurance">Endurance</option>
                                    <option value="general_fitness">General Fitness</option>
                                    <option value="flexibility">Flexibility</option>
                                </select>
                            ) : (
                                <div className="flex items-center gap-3 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                                    <p className="font-bold text-[#111827] capitalize">{user?.goal?.replace('_', ' ')}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Activity Level</label>
                                {isEditing ? (
                                    <select 
                                        name="activityLevel"
                                        value={formData.activityLevel}
                                        onChange={handleChange}
                                        className={inputClasses}
                                    >
                                        <option value="sedentary">Sedentary</option>
                                        <option value="light">Light</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="active">Active</option>
                                    </select>
                                ) : (
                                    <p className="font-bold text-[#111827] capitalize pl-1 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                                        {user?.activityLevel}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className={labelClasses}>Workout Location</label>
                                {isEditing ? (
                                    <select 
                                        name="workoutLocation"
                                        value={formData.workoutLocation}
                                        onChange={handleChange}
                                        className={inputClasses}
                                    >
                                        <option value="Home">Home</option>
                                        <option value="Gym">Gym</option>
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2 pl-1 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB] font-bold text-[#111827]">
                                        <MapPin className="w-4 h-4 text-[#22C55E]" />
                                        {user?.workoutLocation || 'Gym'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Diet Preferences Card */}
                <motion.div variants={itemVariants} className={cardClasses}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gray-50 text-[#6B7280] rounded-xl border border-gray-100">
                            <Beef className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-[#111827]">Diet Preferences</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className={labelClasses}>Dietary Type</label>
                            {isEditing ? (
                                <select 
                                    name="dietType"
                                    value={formData.dietType}
                                    onChange={handleChange}
                                    className={inputClasses}
                                >
                                    <option value="Veg">Vegetarian</option>
                                    <option value="Non-veg">Non-Vegetarian</option>
                                    <option value="vegan">Vegan</option>
                                    <option value="any">Flexible</option>
                                </select>
                            ) : (
                                <div className="flex items-center justify-between bg-[#22C55E]/5 p-4 rounded-xl border border-[#22C55E]/10">
                                    <span className="font-bold text-[#15803d] capitalize">{user?.dietType}</span>
                                    <ChevronRight className="w-4 h-4 text-[#22C55E]" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs text-[#6B7280] font-medium leading-relaxed">
                            Our AI uses these preferences to tailor your weekly meal plans for optimal results mapping to your {user?.goal?.replace('_', ' ')} goal.
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Delete Account Button */}
            <motion.div variants={itemVariants} className="pt-12 pb-6 flex justify-center">
                <button 
                    onClick={() => setConfirmDelete(true)}
                    className="group px-8 py-3 rounded-xl font-bold bg-white text-red-500 border border-red-100 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                >
                    <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                    Delete Account
                </button>
            </motion.div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {confirmDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmDelete(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center space-y-6"
                        >
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-900">Are you sure?</h3>
                                <p className="text-slate-500 font-medium">
                                    If once deleted, it can't be undone. All your data will be permanently wiped.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setConfirmDelete(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all font-sans"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDeleteAccount}
                                    disabled={deleting}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-200 font-sans flex items-center justify-center gap-2"
                                >
                                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Save Buttons */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-xl z-[60]"
                    >
                        <div className="bg-white/80 backdrop-blur-2xl border border-white p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-between gap-4">
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="flex-1 py-3.5 px-6 rounded-2xl font-bold bg-gray-100 text-[#6B7280] hover:bg-gray-200 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <Button 
                                onClick={handleSave}
                                loading={loading}
                                className="flex-[2] py-3.5 px-6 rounded-2xl font-bold !bg-[#22C55E] !hover:bg-[#16a34a] shadow-lg shadow-[#22C55E]/20 flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Save className="w-5 h-5 text-white" />
                                <span className="text-white">Save Profile</span>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Profile;
