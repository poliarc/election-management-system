import axios from 'axios';
import { handleTokenExpiration } from '../utils/tokenValidator';

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
            // Handle unauthorized access - token expired or invalid
            handleTokenExpiration();
        }
        return Promise.reject(error);
    }
);