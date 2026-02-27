import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { foodsAPI } from '../services/api';
import { Plus, Trash2, Flame, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert';

const today = new Date().toISOString().split('T')[0];

const mealConfig = {
    breakfast: { label: 'Breakfast', icon: Coffee, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    lunch: { label: 'Lunch', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    dinner: { label: 'Dinner', icon: Moon, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    snack: { label: 'Snack', icon: Cookie, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
};

const Calories = () => {
    const { user } = useAuth();
    const [foods, setFoods] = useState([]);
    const [mockFoods, setMockFoods] = useState([]);
    const [totalCalories, setTotalCalories] = useState(0);
    const [selectedDate, setSelectedDate] = useState(today);
    const [form, setForm] = useState({ foodName: '', calories: '', mealType: 'breakfast', date: today });
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchFoods = useCallback(async () => {
        setFetchLoading(true);
        try {
            const res = await foodsAPI.getByDate(selectedDate);
            setFoods(res.data.foods);
            setTotalCalories(res.data.totalCalories);
        } catch {
            setError('Failed to load food entries.');
        } finally {
            setFetchLoading(false);
        }
    }, [selectedDate]);

    const fetchMockFoods = useCallback(async () => {
        try {
            const res = await foodsAPI.getMockFoods();
            setMockFoods(res.data);
        } catch (err) {
            console.error('Failed to load mock foods:', err);
        }
    }, []);

    useEffect(() => {
        fetchFoods();
        fetchMockFoods();
    }, [fetchFoods, fetchMockFoods]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleFoodSelect = (e) => {
        const foodName = e.target.value;
        const selectedFood = mockFoods.find(f => f.name === foodName);

        if (selectedFood) {
            setForm(prev => ({
                ...prev,
                foodName: selectedFood.name,
                calories: selectedFood.calories
            }));
            setSuccess(`Selected ${selectedFood.name}. Calories updated!`);
            setTimeout(() => setSuccess(''), 2000);
        } else {
            setForm(prev => ({ ...prev, foodName: '', calories: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await foodsAPI.add({ ...form, calories: Number(form.calories) });
            setForm({ foodName: '', calories: '', mealType: 'breakfast', date: selectedDate });
            setSuccess('Food entry added!');
            fetchFoods();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add food entry.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await foodsAPI.delete(id);
            fetchFoods();
        } catch {
            setError('Failed to delete entry.');
        }
    };

    const grouped = useMemo(() => foods.reduce((acc, f) => {
        if (!acc[f.mealType]) acc[f.mealType] = [];
        acc[f.mealType].push(f);
        return acc;
    }, {}), [foods]);

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
    const progress = Math.min((totalCalories / calorieGoal) * 100, 100);

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center gap-2 mb-5">
                    <Plus size={20} className="text-accent-orange" />
                    <h2 className="text-lg font-semibold text-white">Log Food</h2>
                </div>

                <Alert type="error" className="mb-4">{error || null}</Alert>
                <Alert type="success" className="mb-4">{success || null}</Alert>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <Select
                            label="Food Name"
                            name="foodName"
                            value={form.foodName}
                            onChange={handleFoodSelect}
                            options={[
                                { value: '', label: 'Select a food...' },
                                ...mockFoods.map(f => ({ value: f.name, label: f.name }))
                            ]}
                            required
                        />
                        <Input label="Calories (kcal)" type="number" name="calories" value={form.calories} onChange={handleChange} placeholder="e.g. 450" min="0" required />
                        <Select label="Meal Type" name="mealType" value={form.mealType} onChange={handleChange} options={[
                            { value: 'breakfast', label: 'Breakfast' },
                            { value: 'lunch', label: 'Lunch' },
                            { value: 'dinner', label: 'Dinner' },
                            { value: 'snack', label: 'Snack' }
                        ]} />
                        <Input label="Date" type="date" name="date" value={form.date} onChange={(e) => {
                            setForm({ ...form, date: e.target.value });
                            setSelectedDate(e.target.value);
                        }} required />
                        <div className="sm:col-span-2 lg:col-span-4 mt-2">
                            <Button type="submit" loading={loading} className="w-full sm:w-auto">Add Food</Button>
                        </div>
                    </div>
                </form>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="flex flex-col items-center justify-center text-center">
                    <Flame size={32} className="text-orange-400 mb-2" />
                    <p className="text-4xl font-bold text-white">{totalCalories}</p>
                    <p className="text-slate-400 text-sm mt-1">kcal consumed</p>
                    <p className="text-slate-600 text-xs mt-0.5">Goal: {calorieGoal} kcal</p>
                    <div className="w-full bg-dark-900 rounded-full h-2 mt-4 overflow-hidden">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-accent-red' : 'bg-gradient-brand'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </Card>
                <Card className="md:col-span-2 flex flex-col justify-center">
                    <Input label="View entries for date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="max-w-xs" />
                    <p className="text-xs text-slate-500 mt-2">{foods.length} items logged for this day</p>
                </Card>
            </div>

            <div className="space-y-4">
                {fetchLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : foods.length === 0 ? (
                    <Card className="text-center py-10 text-slate-500">
                        <Flame size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No food logged for this day. Add something above!</p>
                    </Card>
                ) : (
                    Object.entries(mealConfig).map(([type, cfg]) => {
                        const items = grouped[type] || [];
                        if (items.length === 0) return null;
                        const MealIcon = cfg.icon;
                        const mealTotal = items.reduce((s, f) => s + f.calories, 0);

                        return (
                            <Card key={type} className={`border ${cfg.bg}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <MealIcon size={18} className={cfg.color} />
                                        <h4 className={`font-semibold ${cfg.color}`}>{cfg.label}</h4>
                                    </div>
                                    <span className="text-sm font-semibold text-white">{mealTotal} kcal</span>
                                </div>
                                <div className="space-y-2">
                                    {items.map(f => (
                                        <div key={f._id} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0 group">
                                            <span className="text-slate-200 text-sm">{f.foodName}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-400 text-sm font-medium">{f.calories} kcal</span>
                                                <button onClick={() => handleDelete(f._id)}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-accent-red transition-all duration-200">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Calories;
