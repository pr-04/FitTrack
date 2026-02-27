import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, Bell } from 'lucide-react';

const pageTitles = {
    '/dashboard': { title: 'Home', subtitle: 'Welcome back! Here\'s your fitness overview.' },
    '/workouts': { title: 'Workouts', subtitle: 'Log and manage your training sessions.' },
    '/calories': { title: 'Calories', subtitle: 'Track your daily nutrition intake.' },
    '/weight': { title: 'Weight', subtitle: 'Monitor your weight progress over time.' },
    '/profile': { title: 'Profile', subtitle: 'Manage your personal information.' },
};

const Navbar = ({ onMenuClick }) => {
    const { user } = useAuth();
    const { pathname } = useLocation();
    const page = pageTitles[pathname] || { title: 'FitTrack', subtitle: '' };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    return (
        <header className="bg-dark-800/80 backdrop-blur border-b border-slate-700/50 px-4 md:px-6 py-4 flex items-center justify-between">
            {/* Left: hamburger + page title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden text-slate-400 hover:text-white transition-colors"
                >
                    <Menu size={22} />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-white">{page.title}</h1>
                    <p className="text-xs text-slate-400 hidden sm:block">{page.subtitle}</p>
                </div>
            </div>

            {/* Right: user info - clickable to profile */}
            <Link
                to="/profile"
                className="flex items-center gap-3 group transition-transform active:scale-95"
            >
                <div className="hidden sm:flex items-center gap-2 bg-dark-700/50 rounded-xl px-3 py-2 border border-transparent group-hover:border-slate-700 group-hover:bg-dark-700 transition-all">
                    <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-accent-blue/10">
                        {initials}
                    </div>
                    <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                        {user?.name || 'User'}
                    </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-accent-blue/10 sm:hidden">
                    {initials}
                </div>
            </Link>
        </header>
    );
};

export default Navbar;
