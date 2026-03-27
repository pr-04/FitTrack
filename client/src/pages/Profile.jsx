import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { User, Save, Sparkles } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert';



const Profile = () => {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({
        name: user?.name || '',
        height: user?.height || '',
        weight: user?.weight || '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password && form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const payload = {
                name: form.name,
                height: form.height ? Number(form.height) : undefined,
                weight: form.weight ? Number(form.weight) : undefined,
            };
            if (form.password) payload.password = form.password;

            const res = await authAPI.updateProfile(payload);
            updateUser(res.data);
            setForm(prev => ({ ...prev, password: '' }));
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    return (
        <div className="max-w-2xl space-y-6 mx-auto">
            <Card>
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-xl font-bold text-white shadow-sm">
                        {initials}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">{user?.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/5">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{user?.height ? `${user.height} cm` : '—'}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 uppercase">Height</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{user?.weight ? `${user.weight} kg` : '—'}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 uppercase">Starting Weight</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <User size={16} className="text-accent-blue" />
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">Edit Profile</h3>
                </div>

                <Alert type="error" className="mb-4">{error || null}</Alert>
                <Alert type="success" className="mb-4">{success || null}</Alert>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Full Name" name="name" value={form.name} onChange={handleChange} required />

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Height (cm)" type="number" name="height" value={form.height} onChange={handleChange} placeholder="175" min="100" max="250" />
                        <Input label="Weight (kg)" type="number" name="weight" value={form.weight} onChange={handleChange} placeholder="70" min="30" max="300" />
                    </div>



                    <Input
                        label="New Password"
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Min. 6 characters"
                        className="opacity-90"
                        error={form.password && form.password.length < 6 ? 'Password too short' : null}
                    />

                    <div className="pt-2">
                        <Button type="submit" loading={loading} className="w-full sm:w-auto flex items-center gap-2">
                            <Save size={16} />
                            <span>Save Changes</span>
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Profile;
