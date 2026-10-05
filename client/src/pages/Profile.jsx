import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { calculateBMI, getBMIStatus } from '../utils/biometrics';
import { 
    getGoalLabel, 
    getDietTypeLabel, 
    getActivityLevelLabel, 
    getWorkoutLocationLabel,
    formatDate
} from '../utils/labels';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, 
    Mail, 
    Weight, 
    Ruler, 
    Target, 
    Activity, 
    MapPin, 
    Beef, 
    Edit2, 
    Save, 
    X, 
    CheckCircle2, 
    AlertCircle,
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
        goal: user?.goal === 'lose_weight' ? 'fat_loss' : (user?.goal || 'maintain'),
        dietType: user?.dietType === 'Veg' ? 'vegetarian' : (user?.dietType === 'Non-veg' ? 'non-vegetarian' : (user?.dietType || 'any')),
        sex: user?.sex || 'unspecified',
        activityLevel: user?.activityLevel || 'moderate',
        workoutLocation: user?.workoutLocation ? user.workoutLocation.toLowerCase() : 'gym'
    });

    const [bmi, setBmi] = useState('—');
    const [bmiStatus, setBmiStatus] = useState(getBMIStatus(0));

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await userAPI.getProfile();
                if (res.data) {
                    updateUser(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch user profile", err);
            }
        };
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                age: user.age || '',
                weight: user.weight || '',
                height: user.height || '',
                sex: user.sex || 'unspecified',
                goal: user.goal === 'lose_weight' ? 'fat_loss' : (user.goal || 'maintain'),
                dietType: user.dietType === 'Veg' ? 'vegetarian' : (user.dietType === 'Non-veg' ? 'non-vegetarian' : (user.dietType || 'any')),
                activityLevel: user.activityLevel || 'moderate',
                workoutLocation: user.workoutLocation ? user.workoutLocation.toLowerCase() : 'gym'
            });
        }
    }, [user]);

    useEffect(() => {
        if (formData.weight && formData.height) {
            const calculatedBmi = calculateBMI(formData.weight, formData.height);
            setBmi(calculatedBmi);
            setBmiStatus(getBMIStatus(calculatedBmi));
        } else {
            setBmi('—');
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

    const cardClasses = "bg-white border border-slate-200 rounded-2xl p-6 shadow-sm";
    const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-all font-semibold";
    const labelClasses = "block text-sm font-semibold text-slate-700 mb-1.5";

    const joinedDateFormatted = formatDate(user?.createdAt);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-16">
            {/* Profile Header */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
                <div className="absolute top-6 right-6 z-20">
                     <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-2.5 rounded-xl transition-all ${
                            isEditing 
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        title={isEditing ? 'Cancel edit' : 'Edit profile'}
                    >
                        {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                    </button>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-green-600 flex items-center justify-center text-white text-3xl font-bold shadow-sm border-2 border-white">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <div className="text-center md:text-left">
                        <h1 className="text-2xl font-bold text-slate-900">
                            {user?.name}
                        </h1>
                        <p className="text-slate-600 font-medium flex items-center justify-center md:justify-start gap-2 mt-1 text-sm">
                            <Mail className="w-4 h-4 text-green-600" />
                            {user?.email}
                        </p>
                        <p className="text-slate-500 text-xs font-medium mt-2">Joined {joinedDateFormatted}</p>
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
                        className="bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-xl flex items-center gap-3 shadow-sm"
                    >
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                        <p className="text-sm font-semibold">{success}</p>
                    </motion.div>
                )}
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl flex items-center gap-3 shadow-sm"
                    >
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                        <p className="text-sm font-semibold">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info Card */}
                <div className={cardClasses}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                            <User className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Personal Info</h3>
                    </div>
                    
                    <div className="space-y-4">
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
                                <p className="text-slate-900 font-semibold text-base">{user?.name}</p>
                            )}
                        </div>
                        
                        <div>
                            <label className={labelClasses}>Email Address</label>
                            <div className="text-slate-700 font-medium bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-sm">
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
                                <p className="text-slate-900 font-semibold text-base">{user?.age || '—'} <span className="text-slate-500 text-sm font-normal">years old</span></p>
                            )}
                        </div>

                        <div>
                            <label className={labelClasses}>Sex (Optional)</label>
                            {isEditing ? (
                                <div>
                                    <select 
                                        name="sex"
                                        value={formData.sex}
                                        onChange={handleChange}
                                        className={inputClasses}
                                    >
                                        <option value="unspecified">Prefer not to say</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                    <p className="text-xs text-slate-500 font-medium mt-1">Used only to calculate your calorie target.</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-slate-900 font-semibold text-base">
                                        {user?.sex === 'male' ? 'Male' : (user?.sex === 'female' ? 'Female' : 'Prefer not to say')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body Metrics Card */}
                <div className={cardClasses}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Body Metrics</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-5">
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
                                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <Weight className="w-4 h-4 text-green-600" />
                                    <span className="font-bold text-slate-900">{user?.weight || '—'} kg</span>
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
                                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <Ruler className="w-4 h-4 text-green-600" />
                                    <span className="font-bold text-slate-900">{user?.height || '—'} cm</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Body Mass Index</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-slate-900">{bmi}</span>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${bmiStatus.color}`}>
                                        {user?.weight && user?.height ? bmiStatus.label : 'Unspecified'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fitness Preferences Card */}
                <div className={cardClasses}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                            <Target className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Fitness Preferences</h3>
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
                                    <option value="fat_loss">Fat loss</option>
                                    <option value="muscle_gain">Muscle gain</option>
                                    <option value="body_recomposition">Body recomposition</option>
                                    <option value="maintain">Maintain weight</option>
                                    <option value="strength">Strength</option>
                                    <option value="endurance">Endurance</option>
                                    <option value="general_fitness">General fitness</option>
                                    <option value="flexibility">Flexibility</option>
                                </select>
                            ) : (
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
                                    {getGoalLabel(user?.goal)}
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
                                        <option value="light">Lightly active</option>
                                        <option value="moderate">Moderately active</option>
                                        <option value="active">Active</option>
                                        <option value="very_active">Very active</option>
                                    </select>
                                ) : (
                                    <p className="font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        {getActivityLevelLabel(user?.activityLevel)}
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
                                        <option value="home">Home</option>
                                        <option value="gym">Gym</option>
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-900">
                                        <MapPin className="w-4 h-4 text-green-600" />
                                        {getWorkoutLocationLabel(user?.workoutLocation)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Diet Preferences Card */}
                <div className={cardClasses}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                            <Beef className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Diet Preferences</h3>
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
                                    <option value="vegetarian">Vegetarian</option>
                                    <option value="non-vegetarian">Non-vegetarian</option>
                                    <option value="vegan">Vegan</option>
                                    <option value="pescatarian">Pescatarian</option>
                                    <option value="any">No preference</option>
                                </select>
                            ) : (
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-900">
                                    {getDietTypeLabel(user?.dietType)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Account Button */}
            <div className="pt-6 flex justify-center">
                <button 
                    onClick={() => setConfirmDelete(true)}
                    className="px-6 py-2.5 rounded-xl font-semibold bg-white text-red-600 border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm flex items-center gap-2 text-sm"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete account
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {confirmDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full text-center space-y-4 border border-slate-200"
                        >
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-900">Are you sure?</h3>
                                <p className="text-slate-600 text-sm">
                                    All your profile and log data will be permanently wiped.
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => setConfirmDelete(false)}
                                    className="flex-1 py-2.5 rounded-xl font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDeleteAccount}
                                    disabled={deleting}
                                    className="flex-1 py-2.5 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Save Button */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[60]"
                    >
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3">
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="flex-1 py-2.5 px-4 rounded-xl font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <Button 
                                onClick={handleSave}
                                loading={loading}
                                className="flex-[2] py-2.5 px-4 rounded-xl font-semibold !bg-green-600 hover:!bg-green-700 text-white shadow-sm flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save profile</span>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
