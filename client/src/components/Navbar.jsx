import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, Bell, Sun, Moon } from 'lucide-react';

const pageTitles = {
    '/dashboard': { title: 'Home', subtitle: 'Welcome back! Here\'s your fitness overview.' },
    '/workouts': { title: 'Workouts', subtitle: 'Log and manage your training sessions.' },
    '/calories': { title: 'Calories', subtitle: 'Track your daily nutrition intake.' },
    '/weight': { title: 'Weight', subtitle: 'Monitor your weight progress over time.' },
    '/profile': { title: 'Profile', subtitle: 'Manage your personal information.' },
};

const Navbar = ({ onMenuClick }) => {
    const { user } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const { pathname } = useLocation();
    const page = pageTitles[pathname] || { title: 'FitTrack', subtitle: '' };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    return (
        <header className="glass-panel px-4 md:px-6 py-4 flex items-center justify-between rounded-[28px] mb-8 z-50 sticky top-4 mx-1">
            {/* Left: hamburger + page title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                    <Menu size={22} />
                </button>
                <div>
                    
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">{page.title}</h1>
                </div>
            </div>

            {/* Right: Actions and User Info */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-2xl bg-white/50 dark:bg-slate-800/10 hover:bg-white dark:hover:bg-slate-800 border border-white/60 dark:border-white/5 transition-all duration-300 text-slate-600 dark:text-slate-300 shadow-sm hover:shadow-lg active:scale-90"
                    aria-label="Toggle theme"
                >
                    {isDarkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-blue-500" />}
                </button>

                <Link to="/profile" className="flex items-center gap-3 group transition-transform active:scale-95">
                    <div className="hidden sm:flex items-center gap-2 bg-white/40 dark:bg-slate-800/40 rounded-xl px-3 py-2 border border-white/60 dark:border-white/10 shadow-sm group-hover:bg-white/80 dark:group-hover:bg-slate-700 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-accent-blue/20">
                            {initials}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            {user?.name || 'User'}
                        </span>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-accent-blue/20 sm:hidden">
                        {initials}
                    </div>
                </Link>
            </div>
        </header>
    );
};

export default Navbar;
