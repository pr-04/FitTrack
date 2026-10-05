import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Apple, LineChart, ArrowRight, Zap, Users, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUpVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const Landing = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen font-sans bg-slate-50 relative overflow-hidden text-slate-900">

            {/* Navbar */}
            <header
                className={`fixed top-0 w-full z-50 transition-all duration-300 ${
                    scrolled
                        ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 py-3'
                        : 'bg-transparent py-5'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center text-white">
                            <Dumbbell className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">FitTrack</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex items-center gap-6">
                            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Features</a>
                            <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">How it works</a>
                        </nav>
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="text-slate-700 hover:text-slate-900 font-semibold text-sm transition-colors px-3 py-2">Log in</Link>
                            <Link to="/signup" className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-xl text-sm font-semibold transition-colors shadow-sm">Get Started</Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-28 flex flex-col items-center text-center bg-white border-b border-slate-200">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUpVariant}
                    className="max-w-4xl mx-auto px-4 sm:px-6"
                >
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
                        Workout and meal plans <br className="hidden md:block" />
                        <span className="text-green-600">
                            built around your goal.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                        Set your preferences, get a custom 7-day workout plan and daily nutrition targets, then log your meals and workouts in one place.
                    </p>

                    <div className="flex justify-center items-center">
                        <Link to="/signup" className="bg-green-600 hover:bg-green-700 text-white font-semibold text-lg px-8 py-3.5 rounded-xl shadow-sm transition-colors inline-flex items-center">
                            Get started <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Features */}
            <section id="features" className="py-20 bg-slate-50 w-full">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUpVariant}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                >
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Features</h2>
                        <p className="text-slate-600 mt-2 font-medium">Everything you need to stay on track</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: <Zap className="w-6 h-6 text-green-600" />, title: 'AI Workout Plans', desc: 'Custom 7-day training routines built specifically around your primary goal and workout location.' },
                            { icon: <Apple className="w-6 h-6 text-green-600" />, title: 'Food & Nutrition Logging', desc: 'Log your daily meals with instant calorie and macronutrient estimates powered by Gemini.' },
                            { icon: <LineChart className="w-6 h-6 text-green-600" />, title: 'Progress Tracking', desc: 'Track your workouts, caloric performance, and biometric trends in one simple dashboard.' },
                        ].map((f, i) => (
                            <div key={i} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-6">
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                                <p className="text-slate-600 leading-relaxed font-medium text-sm">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 bg-white border-t border-slate-200 w-full">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUpVariant}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-14 text-center text-slate-900">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: 1, title: 'Create Your Profile', desc: 'Complete our simple onboarding to set your biometrics and goals.', icon: <Users className="w-6 h-6 text-green-600" /> },
                            { step: 2, title: 'Generate Your Plan', desc: 'Get a customized 7-day workout routine and daily nutrition targets.', icon: <Zap className="w-6 h-6 text-green-600" /> },
                            { step: 3, title: 'Log and Track', desc: 'Log your daily meals and exercises to stay on track toward your goal.', icon: <CheckCircle2 className="w-6 h-6 text-green-600" /> },
                        ].map((item, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-2xl p-8 border border-slate-200 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-lg font-bold text-slate-900 mb-6 shadow-sm">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed font-medium text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* CTA */}
            <section className="bg-slate-900 py-20 text-white w-full">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUpVariant}
                    className="max-w-3xl mx-auto text-center px-4"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to get started?</h2>
                    <p className="text-lg text-slate-300 mb-8 font-medium">Create your account to generate your workout and nutrition plans.</p>
                    <Link to="/signup" className="bg-green-600 hover:bg-green-700 text-white font-semibold text-lg py-3.5 px-8 rounded-xl transition-colors shadow-sm inline-flex items-center">
                        Get started <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-8 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white">
                            <Dumbbell className="w-4 h-4" />
                        </div>
                        <span className="text-lg font-bold text-slate-900">FitTrack</span>
                    </div>
                    <p className="text-slate-500 text-sm">© 2026 FitTrack</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
