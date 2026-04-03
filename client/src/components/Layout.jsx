import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Dumbbell, Apple, LineChart, LayoutDashboard, User } from 'lucide-react';

const TopNav = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
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
        <nav
            style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            className={`sticky top-0 z-50 transition-all duration-500 ${
                scrolled
                    ? 'bg-white/80 border-b border-gray-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.07)]'
                    : 'bg-white/30 border-b border-transparent shadow-none'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/app/dashboard" className="text-2xl font-bold text-green-500 tracking-tight">
                                FitTrack
                            </Link>
                        </div>
                        <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
                            {navItems.map((item) => {
                                const active = location.pathname.startsWith(item.path);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`inline-flex items-center px-3 my-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
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
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={handleLogout}
                            className="text-gray-500 hover:text-red-500 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-red-50 transition-all duration-200"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:block">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
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
