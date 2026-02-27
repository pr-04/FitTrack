import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(form);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
            {/* Background blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-brand mb-4 shadow-lg shadow-accent-blue/30">
                        <Zap size={28} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Welcome back</h1>
                    <p className="text-slate-400 mt-1">Sign in to your FitTrack account</p>
                </div>

                {/* Card */}
                <Card>
                    <Alert type="error" className="mb-4">{error || null}</Alert>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative">
                            <Mail size={16} className="absolute left-3.5 top-[calc(50%+10px)] -translate-y-1/2 text-slate-500 z-10" />
                            <Input
                                label="Email address"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className="pl-10"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock size={16} className="absolute left-3.5 top-[calc(50%+10px)] -translate-y-1/2 text-slate-500 z-10" />
                            <Input
                                label="Password"
                                type={showPass ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="px-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3.5 top-[calc(50%+10px)] -translate-y-1/2 text-slate-500 hover:text-white transition-colors z-10"
                            >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <Button type="submit" loading={loading} className="w-full">Sign In</Button>
                    </form>

                    <p className="text-center text-slate-400 text-sm mt-6">
                        Don&apos;t have an account?{' '}
                        <Link to="/signup" className="text-accent-blue hover:text-accent-purple font-medium transition-colors">
                            Create one free
                        </Link>
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default Login;
