import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Dumbbell, Apple, Scale, User, LogOut, Zap, X, Sparkles
} from 'lucide-react';

const navItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/workouts', label: 'Workouts', icon: Dumbbell },
    { to: '/calories', label: 'Calories', icon: Apple },
    { to: '/weight', label: 'Weight', icon: Scale },
    { to: '/personalize-plan', label: 'Personalize Plan', icon: Sparkles },
    { to: '/profile', label: 'Profile', icon: User },
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
        fixed inset-y-0 left-0 z-50 w-64 glass-panel border-white/5 shadow-2xl
        flex flex-col transform transition-all duration-500 ease-in-out
        lg:static lg:translate-x-0 lg:m-4 lg:rounded-[32px]
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
        >
            {/* Logo */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/30 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-brand shadow-lg shadow-accent-blue/20 flex items-center justify-center">
                        <Zap size={20} className="text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
                        FitTrack
                    </span>
                </div>
                <button onClick={onClose} className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                    <X size={22} />
                </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border
              ${isActive
                                ? 'bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-white border-white/60 dark:border-white/20 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40 border-transparent'
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
