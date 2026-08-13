import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ayoola_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and verify authentication state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ayoola_token');
      if (storedToken) {
        try {
          const data = await authAPI.getCurrentUser();
          if (data.success && data.data?.user) {
            setUser(data.data.user);
            setToken(storedToken);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Authentication token verification failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Register method
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authAPI.register(userData);
      if (data.success && data.data?.token) {
        localStorage.setItem('ayoola_token', data.data.token);
        setToken(data.data.token);
        setUser(data.data.user);
      }
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Login method
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authAPI.login(credentials);
      if (data.success && data.data?.token) {
        localStorage.setItem('ayoola_token', data.data.token);
        setToken(data.data.token);
        setUser(data.data.user);
      }
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Logout method (secure client-side cleanup)
  const logout = () => {
    localStorage.removeItem('ayoola_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Update profile helper
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authAPI.updateProfile(profileData);
      if (data.success && data.data?.user) {
        setUser(data.data.user);
      }
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Derived auth state values
  const isAuthenticated = !!user && !!token;
  const role = user?.role || null;
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isSuperAdmin = role === 'superadmin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated,
        role,
        isAdmin,
        isSuperAdmin,
        login,
        register,
        logout,
        updateProfile,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for consuming AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
