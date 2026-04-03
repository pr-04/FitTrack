import { useState, useEffect } from 'react';
import { trackerAPI, userAPI } from '../services/api';
import { Loader2, TrendingUp, Activity, CheckCircle2, Plus, Target, Ruler, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { calculateBMI, getBMIStatus } from '../utils/biometrics';
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

    const handleLogSuccess = (type) => {
        toast.success(`${type} logged successfully!`);
        fetchStats();
    };

    if (loading) {
        return (
            <div className="min-h-[500px] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    const bmiValue = calculateBMI(user?.weight, user?.height);
    const bmiStatus = getBMIStatus(bmiValue);

    
    // Process calories over time
    const dietLogs = stats?.recentLogs?.filter(l => l.type === 'diet') || [];
    const calorieDataMap = {};
    dietLogs.forEach(log => {
        const d = new Date(log.date).toLocaleDateString();
        calorieDataMap[d] = (calorieDataMap[d] || 0) + log.calories;
    });
    const calorieChartData = Object.keys(calorieDataMap).map(date => ({
        date,
        calories: calorieDataMap[date]
    })).reverse();

    return (
        <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 font-display">Performance Analytics</h1>
                    <p className="text-gray-500 mt-2 text-lg font-medium">Deep dive into your biometric evolution and activity DNA.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={() => setShowWeightModal(true)} className="btn-primary flex items-center gap-3 py-4 px-8 text-lg">
                        <Plus className="w-6 h-6" /> Log Weight
                    </button>
                </div>
            </header>

            {/* Performance Level 0 → Overviews */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-10 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Ruler className="w-24 h-24" />
                    </div>
                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div>
                            <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs">Body Mass Index</p>
                            <h2 className="text-6xl font-black mt-2 font-display">{bmiValue}</h2>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <Activity className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div className="space-y-4 relative z-10">
                        <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
                             <div className="bg-white h-full rounded-full" style={{ width: `${Math.min((parseFloat(bmiValue)/40)*100, 100)}%` }}></div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-indigo-100 text-sm font-bold flex items-center gap-2 italic">
                                <CheckCircle2 className="w-4 h-4" /> Validated for {user?.weight}kg profile
                            </p>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 w-fit px-2 py-0.5 rounded">
                                Status: {bmiStatus.label}
                            </span>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-elevated p-10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Target className="w-24 h-24" />
                    </div>
                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div>
                            <p className="text-emerald-50 font-bold uppercase tracking-widest text-xs">Training Impact</p>
                            <h2 className="text-6xl font-black mt-2 font-display">{stats?.totalWorkouts || 0}</h2>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <p className="text-emerald-50 text-sm font-bold mt-4 uppercase tracking-tighter">Sessions logged in your current cycle</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-elevated p-10 bg-white border border-gray-100 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="w-24 h-24 text-gray-900" />
                    </div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-10 relative z-10">Account Status</h3>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#22C55E]"></div>
                            <span className="text-2xl font-black text-gray-900 font-display">Premium Active</span>
                        </div>
                        <p className="text-gray-500 font-medium leading-relaxed">Full access to Gemini AI architecture and deep body analysis enabled.</p>
                    </div>
                </motion.div>
            </div>

            {/* Performance Level 1 → History & Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* Calorie Analytics */}
                <div className="card-elevated p-10 bg-white shadow-[0_45px_90px_-20px_rgba(0,0,0,0.06)] transform transition-all duration-500 hover:scale-[1.01]">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-2xl font-extrabold text-gray-900 font-display italic">Fuel Velocity</h3>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg">Kcal Variance</span>
                    </div>
                    <div className="h-80 w-full">
                        {calorieChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={calorieChartData}>
                                    <defs>
                                        <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 700}} dy={10} />
                                    <YAxis tickLine={false} axisLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 700}} dx={-10} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', padding: '20px' }}
                                        cursor={{ stroke: '#22C55E', strokeWidth: 2 }}
                                    />
                                    <Area type="monotone" dataKey="calories" stroke="#22C55E" fillOpacity={1} fill="url(#colorCal)" strokeWidth={4} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 border-2 border-dashed border-gray-100 rounded-[32px]">
                                <Activity className="w-10 h-10 opacity-20" />
                                <p className="font-bold">Awaiting historical data...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nutrition Records */}
                <div className="card-container overflow-hidden bg-white shadow-[0_45px_90px_-20px_rgba(0,0,0,0.06)] border-l-4 border-emerald-500">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-emerald-50/20">
                        <h2 className="text-2xl font-extrabold text-gray-900 font-display italic">Nutrition Records</h2>
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-100/50 px-3 py-1 rounded-full">Fuel Logs</span>
                    </div>
                    
                    <ul className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {stats?.recentLogs?.filter(l => l.type === 'diet' || l.type === 'weight').length === 0 ? (
                            <div className="p-20 text-center flex flex-col items-center gap-4 text-gray-300">
                                <Plus className="w-12 h-12 opacity-50" />
                                <p className="font-bold">No fuel entries logged.</p>
                            </div>
                        ) : (
                            stats?.recentLogs?.filter(l => l.type === 'diet' || l.type === 'weight').map((log) => (
                                <li key={log._id} className="p-8 flex items-center gap-6 hover:bg-gray-50 transition-all duration-300 group">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                                        log.type === 'diet' ? 'bg-green-50 text-green-500' : 'bg-purple-50 text-purple-500'
                                    }`}>
                                        {log.type === 'diet' ? <Plus className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg font-extrabold text-gray-900 truncate font-display">
                                            {log.type === 'diet' ? `Log: ${log.name || log.foodItem}` : `Biometric Sync`}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-sm font-bold text-gray-400 italic">
                                                {log.type === 'diet' ? `${log.calories} kcal intake` : `${log.bodyWeight} kg update`}
                                            </span>
                                            <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
                                            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                                                {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            {/* Performance Level 2 → Training History */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-extrabold text-gray-900 font-display italic">Training History</h2>
                    <div className="h-px bg-gray-100 flex-1"></div>
                    <span className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] bg-blue-50 px-4 py-2 rounded-full">Session Archive</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {stats?.recentLogs?.filter(l => l.type === 'workout').length === 0 ? (
                        <div className="col-span-full card-container p-20 text-center flex flex-col items-center gap-4 border-2 border-dashed border-gray-100 bg-transparent">
                            <Activity className="w-14 h-14 text-gray-200" />
                            <p className="text-gray-400 font-bold text-xl uppercase tracking-widest">No training sessions recorded</p>
                            <button className="text-blue-500 font-black text-sm hover:underline cursor-pointer">Protocol: Initiate First Session</button>
                        </div>
                    ) : (
                        stats?.recentLogs?.filter(l => l.type === 'workout').map((log) => (
                            <motion.div key={log._id} whileHover={{ y: -8 }} className="card-elevated p-8 bg-white group border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center transition-colors group-hover:bg-blue-500 group-hover:text-white">
                                        <TrendingUp className="w-8 h-8" />
                                    </div>
                                    <span className="text-xs font-black text-gray-300 uppercase tracking-widest">{new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <h4 className="text-xl font-black text-gray-900 font-display mb-2">Elite {log.exercise}</h4>
                                <div className="flex items-center gap-3">
                                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">{log.sets} Sets</span>
                                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">{log.reps} Reps</span>
                                    {log.liftWeight > 0 && <span className="bg-slate-50 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">{log.liftWeight} Kg</span>}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal - Modern Scale */}
            {showWeightModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-lg">
                    <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="bg-white rounded-[40px] p-12 w-full max-w-lg shadow-[0_50px_100px_rgba(0,0,0,0.3)] border border-gray-100">
                        <div className="flex items-center gap-4 mb-8">
                             <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Activity className="w-7 h-7" />
                            </div>
                            <h3 className="text-3xl font-black font-display italic">Update Biometrics</h3>
                        </div>
                        <form onSubmit={handleAddWeight} className="space-y-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-black text-gray-400 uppercase tracking-[0.2em] ml-1">New Body weight (kg)</label>
                                <input required type="number" min="30" max="250" value={newWeight} onChange={e => setNewWeight(e.target.value)} 
                                       className="w-full bg-gray-50 border-2 border-gray-100 rounded-[24px] px-8 py-5 text-2xl font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none" 
                                       placeholder="70.0" />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowWeightModal(false)} className="flex-1 py-5 text-gray-400 font-bold hover:bg-gray-50 rounded-[20px] transition-all">Discard</button>
                                <button type="submit" className="flex-[2] btn-primary py-5 text-xl font-black shadow-[0_20px_40px_rgba(34,197,94,0.3)]">Update Records</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

        </div>
    );
};

export default Tracker;
