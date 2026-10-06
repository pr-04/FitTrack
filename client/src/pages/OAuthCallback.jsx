import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';

/**
 * OAuthCallback — landing page after Google OAuth redirect.
 * URL: /oauth-callback?code=<authorization_code>
 *
 * Atomically exchanges the single-use authorization code for JWT token and user profile,
 * stores credentials in AuthContext, and redirects based on onboarding status.
 */
const OAuthCallback = () => {
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();
    const calledRef = useRef(false); // prevent double-call in React StrictMode

    useEffect(() => {
        if (calledRef.current) return;
        calledRef.current = true;

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (!code) {
            navigate('/login', { replace: true });
            return;
        }

        authAPI
            .exchangeOAuthCode(code)
            .then((res) => {
                const { token, ...userData } = res.data;
                loginWithToken(token, userData);
                if (userData.isOnboarded) {
                    navigate('/app/dashboard', { replace: true });
                } else {
                    navigate('/app/onboarding', { replace: true });
                }
            })
            .catch(() => {
                navigate('/login', { replace: true });
            });
    }, [navigate, loginWithToken]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-600 shadow-sm animate-pulse">
                <Zap size={28} className="text-white" />
            </div>
            <p className="text-slate-600 text-lg font-medium">Signing you in with Google…</p>
        </div>
    );
};

export default OAuthCallback;
