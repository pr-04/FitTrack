import { useState, useEffect } from 'react';
import { workoutsAPI } from '../services/api';
import { Plus, Trash2, Dumbbell, Calendar } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert';

const EXERCISES = [
    'Bench Press', 'Squat', 'Deadlift', 'Pull-ups', 'Push-ups',
    'Shoulder Press', 'Bicep Curl', 'Tricep Dip', 'Lat Pulldown',
    'Leg Press', 'Plank', 'Lunges', 'Rows', 'Custom'
];

const today = new Date().toISOString().split('T')[0];

const Workouts = () => {
    const [workouts, setWorkouts] = useState([]);
    const [form, setForm] = useState({ exercise: '', sets: '', reps: '', weight: '', date: today });
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchWorkouts = async () => {
        setFetchLoading(true);
        try {
            const res = await workoutsAPI.getAll();
            setWorkouts(res.data);
        } catch (err) {
            setError('Failed to load workouts.');
        } finally {
            setFetchLoading(false);
        }
    };

    useEffect(() => { fetchWorkouts(); }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await workoutsAPI.add({
                ...form,
                sets: Number(form.sets),
                reps: Number(form.reps),
                weight: Number(form.weight) || 0,
            });
            setForm({ exercise: '', sets: '', reps: '', weight: '', date: today });
            setSuccess('Workout logged successfully!');
            fetchWorkouts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add workout.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this workout?')) return;
        try {
            await workoutsAPI.delete(id);
            setWorkouts(workouts.filter(w => w._id !== id));
        } catch {
            setError('Failed to delete workout.');
        }
    };

    // Group workouts by date
    const grouped = workouts.reduce((acc, w) => {
        const d = new Date(w.date).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (!acc[d]) acc[d] = [];
        acc[d].push(w);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center gap-2 mb-5">
                    <Plus size={20} className="text-accent-blue" />
                    <h2 className="text-lg font-semibold text-white">Log a Workout</h2>
                </div>

                <Alert type="error" className="mb-4">{error || null}</Alert>
                <Alert type="success" className="mb-4">{success || null}</Alert>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Select label="Exercise" name="exercise" value={form.exercise} onChange={handleChange} required options={[
                            { value: '', label: 'Select exercise...' },
                            ...EXERCISES.map(e => ({ value: e, label: e }))
                        ]} />
                        <Input label="Sets" type="number" name="sets" value={form.sets} onChange={handleChange} placeholder="e.g. 3" min="1" max="20" required />
                        <Input label="Reps" type="number" name="reps" value={form.reps} onChange={handleChange} placeholder="e.g. 10" min="1" max="100" required />
                        <Input label="Weight (kg)" type="number" name="weight" value={form.weight} onChange={handleChange} placeholder="e.g. 60" min="0" step="0.5" />
                        <Input label="Date" type="date" name="date" value={form.date} onChange={handleChange} required />
                        <div className="flex items-end">
                            <Button type="submit" loading={loading} className="w-full">Add Workout</Button>
                        </div>
                    </div>
                </form>
            </Card>

            <div>
                <h3 className="text-base font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <Dumbbell size={16} className="text-accent-blue" /> Your Workout History
                </h3>

                {fetchLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : workouts.length === 0 ? (
                    <Card className="text-center py-12 text-slate-500">
                        <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No workouts logged yet. Add your first one above!</p>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(grouped).map(([date, items]) => (
                            <div key={date}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar size={14} className="text-slate-500" />
                                    <span className="text-sm text-slate-400 font-medium">{date}</span>
                                    <div className="flex-1 h-px bg-slate-700/50" />
                                    <span className="text-xs text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-slate-700/50">
                                        {items.length} exercise{items.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {items.map(w => (
                                        <Card key={w._id} className="p-4 flex items-center justify-between group hover:border-accent-blue/40 transition-colors">
                                            <div>
                                                <p className="font-semibold text-white">{w.exercise}</p>
                                                <p className="text-slate-400 text-sm mt-0.5">
                                                    {w.sets} sets × {w.reps} reps
                                                    {w.weight > 0 ? ` @ ${w.weight}kg` : ' (bodyweight)'}
                                                </p>
                                            </div>
                                            <button onClick={() => handleDelete(w._id)}
                                                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-accent-red transition-all duration-200 ml-3">
                                                <Trash2 size={16} />
                                            </button>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Workouts;
