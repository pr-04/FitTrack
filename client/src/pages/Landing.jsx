import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Apple, LineChart, ArrowRight, Zap, Users, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' } }
};

const Landing = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen font-sans selection:bg-green-100 relative overflow-hidden text-gray-900">

            {/* ── Animated Background Blobs ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute top-[-15%] left-[-12%] w-[45%] h-[45%] rounded-full blur-[130px] animate-blob"
                    style={{ background: 'radial-gradient(circle, rgba(134,239,172,0.22) 0%, rgba(74,222,128,0.08) 70%)' }}
                />
                <div
                    className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full blur-[120px] animate-blob animation-delay-2000"
                    style={{ background: 'radial-gradient(circle, rgba(147,197,253,0.15) 0%, rgba(99,102,241,0.05) 70%)' }}
                />
                <div
                    className="absolute bottom-[5%] left-[20%] w-[30%] h-[30%] rounded-full blur-[100px] animate-blob animation-delay-4000"
                    style={{ background: 'radial-gradient(circle, rgba(167,243,208,0.18) 0%, rgba(16,185,129,0.06) 70%)' }}
                />
            </div>

            {/* ── Navbar ── */}
            <header
                style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                className={`fixed top-0 w-full z-50 transition-all duration-500 ${
                    scrolled
                        ? 'bg-white/75 shadow-[0_4px_24px_rgba(0,0,0,0.07)] border-b border-gray-200/50 py-3'
                        : 'bg-white/10 border-b border-transparent py-5'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-green-500/25">
                            <Dumbbell className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-gray-900 font-display">FitTrack</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex items-center gap-5">
                            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Features</a>
                            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">How it works</a>
                        </nav>
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Log in</Link>
                            <Link to="/signup" className="btn-primary py-2 px-5 rounded-full text-sm">Get Started</Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Hero ── */}
            <section
                className="relative pt-40 pb-24 lg:pt-60 lg:pb-32 flex flex-col items-center text-center overflow-hidden"
                style={{ background: 'linear-gradient(180deg, #F9FAFB 0%, #E6F4EA 100%)' }}
            >
                {/* Animated radial glow */}
                <motion.div
                    animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.65, 0.4] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-green-400/12 blur-[140px] rounded-full pointer-events-none"
                />

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUpVariant}
                    className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10"
                >
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-[1.15] font-display">
                        Workout and meal plans <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400 relative">
                            built around your goal.
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Tell us about yourself, get a 7-day workout plan and daily nutrition targets, then log your food and workouts in one place.
                    </p>

                    <div className="flex justify-center items-center">
                        <Link to="/signup" className="btn-primary text-xl px-10 py-5">
                            Get started <ArrowRight className="w-6 h-6 ml-2" />
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ── Features ── */}
            <section id="features" className="bg-white py-24 w-full relative z-10">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={fadeUpVariant}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                >
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold font-display">Tools for Your Journey</h2>
                        <div className="w-20 h-1.5 bg-primary mx-auto mt-6 rounded-full" />
                    </div>
                    <div className="grid md:grid-cols-3 gap-10">
                        {[
                            { icon: <Zap className="w-8 h-8 text-primary group-hover:text-white" />, bg: 'bg-green-50 group-hover:bg-primary', title: 'AI Workout Plans', desc: 'Custom 7-day training routines built specifically around your primary fitness goal and available equipment.' },
                            { icon: <Apple className="w-8 h-8 text-blue-500 group-hover:text-white" />, bg: 'bg-blue-50 group-hover:bg-blue-500', title: 'Food & Nutrition Logging', desc: 'Log your daily meals with instant calorie and macronutrient estimates powered by Gemini.' },
                            { icon: <LineChart className="w-8 h-8 text-purple-500 group-hover:text-white" />, bg: 'bg-purple-50 group-hover:bg-purple-500', title: 'Progress Tracking', desc: 'Track your workouts, caloric performance, and biometric trends across interactive charts.' },
                        ].map((f, i) => (
                            <div key={i} className="card-container p-10 group">
                                <div className={`w-16 h-16 ${f.bg} rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 shadow-sm`}>
                                    {f.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-4 font-display">{f.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-lg">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── How It Works ── */}
            <section id="how-it-works" className="bg-[#F3F4F6] py-24 w-full relative">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={fadeUpVariant}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-20 text-center font-display">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-16 relative">
                        <div className="hidden md:block absolute top-[40px] left-[10%] right-[10%] h-[2px] bg-gray-200 z-0" />
                        {[
                            { step: 1, title: 'Create Your Profile', desc: 'Complete our simple 4-step onboarding to set your goals and metrics.', icon: <Users /> },
                            { step: 2, title: 'Generate Your Plan', desc: 'Get a customized 7-day workout routine and daily nutrition blueprint.', icon: <Zap /> },
                            { step: 3, title: 'Log and Track', desc: 'Log your daily meals and exercises to stay on track toward your goal.', icon: <CheckCircle2 /> },
                        ].map((item, idx) => (
                            <div key={idx} className="relative z-10 flex flex-col items-center group">
                                <div className="w-20 h-20 bg-white border-2 border-gray-100 shadow-xl group-hover:border-primary group-hover:scale-110 transition-all duration-500 rounded-3xl flex items-center justify-center text-2xl font-bold text-gray-400 group-hover:text-primary mb-8 bg-gradient-to-br from-white to-gray-50">
                                    {item.step}
                                </div>
                                <h4 className="text-2xl font-bold mb-3 font-display">{item.title}</h4>
                                <p className="text-gray-500 text-center leading-relaxed text-lg max-w-xs">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── CTA ── */}
            <section className="bg-[#E5E7EB] py-24 w-full relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-slate-200/50 blur-[100px] pointer-events-none" />
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={fadeUpVariant}
                    className="max-w-4xl mx-auto text-center px-4 relative z-10"
                >
                    <h2 className="text-4xl md:text-6xl font-extrabold mb-8 text-gray-900 font-display">Ready to get started?</h2>
                    <p className="text-xl md:text-2xl text-gray-600 mb-10 font-medium">Create your account to get started.</p>
                    <Link to="/signup" className="btn-primary text-xl py-5 px-10 rounded-2xl inline-flex items-center">
                        Get started <ArrowRight className="w-6 h-6 ml-3" />
                    </Link>
                </motion.div>
            </section>

            {/* ── Footer ── */}
            <footer className="bg-white py-10 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold font-display">FitTrack</span>
                    </div>
                    <p className="text-gray-400 text-sm">© 2026 FitTrack</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
