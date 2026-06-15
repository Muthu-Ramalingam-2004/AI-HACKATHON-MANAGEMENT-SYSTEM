import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error("Failed to fetch current user", error);
          logout();
        }
      }
      setIsLoading(false);
    };

    checkLoginStatus();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { access_token, refresh_token, role, name } = response.data;
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userName', name);

      // Get complete user object
      const userProfile = await api.get('/auth/me');
      setUser(userProfile.data);
      setIsLoading(false);
      return userProfile.data;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const registerUser = async (name, email, password, role, collegeId) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
        college_id: collegeId ? parseInt(collegeId) : null
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, registerUser, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
