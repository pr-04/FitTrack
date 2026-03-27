import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { workoutsAPI, foodsAPI, weightsAPI } from '../services/api';
import SummaryCard from '../components/SummaryCard';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { Dumbbell, Flame, Scale, Target, Sparkles, AlertCircle, TrendingUp, Info } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { aiAPI } from '../services/api';

const goalLabels = {
    lose_weight: 'Lose Weight',
    gain_muscle: 'Gain Muscle',
    maintain: 'Maintain Weight',
    improve_fitness: 'Improve Fitness',
};

// Custom recharts tooltip
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-sm shadow-xl">
                <p className="text-slate-600 dark:text-slate-400 mb-1">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }} className="font-semibold">
                        {p.name}: {p.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const Dashboard = () => {
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState([]);
    const [weights, setWeights] = useState([]);
    const [todayCalories, setTodayCalories] = useState(0);
    const [weeklyCalories, setWeeklyCalories] = useState([]);
    const [aiInsights, setAiInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    const today = new Date().toISOString().split('T')[0];

    // Count today's workouts
    const todayWorkouts = workouts.filter(w => {
        const wDate = new Date(w.date).toISOString().split('T')[0];
        return wDate === today;
    }).length;

    // Calorie Goal Logic
    const getCalorieGoal = (goal) => {
        switch (goal) {
            case 'lose_weight': return 1800;
            case 'gain_muscle': return 2800;
            case 'improve_fitness': return 2400;
            case 'maintain': // Fallthrough
            default: return 2200;
        }
    };
    const calorieGoal = getCalorieGoal(user?.goal);
    const calProgress = todayCalories > 0 ? (todayCalories / calorieGoal) * 100 : 0;

    // Latest weight
    const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [wRes, foodRes, weightRes] = await Promise.all([
                    workoutsAPI.getAll(),
                    foodsAPI.getByDate(today),
                    weightsAPI.getAll(),
                ]);
                setWorkouts(wRes.data);
                setTodayCalories(foodRes.data.totalCalories || 0);
                setWeights(weightRes.data);

                // Build last 7 days calorie data
                const days = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const label = d.toLocaleDateString('en', { weekday: 'short' });
                    try {
                        const r = await foodsAPI.getByDate(dateStr);
                        days.push({ date: label, calories: r.data.totalCalories || 0 });
                    } catch {
                        days.push({ date: label, calories: 0 });
                    }
                }
                setWeeklyCalories(days);

                // Fetch AI Insights
                try {
                    const aiRes = await aiAPI.getDashboardInsights();
                    setAiInsights(aiRes.data);
                } catch (aiErr) {
                    console.error('AI Insights fetch error:', aiErr);
                }
            } catch (err) {
                console.error('Dashboard fetch error:', err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Weight chart data (last 14 entries)
    const weightChartData = weights.slice(-14).map(w => ({
        date: new Date(w.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        weight: w.weight,
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-premium-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
                        <span className="gradient-text">
                            {user?.name?.split(' ')[0]}
                        </span>! 👋
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Here's your fitness summary for today.</p>
                </div>
            </div>

            {/* AI Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel border-blue-500/20 rounded-[32px] p-6 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                        <Sparkles size={120} className="text-blue-500" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-2xl shadow-blue-500/40 animate-pulse">
                            <Sparkles className="text-white" size={28} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">
                                    AI Fitness Coach
                                </h3>
                                <span className="text-[9px] bg-blue-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                                    <div className="w-1 h-1 bg-white rounded-full animate-ping" /> Live Insight
                                </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium italic">
                                "{aiInsights?.dailyReminder || "Analyzing your data to provide personalized motivation..."}"
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-xl">
                                    <TrendingUp size={14} />
                                    <span>{aiInsights?.progressAnalysis || "Progress Analysis Pending"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`glass-panel rounded-[32px] p-6 flex flex-col justify-between group hover:scale-[1.01] transition-transform duration-500 ${aiInsights?.healthWarning?.toLowerCase().includes('warning') || aiInsights?.healthWarning?.toLowerCase().includes('risk') ? 'border-red-500/20' : 'border-green-500/20'}`}>
                    <div className="flex items-start gap-4">
                        <div className={`${aiInsights?.healthWarning?.toLowerCase().includes('warning') || aiInsights?.healthWarning?.toLowerCase().includes('risk') ? 'bg-red-500 shadow-red-500/30' : 'bg-green-500 shadow-green-500/30'} w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl transition-transform group-hover:rotate-12`}>
                            <AlertCircle className="text-white" size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 dark:text-white text-sm tracking-tight uppercase opacity-50">Health Warning</h4>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Automated Analysis</p>
                        </div>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-6 leading-relaxed italic">
                        {aiInsights?.healthWarning || "Everything looks good! Keep following your routine."}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <SummaryCard
                    title="Calories Today"
                    value={todayCalories}
                    subtitle={`Goal: ${calorieGoal} kcal`}
                    icon={Flame}
                    color="orange"
                    progress={calProgress}
                    className="hover:scale-105 transition-transform duration-500"
                />
                <SummaryCard title="Workouts Today" value={todayWorkouts} subtitle="exercises logged" icon={Dumbbell} color="blue" className="hover:scale-105 transition-transform duration-500" />
                <SummaryCard title="Current Weight" value={latestWeight ? `${latestWeight} kg` : '—'} subtitle="latest entry" icon={Scale} color="green" className="hover:scale-105 transition-transform duration-500" />
                <SummaryCard title="Fitness Goal" value={goalLabels[user?.goal] || '—'} subtitle="current target" icon={Target} color="purple" className="hover:scale-105 transition-transform duration-500" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-5">Weekly Calories</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={weeklyCalories} barSize={30}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="calories" name="Calories" fill="url(#calGrad)" radius={[6, 6, 0, 0]} />
                            <defs>
                                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.3} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                <Card>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-5">Weight Progress</h3>
                    {weightChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={weightChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                                <Tooltip content={<CustomTooltip />} />
                                <defs>
                                    <linearGradient id="weightGrad" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                </defs>
                                <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="url(#weightGrad)" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6, fill: '#8b5cf6' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm italic">
                            No weight data yet. Add your first entry!
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
