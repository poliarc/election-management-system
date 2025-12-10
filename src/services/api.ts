import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

// Configure axios instance with authentication
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

// Add auth token to all requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle response errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('auth_access_token');
            localStorage.removeItem('auth_refresh_token');
            localStorage.removeItem('auth_state');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);