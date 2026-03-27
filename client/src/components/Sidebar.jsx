import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Dumbbell, Apple, Scale, User, LogOut, Zap, X, Sparkles
} from 'lucide-react';

const navItems = [
    { to: '/app/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/app/workouts', label: 'Workouts', icon: Dumbbell },
    { to: '/app/calories', label: 'Calories', icon: Apple },
    { to: '/app/weight', label: 'Weight', icon: Scale },
    { to: '/app/personalize-plan', label: 'Personalize Plan', icon: Sparkles },
    { to: '/app/profile', label: 'Profile', icon: User },
];

const Sidebar = ({ isOpen, onClose }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside
            className={`
        fixed inset-y-0 left-0 z-50 w-64 glass-panel border-slate-200/50 dark:border-white/5 shadow-md
        flex flex-col transform transition-all duration-300 ease-in-out
        lg:static lg:translate-x-0 lg:m-4 lg:rounded-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
        >
            {/* Logo */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                        <Zap size={18} className="text-white" />
                    </div>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                        FitTrack
                    </span>
                </div>
                <button onClick={onClose} className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                    <X size={22} />
                </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
              ${isActive
                                ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                            }`
                        }
                    >
                        <Icon size={18} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-white/30 dark:border-white/10">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium
                     text-slate-600 dark:text-slate-400 hover:text-accent-red dark:hover:text-accent-red hover:bg-accent-red/10 dark:hover:bg-accent-red/20 hover:border-accent-red/20 border border-transparent transition-all duration-200"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
