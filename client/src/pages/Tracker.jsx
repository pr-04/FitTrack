import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trackerAPI, userAPI } from '../services/api';
import { Loader2, TrendingUp, Activity, CheckCircle2, Plus, Target, Ruler } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { calculateBMI, getBMIStatus } from '../utils/biometrics';
import { formatDate } from '../utils/labels';
import { toast } from 'react-hot-toast';

const Tracker = () => {
    const { user, updateUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [newWeight, setNewWeight] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await trackerAPI.getStats();
            setStats(res.data);
        } catch (error) {
            console.error("Failed to fetch tracking stats", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddWeight = async (e) => {
        e.preventDefault();
        try {
            const res = await userAPI.updateProfile({ weight: Number(newWeight) });
            updateUser(res.data);
            setShowWeightModal(false);
            setNewWeight('');
            toast.success('Weight updated successfully!');
            fetchStats(); 
        } catch (error) {
            console.error("Failed to update weight", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[500px] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            </div>
        );
    }

    const hasBiometrics = user?.weight && user?.height;
    const bmiValue = hasBiometrics ? calculateBMI(user.weight, user.height) : '—';
    const bmiStatus = hasBiometrics ? getBMIStatus(bmiValue) : { label: 'Unspecified', color: 'bg-slate-100 text-slate-600', textColor: 'text-slate-600' };

    // Calorie history for chart
    const calorieChartData = stats?.calorieHistory?.length > 0
        ? stats.calorieHistory.map(item => ({
            ...item,
            date: formatDate(item.date)
        }))
        : (stats?.recentLogs?.filter(l => l.type === 'diet') || []).map(log => ({
            date: formatDate(log.date),
            calories: log.calories || 0
        })).reverse();

    const foodLogs = stats?.recentFoods || stats?.recentLogs?.filter(l => l.type === 'diet') || [];
    const workoutLogs = stats?.recentWorkouts || stats?.workoutHistory || stats?.recentLogs?.filter(l => l.type === 'workout') || [];

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 pb-16">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tracker</h1>
                    <p className="text-slate-600 mt-1 font-medium">Track your weight, workouts, and food logs.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={() => setShowWeightModal(true)} className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-all shadow-sm flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Weight update
                    </button>
                </div>
            </header>

            {/* Overviews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-slate-500 font-semibold uppercase tracking-wider text-xs">Body Mass Index</p>
                            <h2 className="text-4xl font-bold mt-1 text-slate-900">{bmiValue}</h2>
                        </div>
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span>{user?.weight ? `Validated for ${user.weight} kg profile` : 'Add weight and height in profile'}</span>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md inline-block ${bmiStatus.color}`}>
                            {bmiStatus.label}
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-slate-500 font-semibold uppercase tracking-wider text-xs">Workouts Completed</p>
                            <h2 className="text-4xl font-bold mt-1 text-slate-900">{stats?.totalWorkouts || 0}</h2>
                        </div>
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-slate-600 text-sm font-medium">Sessions logged in your current tracking history</p>
                </div>
            </div>

            {/* Calorie History & Food Log */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Calorie Analytics */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Calorie history</h2>
                    </div>
                    <div className="h-80 w-full min-w-0">
                        {calorieChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <AreaChart data={calorieChartData}>
                                    <defs>
                                        <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={8} />
                                    <YAxis tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dx={-8} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', padding: '12px 16px' }}
                                        cursor={{ stroke: '#16a34a', strokeWidth: 1.5 }}
                                    />
                                    <Area type="monotone" dataKey="calories" stroke="#16a34a" fillOpacity={1} fill="url(#colorCal)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 border border-dashed border-slate-200 rounded-2xl p-8">
                                <Activity className="w-8 h-8 text-slate-400" />
                                <p className="font-semibold text-slate-600">No data yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Food Log */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900">Food log</h2>
                    </div>
                    
                    <ul className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto flex-1">
                        {foodLogs.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center gap-3 text-slate-400">
                                <Plus className="w-10 h-10 text-slate-300" />
                                <p className="font-semibold text-slate-500">No food entries logged.</p>
                            </div>
                        ) : (
                            foodLogs.map((log) => (
                                <li key={log._id} className="p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-semibold text-slate-900 truncate">
                                            {log.name || log.foodItem}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                                            <span>{log.calories} kcal</span>
                                            <span>•</span>
                                            <span>{formatDate(log.date)}</span>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            {/* Workout History */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Workout history</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workoutLogs.length === 0 ? (
                        <div className="col-span-full bg-white rounded-2xl p-10 text-center flex flex-col items-center gap-4 border border-slate-200 shadow-sm">
                            <Activity className="w-10 h-10 text-slate-400" />
                            <p className="text-slate-600 font-semibold text-lg">No workouts logged yet.</p>
                            <Link to="/app/workout" className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-sm">
                                Log your first workout
                            </Link>
                        </div>
                    ) : (
                        workoutLogs.map((log) => {
                            const weightVal = log.weight !== undefined ? log.weight : log.liftWeight;
                            return (
                                <div key={log._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-medium text-slate-500">{formatDate(log.date)}</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 mb-2">{log.exercise}</h4>
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                                        <span className="bg-slate-100 px-2.5 py-1 rounded-md">{log.sets} sets</span>
                                        <span className="bg-slate-100 px-2.5 py-1 rounded-md">{log.reps} reps</span>
                                        {weightVal > 0 && <span className="bg-slate-100 px-2.5 py-1 rounded-md">{weightVal} kg</span>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal - Update Weight */}
            {showWeightModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Update Weight</h3>
                        </div>
                        <form onSubmit={handleAddWeight} className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Body weight (kg)</label>
                                <input 
                                    required 
                                    type="number" 
                                    min="30" 
                                    max="250" 
                                    step="0.1"
                                    value={newWeight} 
                                    onChange={e => setNewWeight(e.target.value)} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-all" 
                                    placeholder="70.0" 
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowWeightModal(false)} className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="flex-[2] py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all shadow-sm">Save weight</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

        </div>
    );
};

export default Tracker;
