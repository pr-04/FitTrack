import { useState, useEffect, useCallback } from 'react';
import { workoutsAPI } from '../services/api';
import { Plus, Trash2, Dumbbell, Calendar, Upload, Camera } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

const today = new Date().toISOString().split('T')[0];

const Workouts = () => {
    const [workouts, setWorkouts] = useState([]);
    const [mockWorkouts, setMockWorkouts] = useState([]);
    const [selectedDate, setSelectedDate] = useState(today);
    const [selectedWorkouts, setSelectedWorkouts] = useState({});

    // Custom workout state
    const [customActive, setCustomActive] = useState(false);
    const [customWorkout, setCustomWorkout] = useState({ exercise: '', sets: '', reps: '', weight: '', image: '' });

    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchWorkouts = useCallback(async () => {
        setFetchLoading(true);
        try {
            const res = await workoutsAPI.getAll();
            setWorkouts(res.data);
        } catch (err) {
            setError('Failed to load workouts.');
        } finally {
            setFetchLoading(false);
        }
    }, []);

    const fetchMockWorkouts = useCallback(async () => {
        try {
            const res = await workoutsAPI.getMockWorkouts();
            setMockWorkouts(res.data);
        } catch (err) {
            console.error('Failed to load mock workouts:', err);
        }
    }, []);

    useEffect(() => {
        fetchWorkouts();
        fetchMockWorkouts();
    }, [fetchWorkouts, fetchMockWorkouts]);

    const handleWorkoutChange = (name, field, value) => {
        setSelectedWorkouts(prev => ({
            ...prev,
            [name]: { ...prev[name], [field]: value }
        }));
    };

    const handleCustomImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setCustomWorkout(prev => ({ ...prev, image: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleLogWorkouts = async () => {
        const itemsToLog = [];

        Object.entries(selectedWorkouts).forEach(([exercise, data]) => {
            if (data.sets && data.reps) {
                const mockObj = mockWorkouts.find(m => m.name === exercise);
                itemsToLog.push({
                    exercise,
                    sets: Number(data.sets),
                    reps: Number(data.reps),
                    weight: Number(data.weight) || 0,
                    date: selectedDate,
                    image: mockObj?.image || ''
                });
            }
        });

        if (customActive && customWorkout.exercise && customWorkout.sets && customWorkout.reps) {
            itemsToLog.push({
                exercise: customWorkout.exercise,
                sets: Number(customWorkout.sets),
                reps: Number(customWorkout.reps),
                weight: Number(customWorkout.weight) || 0,
                date: selectedDate,
                image: customWorkout.image
            });
        }

        if (itemsToLog.length === 0) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const promises = itemsToLog.map(item => workoutsAPI.add(item));
            await Promise.all(promises);
            setSuccess('Workouts logged successfully!');
            setSelectedWorkouts({});
            setCustomActive(false);
            setCustomWorkout({ exercise: '', sets: '', reps: '', weight: '', image: '' });
            fetchWorkouts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to log selected workouts.');
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
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Log Workouts</h2>
                </div>

                <Alert type="error" className="mb-4">{error || null}</Alert>
                <Alert type="success" className="mb-4">{success || null}</Alert>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start mb-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {mockWorkouts.map(workout => {
                        const formData = selectedWorkouts[workout.name] || {};

                        return (
                            <div key={workout.name} className="glass-card bg-white/50 dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/50 flex flex-col hover:border-accent-blue/40 transition-colors shadow-sm">
                                <div className="h-44 w-full overflow-hidden shrink-0">
                                    <img src={workout.image} alt={workout.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-3 flex flex-col flex-grow">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white mb-3 line-clamp-1" title={workout.name}>{workout.name}</span>

                                    <div className="mt-auto flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <div className="w-1/2">
                                                <Input label="Sets" type="number" value={formData.sets || ''} onChange={(e) => handleWorkoutChange(workout.name, 'sets', e.target.value)} placeholder="0" className="h-8 text-xs" />
                                            </div>
                                            <div className="w-1/2">
                                                <Input label="Reps" type="number" value={formData.reps || ''} onChange={(e) => handleWorkoutChange(workout.name, 'reps', e.target.value)} placeholder="0" className="h-8 text-xs" />
                                            </div>
                                        </div>
                                        <Input label="Weight (kg)" type="number" step="0.5" value={formData.weight || ''} onChange={(e) => handleWorkoutChange(workout.name, 'weight', e.target.value)} placeholder="0" className="h-8 text-xs" />
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {/* Custom Workout Card */}
                    <div className="glass-card bg-white/50 dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-dashed border-slate-300 dark:border-slate-600 flex flex-col hover:border-accent-blue/40 transition-colors shadow-sm">
                        {!customActive ? (
                            <button type="button" onClick={() => setCustomActive(true)} className="flex flex-col items-center justify-center w-full h-full min-h-[200px] text-slate-500 hover:text-accent-blue transition-colors">
                                <Plus size={32} className="mb-2" />
                                <span className="text-sm font-semibold">Custom Workout</span>
                            </button>
                        ) : (
                            <>
                                <div className="h-44 w-full bg-slate-100 dark:bg-dark-900 shrink-0 relative flex flex-col items-center justify-center group overflow-hidden">
                                    {customWorkout.image ? (
                                        <img src={customWorkout.image} alt="Custom" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera size={28} className="text-slate-400 mb-1" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <label className="cursor-pointer flex flex-col items-center text-white text-xs font-medium">
                                            <Upload size={18} className="mb-1" />
                                            Upload Image
                                            <input type="file" accept="image/*" className="hidden" onChange={handleCustomImageUpload} />
                                        </label>
                                    </div>
                                </div>
                                <div className="p-3 flex flex-col flex-grow">
                                    <Input placeholder="Name" value={customWorkout.exercise} onChange={(e) => setCustomWorkout({ ...customWorkout, exercise: e.target.value })} className="h-8 text-sm mb-3 font-semibold" />

                                    <div className="mt-auto flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <div className="w-1/2">
                                                <Input label="Sets" type="number" value={customWorkout.sets} onChange={(e) => setCustomWorkout({ ...customWorkout, sets: e.target.value })} placeholder="0" className="h-8 text-xs" />
                                            </div>
                                            <div className="w-1/2">
                                                <Input label="Reps" type="number" value={customWorkout.reps} onChange={(e) => setCustomWorkout({ ...customWorkout, reps: e.target.value })} placeholder="0" className="h-8 text-xs" />
                                            </div>
                                        </div>
                                        <Input label="Weight (kg)" type="number" step="0.5" value={customWorkout.weight} onChange={(e) => setCustomWorkout({ ...customWorkout, weight: e.target.value })} placeholder="0" className="h-8 text-xs" />
                                        <Button type="button" variant="secondary" size="sm" className="w-full h-7 text-xs mt-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none hover:bg-slate-300 dark:hover:bg-slate-600" onClick={() => {
                                            setCustomActive(false);
                                            setCustomWorkout({ exercise: '', sets: '', reps: '', weight: '', image: '' });
                                        }}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 p-4 bg-slate-50/50 dark:bg-dark-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <div className="w-full sm:w-auto">
                        <Input label="Date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total Selection</p>
                            <p className="text-lg font-bold text-accent-blue">{Object.keys(selectedWorkouts).length + (customActive ? 1 : 0)} Exercises</p>
                        </div>
                        <Button onClick={handleLogWorkouts} loading={loading} disabled={Object.keys(selectedWorkouts).length === 0 && !customActive} className="w-full sm:w-auto shadow-lg shadow-accent-blue/20">
                            Log Workouts
                        </Button>
                    </div>
                </div>
            </Card>

            <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300 mb-4 flex items-center gap-2">
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
                                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{date}</span>
                                    <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700/50" />
                                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700/50">
                                        {items.length} exercise{items.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {items.map(w => (
                                        <Card key={w._id} className="p-4 flex items-center justify-between group hover:border-accent-blue/40 transition-colors">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{w.exercise}</p>
                                                <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
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
