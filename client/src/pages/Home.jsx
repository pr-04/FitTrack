import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, TrendingUp, Dumbbell, Utensils } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Home = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen relative overflow-hidden bg-white dark:bg-slate-950">
            {/* Video Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute min-w-full min-h-full object-cover opacity-40 dark:opacity-30 transition-opacity duration-1000"
                >
                    <source src="https://cdn.pixabay.com/video/2024/02/15/200657-913478674_large.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/40 to-white dark:from-slate-950/90 dark:via-slate-950/40 dark:to-slate-950 pointer-events-none" />
                <div className="absolute inset-0 bg-blue-600/5 dark:bg-blue-500/5 pointer-events-none" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 pt-6">
                <Navbar />
            </div>
            
            {/* Hero Section */}
            <section className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center min-h-[80vh]">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in">
                    <Zap size={14} /> The Future of Personal Fitness
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                    Your Fitness Journey, <br />
                    <span className="text-blue-600 dark:text-blue-500">Elevated by AI.</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    FitTrack combines powerful tracking tools with cutting-edge AI to help you reach your goals faster. Personalized plans, smart insights, and detailed tracking—all in one minimalist package.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {user ? (
                        <Link to="/dashboard">
                            <Button className="h-14 px-8 rounded-xl text-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20">
                                Go to Dashboard <ArrowRight size={20} />
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link to="/signup">
                                <Button className="h-14 px-8 rounded-xl text-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20">
                                    Start Your Journey <ArrowRight size={20} />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button variant="outline" className="h-14 px-8 rounded-xl text-lg font-bold border-slate-200 dark:border-slate-800">
                                    Sign In
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </section>

            {/* Features Grid */}
            <section className="max-w-6xl mx-auto px-4 py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm transition-all hover:shadow-md">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                            <Dumbbell size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Smart Workouts</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                            Tailored workout plans designed specifically for your body, goals, and equipment. Adapt as you grow.
                        </p>
                    </div>
                    <div className="p-8 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm transition-all hover:shadow-md">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                            <Utensils size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">AI Nutrition</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                            Don't just track calories. Get personalized diet recommendations and meal options from our smart engine.
                        </p>
                    </div>
                    <div className="p-8 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm transition-all hover:shadow-md">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
                            <TrendingUp size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Progress Insights</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                            Deep analysis of your weight, calories, and performance. AI alerts for BMI and motivational reminders.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {!user && (
                <section className="max-w-6xl mx-auto px-4 py-20 mb-10">
                    <div className="p-12 rounded-3xl bg-blue-600 dark:bg-blue-500 text-center text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                            <Zap size={160} />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">Ready to transform your life?</h2>
                        <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto relative z-10">
                            Join thousands of users achieving their fitness goals with FitTrack's minimalist, AI-powered platform.
                        </p>
                        <Link to="/signup" className="relative z-10">
                            <button className="h-14 px-10 rounded-xl bg-white text-blue-600 font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg">
                                Create Your Free Account
                            </button>
                        </Link>
                    </div>
                </section>
            )}

            <footer className="max-w-6xl mx-auto px-4 py-10 border-t border-slate-200 dark:border-white/5 text-center">
                <p className="text-slate-500 text-sm">© 2026 FitTrack. Built for elite performance.</p>
            </footer>
        </div>
    );
};

export default Home;
