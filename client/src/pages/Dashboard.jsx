import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { Dumbbell, Apple, LineChart, Flame, ChevronRight, Activity, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { calculateBMI, getBMIStatus } from '../utils/biometrics';
import { getGoalLabel } from '../utils/labels';

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

    let recommendation = "Generate your plan";
    if (stats?.workoutPlan?.days?.length > 0) {
        const createdAt = stats.workoutPlanCreatedAt || stats.workoutPlan.createdAt;
        let dayIndex = 0;
        if (createdAt && !isNaN(new Date(createdAt).getTime())) {
            const createdDate = new Date(createdAt);
            const now = new Date();
            const diffMs = now.getTime() - createdDate.getTime();
            const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
            dayIndex = diffDays % stats.workoutPlan.days.length;
        }
        const focusDay = stats.workoutPlan.days[dayIndex] || stats.workoutPlan.days[0];
        recommendation = focusDay ? `${focusDay.day || focusDay.type || `Day ${dayIndex + 1}`}: ${focusDay.type || focusDay.title || 'Workout Focus'}` : "Generate your plan";
    }

    const hasBiometrics = user?.weight && user?.height;
    const bmi = hasBiometrics ? calculateBMI(user.weight, user.height) : '—';
    const bmiStatus = hasBiometrics ? getBMIStatus(bmi) : { label: 'Unspecified', color: 'bg-slate-100 text-slate-600' };

    const firstName = (user?.name || 'User').split(' ')[0];

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 pb-16">

            {/* Top Greeting */}
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
                    Welcome back, <span className="text-green-600">{firstName}</span> 👋
                </h1>
                <p className="text-slate-600 mt-1 text-base font-medium">
                    You're on track to <span className="font-semibold text-slate-900">{getGoalLabel(user?.goal)}</span>.
                </p>
            </motion.header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Streak */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                >
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                            <Flame className="w-5 h-5" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Streak</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold text-slate-900">
                            {loading ? '—' : stats?.streak || 0}
                        </p>
                        <span className="text-base font-semibold text-slate-500">Days</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-3">
                        Consistent daily workout and food tracking.
                    </p>
                </motion.div>

                {/* Today's Focus */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                >
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Focus</h3>
                    </div>
                    <p className="text-xl font-bold text-slate-900 leading-snug">
                        {loading ? 'Loading...' : recommendation}
                    </p>
                </motion.div>

                {/* BMI */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                >
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current BMI</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold text-slate-900">{bmi}</p>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${bmiStatus.color}`}>
                            {bmiStatus.label}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-3">
                        {user?.weight ? `Synced with your ${user.weight} kg profile.` : 'Add weight to sync BMI.'}
                    </p>
                </motion.div>
            </div>

            {/* Chart + Quick links */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

                {/* Bar Chart — Weekly Caloric Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Weekly Caloric Performance</h2>
                            <p className="text-slate-500 text-sm font-medium mt-0.5">Historical daily intake overview</p>
                        </div>
                    </div>

                    <div className="h-[320px] w-full min-w-0">
                        {stats?.weekData?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <BarChart data={stats.weekData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                        dy={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                        dx={-8}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                            padding: '12px 16px',
                                            backgroundColor: '#ffffff',
                                            color: '#0f172a'
                                        }}
                                        itemStyle={{ color: '#16a34a', fontWeight: 700 }}
                                    />
                                    <Bar
                                        dataKey="calories"
                                        fill="#16a34a"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={48}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <Activity className="w-8 h-8 text-slate-400" />
                                <p className="font-semibold text-slate-600">{loading ? 'Initializing...' : 'No data yet.'}</p>
                                <p className="text-xs text-slate-500">Log your meals to see progress.</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Quick links */}
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex flex-col gap-4"
                >
                    <h2 className="text-lg font-bold text-slate-900">Quick links</h2>

                    {[
                        { to: '/app/workout', icon: <Dumbbell className="w-5 h-5" />, title: 'Workout plan', desc: 'Weekly training roadmap' },
                        { to: '/app/diet', icon: <Apple className="w-5 h-5" />, title: 'Diet plan', desc: 'Custom nutrition plan' },
                        { to: '/app/tracker', icon: <LineChart className="w-5 h-5" />, title: 'Tracker', desc: 'Biometrics & log history' }
                    ].map((item, idx) => (
                        <Link
                            key={idx}
                            to={item.to}
                            className="bg-white rounded-2xl p-4 flex items-center justify-between group cursor-pointer border border-slate-200 shadow-sm hover:border-slate-300 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </Link>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
