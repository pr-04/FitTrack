import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { weightsAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

const today = new Date().toISOString().split('T')[0];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 shadow-lg rounded-lg px-3 py-2 text-sm">
                <p className="text-slate-600 dark:text-slate-400 mb-1">{label}</p>
                <p className="text-slate-900 dark:text-white font-semibold">{payload[0].value} kg</p>
            </div>
        );
    }
    return null;
};

const Weight = () => {
    const { user } = useAuth();
    const [weights, setWeights] = useState([]);
    const [form, setForm] = useState({ weight: '', date: today });
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchWeights = async () => {
        setFetchLoading(true);
        try {
            const res = await weightsAPI.getAll();
            setWeights(res.data);
        } catch {
            setError('Failed to load weight data.');
        } finally {
            setFetchLoading(false);
        }
    };

    useEffect(() => { fetchWeights(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await weightsAPI.add({ weight: Number(form.weight), date: form.date });
            setForm({ weight: '', date: today });
            setSuccess('Weight logged!');
            fetchWeights();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to log weight.');
        } finally {
            setLoading(false);
        }
    };

    // Stats
    const latest = weights.length > 0 ? weights[weights.length - 1].weight : null;
    const first = weights.length > 0 ? weights[0].weight : null;
    const change = (latest !== null && first !== null) ? (latest - first).toFixed(1) : null;
    const chartData = weights.slice(-20).map(w => ({
        date: new Date(w.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        weight: w.weight,
    }));

    // BMI Calculation
    let bmi = null;
    let bmiCategory = '';
    let bmiColor = 'text-slate-400';

    if (latest && user?.height) {
        const heightInMeters = user.height / 100;
        bmi = (latest / (heightInMeters * heightInMeters)).toFixed(1);

        if (bmi < 18.5) {
            bmiCategory = 'Underweight';
            bmiColor = 'text-blue-400';
        } else if (bmi >= 18.5 && bmi < 25) {
            bmiCategory = 'Normal';
            bmiColor = 'text-emerald-400';
        } else if (bmi >= 25 && bmi < 30) {
            bmiCategory = 'Overweight';
            bmiColor = 'text-yellow-400';
        } else {
            bmiCategory = 'Obese';
            bmiColor = 'text-red-400';
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center gap-2 mb-5">
                    <Plus size={20} className="text-accent-green" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Log Weight</h2>
                </div>

                <Alert type="error" className="mb-4">{error || null}</Alert>
                <Alert type="success" className="mb-4">{success || null}</Alert>

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <Input label="Weight (kg)" type="number" name="weight" value={form.weight}
                            onChange={(e) => setForm({ ...form, weight: e.target.value })}
                            placeholder="e.g. 72.5" min="20" max="300" step="0.1" required />
                        <Input label="Date" type="date" name="date" value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                        <Button type="submit" loading={loading} className="whitespace-nowrap w-full sm:w-auto">Log Weight</Button>
                    </div>
                </form>
            </Card>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="text-center">
                    <Scale size={24} className="mx-auto mb-2 text-accent-blue" />
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{latest ?? '—'}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Current (kg)</p>
                </Card>
                <Card className="text-center flex flex-col justify-center">
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Starting Weight</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{first ?? '—'}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">kg</p>
                </Card>
                <Card className="text-center flex flex-col justify-center">
                    {change !== null ? (
                        <>
                            {Number(change) < 0
                                ? <TrendingDown size={24} className="mx-auto mb-2 text-emerald-500 dark:text-emerald-400" />
                                : Number(change) > 0
                                    ? <TrendingUp size={24} className="mx-auto mb-2 text-red-500 dark:text-red-400" />
                                    : <Minus size={24} className="mx-auto mb-2 text-slate-500 dark:text-slate-400" />}
                            <p className={`text-3xl font-bold ${Number(change) < 0 ? 'text-emerald-600 dark:text-emerald-400' : Number(change) > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                                {Number(change) > 0 ? '+' : ''}{change} kg
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Total change</p>
                        </>
                    ) : (
                        <p className="text-slate-500 text-sm italic">Add more entries to see progress</p>
                    )}
                </Card>
                <Card className="text-center flex flex-col justify-center">
                    <p className="text-slate-400 text-sm mb-1">Current BMI</p>
                    {bmi ? (
                        <>
                            <p className={`text-3xl font-bold ${bmiColor}`}>{bmi}</p>
                            <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider">{bmiCategory}</p>
                        </>
                    ) : !user?.height ? (
                        <p className="text-slate-500 text-xs italic mt-2">Update height in Profile to see BMI</p>
                    ) : (
                        <p className="text-3xl font-bold text-white">—</p>
                    )}
                </Card>
            </div>

            <Card>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-5">Weight Progress</h3>
                {fetchLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : chartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                            <Tooltip content={<CustomTooltip />} />
                            <defs>
                                <linearGradient id="wGrad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                            </defs>
                            <Line type="monotone" dataKey="weight" stroke="url(#wGrad)" strokeWidth={3}
                                dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6, fill: '#06b6d4' }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-40 text-slate-500 text-sm italic">
                        Add at least 2 weight entries to see the chart.
                    </div>
                )}
            </Card>

            {weights.length > 0 && (
                <Card>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">History</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-300 dark:border-slate-700/50">
                                    <th className="pb-3 font-medium">Date</th>
                                    <th className="pb-3 font-medium">Weight</th>
                                    <th className="pb-3 font-medium">Change</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300/50 dark:divide-slate-700/30">
                                {[...weights].reverse().map((w, i, arr) => {
                                    const prev = arr[i + 1];
                                    const diff = prev ? (w.weight - prev.weight).toFixed(1) : null;
                                    return (
                                        <tr key={w._id} className="text-slate-700 dark:text-slate-300">
                                            <td className="py-3">
                                                {new Date(w.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="py-3 text-slate-900 dark:text-white font-semibold">{w.weight} kg</td>
                                            <td className="py-3">
                                                {diff !== null ? (
                                                    <span className={`font-medium ${Number(diff) < 0 ? 'text-emerald-600 dark:text-emerald-400' : Number(diff) > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                        {Number(diff) > 0 ? '+' : ''}{diff} kg
                                                    </span>
                                                ) : <span className="text-slate-500 dark:text-slate-600">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default Weight;
