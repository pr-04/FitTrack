import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

const backgrounds = {
    '/dashboard': 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80', // general gym
    '/workouts': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80', // weights/gym
    '/calories': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80', // healthy food
    '/weight': 'https://images.unsplash.com/photo-1526506114642-5406d2035e40?auto=format&fit=crop&q=80', // fitness/body
    '/profile': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80', // fitness profile
    '/login': 'https://images.unsplash.com/photo-1554284126-aa88f22d8b74?auto=format&fit=crop&q=80', // abstract fitness
    '/signup': 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&q=80', // indoor gym
    'default': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80'
};

const PageBackground = ({ children }) => {
    const location = useLocation();

    const bgImage = useMemo(() => {
        const path = location.pathname.toLowerCase();
        if (backgrounds[path]) return backgrounds[path];
        const match = Object.keys(backgrounds).find(key => path.startsWith(key) && key !== 'default');
        return match ? backgrounds[match] : backgrounds.default;
    }, [location.pathname]);

    return (
        <div className="relative min-h-screen w-full">
            <div
                className="fixed inset-0 -z-20 bg-cover bg-center transition-all duration-1000"
                style={{ backgroundImage: `url('${bgImage}')` }}
            />
            {/* Dark overlay to ensure text readability */}
            <div className="fixed inset-0 -z-10 bg-slate-100/40 dark:bg-black/70 backdrop-blur-[2px] transition-colors duration-500" />

            <div className="relative z-0 min-h-screen">
                {children}
            </div>
        </div>
    );
};

export default PageBackground;
