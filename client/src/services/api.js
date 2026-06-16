import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// To prevent infinite loops or race conditions if multiple requests fail at 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vaultix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 unauthorized and auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid intercepting 401s from the refresh endpoint itself
    if (error.response?.status === 401 && originalRequest.url !== '/auth/refresh') {
      if (!originalRequest._retry) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = 'Bearer ' + token;
              return api(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt to refresh the session
          const { data } = await axios.post('/api/v1/auth/refresh', {}, {
            withCredentials: true // Important for sending the HttpOnly refresh token cookie
          });
          
          const newToken = data.data.token;
          localStorage.setItem('vaultix_token', newToken);

          processQueue(null, newToken);
          
          originalRequest.headers.Authorization = 'Bearer ' + newToken;
          return api(originalRequest);
        } catch (err) {
          processQueue(err, null);
          localStorage.removeItem('vaultix_token');
          // Only redirect if not already on auth pages
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/signup') {
            window.location.href = '/login';
          }
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
