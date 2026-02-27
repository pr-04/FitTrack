import axios from 'axios';

// Create Axios instance with base URL from environment variable
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach JWT token from localStorage to every request
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

// Response interceptor — handle 401 globally (token expired)
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

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data),
};

// ─── Workouts ──────────────────────────────────────────────────────────────
export const workoutsAPI = {
    add: (data) => api.post('/workouts', data),
    getAll: () => api.get('/workouts'),
    delete: (id) => api.delete(`/workouts/${id}`),
};

// ─── Foods ─────────────────────────────────────────────────────────────────
export const foodsAPI = {
    add: (data) => api.post('/foods', data),
    getByDate: (date) => api.get(`/foods?date=${date}`),
    delete: (id) => api.delete(`/foods/${id}`),
    search: (query) => api.get(`/foods/search?query=${query}`),
    getMockFoods: () => api.get('/foods/mock'),
};

// ─── Weights ───────────────────────────────────────────────────────────────
export const weightsAPI = {
    add: (data) => api.post('/weights', data),
    getAll: () => api.get('/weights'),
};

export default api;
