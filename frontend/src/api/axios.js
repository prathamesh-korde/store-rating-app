import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  // Removed withCredentials to rely purely on Authorization header for cross-domain auth
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT token from sessionStorage as Bearer header
// This is required for cross-origin deployments (Vercel frontend ↔ Render backend)
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto redirect on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local state and redirect to login
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
