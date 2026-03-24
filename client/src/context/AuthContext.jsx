import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, restore user from localStorage
    useEffect(() => {
        const token = localStorage.getItem('fittrack_token');
        const storedUser = localStorage.getItem('fittrack_user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    // Sign up
    const signup = async (data) => {
        const res = await authAPI.signup(data);
        const { token, ...userData } = res.data;
        localStorage.setItem('fittrack_token', token);
        localStorage.setItem('fittrack_user', JSON.stringify(userData));
        setUser(userData);
        return res;
    };

    // Login
    const login = async (data) => {
        const res = await authAPI.login(data);
        const { token, ...userData } = res.data;
        localStorage.setItem('fittrack_token', token);
        localStorage.setItem('fittrack_user', JSON.stringify(userData));
        setUser(userData);
        return res;
    };

    // Logout
    const logout = () => {
        localStorage.removeItem('fittrack_token');
        localStorage.removeItem('fittrack_user');
        setUser(null);
    };

    // Update user state after profile changes
    const updateUser = (updatedData) => {
        const { token, ...userData } = updatedData;
        if (token) localStorage.setItem('fittrack_token', token);
        localStorage.setItem('fittrack_user', JSON.stringify(userData));
        setUser(userData);
    };

    // Used by OAuthCallback page to log in with a token received from server redirect
    const loginWithToken = (token, userData) => {
        localStorage.setItem('fittrack_token', token);
        localStorage.setItem('fittrack_user', JSON.stringify(userData));
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signup, login, logout, updateUser, loginWithToken }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for easy access
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export default AuthContext;
