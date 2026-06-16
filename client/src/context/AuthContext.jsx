import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check auth status on mount
  useEffect(() => {
    const token = localStorage.getItem('vaultix_token');
    if (token) {
      api
        .get('/auth/me')
        .then((res) => {
          setUser(res.data.data?.user || res.data.data || res.data.user || res.data);
        })
        .catch(() => {
          localStorage.removeItem('vaultix_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (name, email, password) => {
    try {
      setError(null);
      setLoading(true);
      const res = await api.post('/auth/signup', { name, email, password });
      const { token, user: userData } = res.data.data;
      localStorage.setItem('vaultix_token', token);
      setUser(userData);
      return userData;
    } catch (err) {
      const message =
        err.response?.data?.message || err.response?.data?.error || 'Signup failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      const { token, user: userData } = res.data.data;
      localStorage.setItem('vaultix_token', token);
      setUser(userData);
      return userData;
    } catch (err) {
      const message =
        err.response?.data?.message || err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('vaultix_token');
      setUser(null);
      setError(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    clearError,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
