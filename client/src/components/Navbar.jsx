import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import Button from './ui/Button';

const pageTitles = {
    '/': { title: 'FitTrack', subtitle: 'Start your fitness journey today.' },
    '/app/dashboard': { title: 'Home', subtitle: 'Welcome back! Here\'s your fitness overview.' },
    '/app/workouts': { title: 'Workouts', subtitle: 'Log and manage your training sessions.' },
    '/app/calories': { title: 'Calories', subtitle: 'Track your daily nutrition intake.' },
    '/app/weight': { title: 'Weight', subtitle: 'Monitor your weight progress over time.' },
    '/app/profile': { title: 'Profile', subtitle: 'Manage your personal information.' },
    '/app/personalize-plan': { title: 'Personalize Plan', subtitle: 'AI-tailored fitness and nutrition.' }
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
        <header className="px-4 md:px-6 py-4 flex items-center justify-between border border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl mb-8 z-50 sticky top-4 mx-1 shadow-sm">
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
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 transition-all text-slate-600 dark:text-slate-300 shadow-sm"
                    aria-label="Toggle theme"
                >
                    {isDarkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-blue-500" />}
                </button>

                {user ? (
                    <Link to="/app/profile" className="flex items-center gap-3 group transition-all">
                        <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2 border border-slate-200 dark:border-white/10 shadow-sm group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-all">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                {initials}
                            </div>
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                {user?.name || 'User'}
                            </span>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-sm font-bold text-white shadow-sm sm:hidden">
                            {initials}
                        </div>
                    </Link>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link to="/login">
                            <Button variant="outline" size="sm" className="hidden sm:block rounded-lg px-4 border-slate-200 dark:border-slate-800">Sign In</Button>
                        </Link>
                        <Link to="/signup">
                            <Button size="sm" className="rounded-lg px-4">Get Started</Button>
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;
