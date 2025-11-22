import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/authService';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  sendOTP: (email: string) => Promise<{ success: boolean; message?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        // Try to get stored user first (for dev mode)
        const storedUser = await authService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ username: email, password });
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (error: any) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const sendOTP = async (email: string) => {
    return await authService.sendOTP(email);
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const response = await authService.verifyOTP(email, otp);
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (error: any) {
      return { success: false, message: error.message || 'OTP verification failed' };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const currentUser = await authService.getStoredUser();
    setUser(currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        sendOTP,
        verifyOTP,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

