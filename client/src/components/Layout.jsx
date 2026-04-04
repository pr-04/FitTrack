import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Dumbbell, Apple, LineChart, LayoutDashboard, User, Menu, X } from 'lucide-react';

const TopNav = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Close menu when resizing to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 640) setMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { path: '/app/dashboard', label: 'Home', icon: LayoutDashboard },
        { path: '/app/workout', label: 'Workout', icon: Dumbbell },
        { path: '/app/diet', label: 'Diet', icon: Apple },
        { path: '/app/tracker', label: 'Tracker', icon: LineChart },
        { path: '/app/profile', label: 'Profile', icon: User },
    ];

    return (
        <>
            <nav
                style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                className={`sticky top-0 z-50 transition-all duration-500 relative ${
                    scrolled || mobileMenuOpen
                        ? 'bg-white/90 border-b border-gray-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.07)]'
                        : 'bg-white/30 border-b border-transparent shadow-none'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-50">
                    <div className="flex justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link to="/app/dashboard" className="text-2xl font-bold text-green-500 tracking-tight">
                                FitTrack
                            </Link>
                        </div>

                        {/* Desktop nav items */}
                        <div className="hidden sm:flex sm:items-center sm:space-x-2">
                            {navItems.map((item) => {
                                const active = location.pathname.startsWith(item.path);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                            active
                                                ? 'bg-green-50 text-green-700 shadow-sm border border-green-100'
                                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/70'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 mr-2 ${active ? 'text-green-600' : 'text-gray-400'}`} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Right side: logout + hamburger */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleLogout}
                                className="text-gray-500 hover:text-red-500 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-red-50 transition-all duration-200"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:block">Logout</span>
                            </button>
                            {/* Hamburger — mobile only */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="sm:hidden p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                                aria-label="Toggle menu"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Backdrop Overlay */}
            <div 
                className={`sm:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
                    mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                style={{ 
                    top: '64px',
                    backgroundColor: 'rgba(0, 0, 0, 0.15)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
                }}
                onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile dropdown menu absolutely positioned overlay */}
            <div
                className={`sm:hidden fixed left-0 right-0 z-50 transition-all duration-300 ease-in-out origin-top ${
                    mobileMenuOpen ? 'scale-y-100 opacity-100 translate-y-0' : 'scale-y-95 opacity-0 -translate-y-2 pointer-events-none'
                }`}
                style={{ top: '64px' }}
            >
                <div className="bg-white/95 shadow-2xl border border-gray-100 px-4 py-4 m-4 rounded-2xl flex flex-col gap-2 relative">
                    {navItems.map((item) => {
                        const active = location.pathname.startsWith(item.path);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 ${
                                    active
                                        ? 'bg-green-50 text-green-700 border border-green-100 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-400'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

const Layout = () => {
    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans text-gray-900">
            <TopNav />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;

