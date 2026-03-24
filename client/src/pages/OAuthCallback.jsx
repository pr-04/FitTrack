import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';

/**
 * OAuthCallback — landing page after Google OAuth redirect.
 * URL: /oauth-callback?token=<jwt>
 *
 * Reads the token from the query string, fetches the user profile
 * from the server, stores everything in AuthContext, then redirects
 * to the dashboard.
 */
const OAuthCallback = () => {
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();
    const calledRef = useRef(false); // prevent double-call in StrictMode

    useEffect(() => {
        if (calledRef.current) return;
        calledRef.current = true;

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (!token) {
            navigate('/login');
            return;
        }

        authAPI
            .getMeWithToken(token)
            .then((res) => {
                loginWithToken(token, res.data);
                navigate('/dashboard', { replace: true });
            })
            .catch(() => {
                navigate('/login');
            });
    }, [navigate, loginWithToken]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-dark-900">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-brand shadow-lg shadow-accent-blue/30 animate-pulse">
                <Zap size={28} className="text-white" />
            </div>
            <p className="text-slate-400 text-lg">Signing you in with Google…</p>
        </div>
    );
};

export default OAuthCallback;
