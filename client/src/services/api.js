import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('fittrack_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('fittrack_token');
            localStorage.removeItem('fittrack_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ─── Auth ───
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data)
};

// ─── User ───
export const userAPI = {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (data) => api.put('/user/update', data),
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
    lookup: (query) => api.get(`/diet/lookup?query=${query}`),
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
