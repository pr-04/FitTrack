import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach JWT token and time zone
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('fittrack_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        try {
            config.headers['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        } catch {
            config.headers['X-Timezone'] = 'UTC';
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/signup');
        if (error.response?.status === 401 && !isAuthRequest) {
            localStorage.removeItem('fittrack_token');
            localStorage.removeItem('fittrack_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ─── Auth ───
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    exchangeOAuthCode: (code) => api.post('/auth/oauth/exchange', { code })
};

// ─── User ───
export const userAPI = {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (data) => api.put('/user/profile', data),
    deleteProfile: () => api.delete('/user/profile')
};

// ─── Workouts ───
export const workoutAPI = {
    generate: (data) => api.post('/workout/generate', data),
    log: (data) => api.post('/workout/log', data),
    getHistory: () => api.get('/workout/history'),
    getRecentExercises: () => api.get('/workout/recent-exercises'),
    delete: (id) => api.delete(`/workout/history/${id}`),
};

// ─── Diet ───
export const dietAPI = {
    generate: (data) => api.post('/diet/generate', data),
    log: (data) => api.post('/diet/log', data),
    getHistory: () => api.get('/diet/history'),
    getRecentFoods: () => api.get('/diet/recent-foods'),
    lookup: (query) => api.get('/diet/lookup', { params: { query } }),
};

// ─── Tracker ───
export const trackerAPI = {
    getStats: () => api.get('/tracker'),
};

// ─── Dashboard ───
export const dashboardAPI = {
    getSummary: () => api.get('/dashboard'),
};

export default api;
