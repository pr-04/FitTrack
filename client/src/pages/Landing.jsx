import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Apple, LineChart, ArrowRight, Star, Zap, Shield, Users } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' } }
};

/* ---------- Count-Up Component ---------- */
const Counter = ({ from = 0, to, suffix = '', duration = 2, decimals = 0 }) => {
    const count = useMotionValue(from);
    const rounded = useTransform(count, (v) =>
        decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString()
    );
    const [display, setDisplay] = useState(from.toLocaleString());
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    animate(count, to, { duration, ease: 'easeOut' });
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [count, to, duration]);

    useEffect(() => {
        const unsub = rounded.on('change', setDisplay);
        return unsub;
    }, [rounded]);

    return <span ref={ref}>{display}{suffix}</span>;
};

const Landing = () => {
    const [scrolled, setScrolled] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatDate = (date) =>
        new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(date);

    const formatTimePart = (date) =>
        new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(date);

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
                className="relative pt-40 pb-24 lg:pt-60 lg:pb-40 flex flex-col items-center text-center overflow-hidden"
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
                    {/* Live clock badge */}
                    <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md border border-white/50 px-4 py-2 rounded-full shadow-sm mb-10 cursor-default">
                        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-semibold tracking-wide uppercase flex items-center gap-1.5">
                            <span className="text-gray-700">{formatDate(currentTime)}</span>
                            <span className="text-primary/80 font-mono">{formatTimePart(currentTime)}</span>
                        </span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-gray-900 mb-8 leading-[1.1] font-display">
                        The Future of <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400 relative">
                            Personal Fitness.
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Experience a premium, AI-driven journey tailored to your unique biology and goals.
                        Join the next generation of digital wellness.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <Link to="/signup" className="btn-primary text-xl px-10 py-5">
                            Start Your Transformation <ArrowRight className="w-6 h-6 ml-2" />
                        </Link>
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-11 h-11 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-sm">
                                    <img src={`https://i.pravatar.cc/150?u=fittrack${i}`} alt="user" className="w-full h-full object-cover" />
                                </div>
                            ))}
                            <div className="w-11 h-11 rounded-full border-4 border-white bg-gray-900 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                +10k
                            </div>
                        </div>
                    </div>

                    {/* ── Animated Stats Row ── */}
                    <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-12 max-w-4xl mx-auto border-t border-gray-200/60 pt-16">
                        {[
                            { to: 10000, suffix: '+', label: 'Active Users' },
                            { to: 95, suffix: '%', label: 'Success Rate' },
                            { to: 5, suffix: 'M+', label: 'Workouts' },
                            { to: 24, suffix: '/7', label: 'AI Coaching' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                            >
                                <p className="text-4xl font-extrabold text-gray-900 font-display">
                                    <Counter to={stat.to} suffix={stat.suffix} duration={1.8 + i * 0.1} />
                                </p>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mt-2">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── Features ── */}
            <section id="features" className="bg-white py-32 w-full relative z-10">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={fadeUpVariant}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                >
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-5xl font-bold font-display">Premium Tools, Real Results</h2>
                        <div className="w-20 h-1.5 bg-primary mx-auto mt-6 rounded-full" />
                    </div>
                    <div className="grid md:grid-cols-3 gap-10">
                        {[
                            { icon: <Zap className="w-8 h-8 text-primary group-hover:text-white" />, bg: 'bg-green-50 group-hover:bg-primary', title: 'Gemini-Driven Workouts', desc: 'Hyper-personalized routines that adapt to your progress, equipment, and schedule in real-time.' },
                            { icon: <Apple className="w-8 h-8 text-blue-500 group-hover:text-white" />, bg: 'bg-blue-50 group-hover:bg-blue-500', title: 'Elite Nutritional AI', desc: 'Macro-precise meal plans designed by AI to fuel your specific goals without sacrificing flavor.' },
                            { icon: <LineChart className="w-8 h-8 text-purple-500 group-hover:text-white" />, bg: 'bg-purple-50 group-hover:bg-purple-500', title: 'Live Progress DNA', desc: 'Visual data layers that track your evolution through high-performance charts and predictive analytics.' },
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
            <section id="how-it-works" className="bg-[#F3F4F6] py-32 w-full relative">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={fadeUpVariant}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-24 text-center font-display">Your Path to Excellence</h2>
                    <div className="grid md:grid-cols-3 gap-16 relative">
                        <div className="hidden md:block absolute top-[40px] left-[10%] right-[10%] h-[2px] bg-gray-200 z-0" />
                        {[
                            { step: 1, title: 'Intelligent Onboarding', desc: 'Sync your biometrics and goals through our seamless 4-step profiling.', icon: <Users /> },
                            { step: 2, title: 'AI Architecture', desc: 'Gemini AI constructs your bespoke training and nutritional roadmap.', icon: <Zap /> },
                            { step: 3, title: 'Dynamic Evolution', desc: 'Log, track, and watch as your plans adapt to your increasing strength.', icon: <TrendingUp /> },
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

            {/* ── Testimonial ── */}
            <section className="py-40 w-full relative flex items-center justify-center overflow-hidden" style={{ background: '#ECFDF5' }}>
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#059669 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={fadeUpVariant}
                    className="max-w-5xl mx-auto px-4 w-full relative z-10"
                >
                    <div className="bg-white/90 backdrop-blur-2xl p-16 md:p-24 rounded-[40px] text-center relative border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
                        <div className="flex justify-center mb-10 text-yellow-400 gap-1">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-8 h-8 fill-current" />)}
                        </div>
                        <h3 className="text-3xl md:text-5xl font-medium leading-[1.3] mb-12 text-gray-900 font-display italic">
                            "FitTrack is not just an app; it's a high-performance partner. The AI adapts faster than I do, and the interface is purely therapeutic."
                        </h3>
                        <div className="flex items-center justify-center gap-6">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg transform rotate-3">
                                <img src="https://i.pravatar.cc/150?u=alex" alt="Alex" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                                <p className="text-xl font-bold text-gray-900 font-display">Alex Jenkins</p>
                                <p className="text-gray-500 font-medium">Professional Athlete • Lost 15kg</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ── CTA ── */}
            <section className="bg-[#E5E7EB] py-32 w-full relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-slate-200/50 blur-[100px] pointer-events-none" />
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={fadeUpVariant}
                    className="max-w-4xl mx-auto text-center px-4 relative z-10"
                >
                    <h2 className="text-5xl md:text-7xl font-extrabold mb-10 text-gray-900 font-display">Ready for the Next Level?</h2>
                    <p className="text-xl md:text-2xl text-gray-600 mb-12 font-medium">Join 10,000+ athletes who switched to the AI premium experience.</p>
                    <Link to="/signup" className="btn-primary text-2xl py-6 px-12 rounded-2xl inline-flex items-center">
                        Secure Your Session <ArrowRight className="w-7 h-7 ml-3" />
                    </Link>
                </motion.div>
            </section>

            {/* ── Footer ── */}
            <footer className="bg-white py-12 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold font-display">FitTrack</span>
                    </div>
                    <p className="text-gray-400 text-sm">© 2026 FitTrack SaaS. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Shield className="w-5 h-5" /></a>
                        <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Star className="w-5 h-5" /></a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const TrendingUp = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

export default Landing;
