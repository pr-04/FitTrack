import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Dumbbell, Apple, Scale, User, LogOut, Zap, X
} from 'lucide-react';

const navItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/workouts', label: 'Workouts', icon: Dumbbell },
    { to: '/calories', label: 'Calories', icon: Apple },
    { to: '/weight', label: 'Weight', icon: Scale },
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
        fixed inset-y-0 left-0 z-30 w-64 bg-dark-800 border-r border-slate-700/50
        flex flex-col transform transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0 lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
        >
            {/* Logo */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/50">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                        <Zap size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
                        FitTrack
                    </span>
                </div>
                <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                                ? 'bg-gradient-to-r from-accent-blue/20 to-accent-purple/20 text-white border border-accent-blue/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`
                        }
                    >
                        <Icon size={18} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-slate-700/50">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium
                     text-slate-400 hover:text-accent-red hover:bg-accent-red/10 transition-all duration-200"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
