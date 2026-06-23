import axios from 'axios';
import { getSession, clearSession } from './configStore.js';

const apiClient = axios.create({
  baseURL: process.env.VAULTIX_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to dynamically attach auth token
apiClient.interceptors.request.use(
  (config) => {
    // Prefer environment variable (for CI/CD) then fallback to stored session
    const token = process.env.VAULTIX_TOKEN || getSession();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry / authorization errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearSession(); // Remove expired/invalid token
    }
    return Promise.reject(error);
  }
);

export default apiClient;
