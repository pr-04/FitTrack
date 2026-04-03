import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { Dumbbell, Apple, LineChart, Flame, ChevronRight, Activity, Target, Zap, Clock, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { calculateBMI, getBMIStatus } from '../utils/biometrics';
import { toast } from 'react-hot-toast';


const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await dashboardAPI.getSummary();
            setStats(res.data);
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleLogSuccess = (type) => {
        toast.success(`${type} logged successfully!`, {
            style: {
                borderRadius: '16px',
                background: '#0F172A',
                color: '#fff',
                fontWeight: 'bold'
            }
        });
        fetchStats();
    };

    let recommendation = "Generate your elite plan";
    if (stats?.workoutPlan?.days?.length > 0) {
        recommendation = `${stats.workoutPlan.days[0].type || "Full Body"} focus today`;
    }

    const bmi = calculateBMI(user?.weight, user?.height);
    const bmiStatus = getBMIStatus(bmi);

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">

            {/* Top Greeting */}
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/50 backdrop-blur-md p-7 rounded-[28px] border border-white/60 shadow-sm relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-56 h-56 bg-green-400/5 blur-[80px] -mr-24 -mt-24 rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 font-display">
                        Welcome back, <span className="text-primary">{user?.name.split(' ')[0]}</span> 👋
                    </h1>
                    <p className="text-gray-500 mt-1.5 text-base font-medium">
                        You're on track to{' '}
                        <span className="text-gray-900 font-bold capitalize underline decoration-primary/30 underline-offset-4">
                            {user?.goal?.replace('_', ' ')}
                        </span>.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 relative z-10">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Target className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Plan</p>
                        <p className="font-bold text-gray-900 capitalize text-sm">{user?.goal?.replace('_', ' ') || 'Elite Training'}</p>
                    </div>
                </div>
            </motion.header>



            {/* Stats Cards — slightly smaller, secondary hierarchy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Streak */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md relative group overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Flame className="w-14 h-14 text-orange-500" />
                    </div>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                            <Flame className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Streak</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-extrabold text-gray-900 font-display">
                            {loading ? '---' : stats?.streak || 0}
                        </p>
                        <span className="text-base font-bold text-gray-400 uppercase tracking-widest">Days</span>
                    </div>
                    <div className="mt-3 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(((stats?.streak || 0) / 7) * 100, 100)}%` }} />
                    </div>
                    <p className="text-xs text-orange-600 font-bold mt-2.5 uppercase tracking-tighter italic">
                        Keep it burning. Don't break the chain.
                    </p>
                </motion.div>

                {/* Today's Focus */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="w-14 h-14 text-primary" />
                    </div>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-primary">
                            <Activity className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Today's Focus</h3>
                    </div>
                    <p className="text-xl font-extrabold text-gray-900 font-display leading-tight">
                        {loading ? 'Scanning...' : recommendation}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest bg-green-50 w-fit px-3 py-1.5 rounded-lg border border-green-100">
                        <Zap className="w-3 h-3" /> AI Optimized Plan
                    </div>
                </motion.div>

                {/* BMI */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LineChart className="w-14 h-14 text-indigo-500" />
                    </div>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <Clock className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Current BMI</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-extrabold text-gray-900 font-display">{bmi}</p>
                        <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded ${bmiStatus.color}`}>
                            {bmiStatus.label}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 font-semibold mt-3">
                        Synced with your {user?.weight || 0}kg weight profile.
                    </p>
                </motion.div>
            </div>

            {/* MAIN: Chart (hero) + Side Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-7">

                {/* ★ Weekly Progress Chart — HIGHEST ELEVATION */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl p-8 shadow-[0_24px_80px_-16px_rgba(34,197,94,0.18)] border border-gray-100/80 relative overflow-hidden"
                >
                    {/* Subtle corner glow */}
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-green-400/8 blur-[80px] rounded-full pointer-events-none" />

                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-2xl font-extrabold text-gray-900 font-display">Weekly Caloric Performance</h2>
                            <p className="text-gray-400 text-sm font-medium mt-1 uppercase tracking-wider">Historical intake overview</p>
                        </div>
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Daily kcal</span>
                        </div>
                    </div>

                    <div className="h-[420px] w-full">
                        {stats?.weekData?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.weekData} margin={{ top: 16, right: 16, left: -8, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22C55E" stopOpacity={0.28} />
                                            <stop offset="60%" stopColor="#22C55E" stopOpacity={0.06} />
                                            <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                                        dy={12}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                                        dx={-8}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: '#22C55E', strokeWidth: 1.5, strokeDasharray: '4 2' }}
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 20px 40px -8px rgba(0,0,0,0.18)',
                                            padding: '16px 20px',
                                            backgroundColor: '#0F172A',
                                            color: '#fff'
                                        }}
                                        itemStyle={{ color: '#22C55E', fontWeight: 800, fontSize: '16px' }}
                                        labelStyle={{ color: '#94A3B8', marginBottom: '6px', fontWeight: 700, fontSize: '12px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="calories"
                                        stroke="#22C55E"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#premiumGradient)"
                                        activeDot={{ r: 7, fill: '#0F172A', stroke: '#22C55E', strokeWidth: 2.5 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 bg-gray-50/60 rounded-2xl border-2 border-dashed border-gray-200">
                                <Activity className="w-10 h-10 opacity-20" />
                                <p className="font-bold text-base">{loading ? 'Initializing charts...' : 'No data yet.'}</p>
                                <p className="text-sm">Log your first meal to see progress.</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Side Panel — less dominant */}
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex flex-col gap-4"
                >
                    <h2 className="text-lg font-extrabold text-gray-800 font-display">Elite Hub</h2>

                    {[
                        { to: '/app/workout', icon: <Dumbbell className="w-5 h-5" />, title: 'Titan Training', desc: 'AI Workout Plans', color: 'blue' },
                        { to: '/app/diet', icon: <Apple className="w-5 h-5" />, title: 'Elite Nutrition', desc: 'Custom Meal Roadmap', color: 'emerald' },
                        { to: '/app/tracker', icon: <LineChart className="w-5 h-5" />, title: 'Progress DNA', desc: 'Advanced Biometrics', color: 'indigo' }
                    ].map((item, idx) => (
                        <Link
                            key={idx}
                            to={item.to}
                            className="bg-white rounded-2xl p-5 flex items-center justify-between group cursor-pointer border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-l-[5px]"
                            style={{ borderLeftColor: `var(--${item.color}-500, #6366f1)` }}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 bg-${item.color}-50 rounded-xl flex items-center justify-center text-${item.color}-600 group-hover:scale-110 transition-transform`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="font-extrabold text-gray-900 font-display text-sm">{item.title}</p>
                                    <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </Link>
                    ))}

                    {/* Pro CTA */}
                    <div className="rounded-2xl p-6 bg-gradient-to-br from-slate-900 to-gray-800 text-white relative overflow-hidden mt-1">
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                        <h4 className="text-base font-bold font-display relative z-10 mb-1">Upgrade to Pro Elite</h4>
                        <p className="text-slate-400 text-xs relative z-10 mb-4 leading-relaxed">
                            Unlimited AI generations & deep biometric analysis.
                        </p>
                        <button className="w-full py-3 bg-white text-black font-extrabold text-sm rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg relative z-10">
                            Go Pro Now
                        </button>
                    </div>
                </motion.div>
            </div>

            <div className="h-4" /> {/* Spacer */}
        </div>
    );
};

export default Dashboard;
