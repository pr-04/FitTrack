import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

const backgrounds = {
    '/dashboard': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80', // gym atmosphere
    '/workouts': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80', // verified gym
    '/calories': 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&q=80', // fitness meal prep
    '/weight': 'https://images.unsplash.com/photo-1526506114642-5406d2035e40?auto=format&fit=crop&q=80', // verified fitness
    '/profile': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80', // gym profile
    '/personalize-plan': 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80', // planning
    '/login': 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&q=80', // entrance gym
    '/signup': 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&q=80', // modern gym
    'default': 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&q=80'
};

const PageBackground = ({ children }) => {
    const location = useLocation();

    const bgImage = useMemo(() => {
        const path = location.pathname.toLowerCase();
        const normalizedPath = '/' + path.split('/').filter(Boolean).join('/');
        
        return backgrounds[normalizedPath] || backgrounds.default;
    }, [location.pathname]);

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden transition-colors duration-700">
            {/* Background layers wrapper */}
            <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
                {/* Base Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
                    style={{ 
                        backgroundImage: `url('${bgImage}')`,
                        opacity: 0.15
                    }}
                />

                {/* Simple Overlay for Readability */}
                <div className="absolute inset-0 bg-slate-50/80 dark:bg-slate-950/90 backdrop-blur-sm transition-colors duration-300" />
            </div>

            {/* Content area */}
            <div className="relative z-10 min-h-screen">
                {children}
            </div>
        </div>
    );
};

export default PageBackground;
