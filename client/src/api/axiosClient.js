import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campushire_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors cleanly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // On 401 Unauthorized, clear auth tokens and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('campushire_token');
      // If we are not already on the login or register page, redirect with a notice
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login?expired=true';
      }
    }

    const customError = {
      message: error.response?.data?.message || 'Something went wrong. Please try again.',
      errors: error.response?.data?.errors || null,
      status: error.response?.status || 500,
    };
    return Promise.reject(customError);
  }
);

export default api;

