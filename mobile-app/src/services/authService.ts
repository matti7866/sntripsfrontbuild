import api from './api';
import storage from '../utils/storage';
import { STORAGE_KEYS } from '../config/constants';
import type { LoginResponse, OTPResponse, User } from '../types';

class AuthService {
  async sendOTP(email: string): Promise<OTPResponse> {
    try {
      const response = await api.post<OTPResponse>('/auth/send-otp.php', { email });
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  }

  async verifyOTP(email: string, otp: string): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/verify-otp.php', {
        email,
        otp,
      });

      if (response.success && response.token && response.user) {
        await storage.set(STORAGE_KEYS.TOKEN, response.token);
        await storage.set(STORAGE_KEYS.USER, response.user);
      }

      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'OTP verification failed',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout.php');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await storage.remove(STORAGE_KEYS.TOKEN);
      await storage.remove(STORAGE_KEYS.USER);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await storage.get<User>(STORAGE_KEYS.USER);
      if (!user) return null;

      // Optionally verify token with backend
      const response = await api.get<{ success: boolean; user: User }>('/auth/me.php');
      if (response.success && response.user) {
        await storage.set(STORAGE_KEYS.USER, response.user);
        return response.user;
      }

      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      await this.clearAuth();
      return null;
    }
  }

  async getStoredUser(): Promise<User | null> {
    return await storage.get<User>(STORAGE_KEYS.USER);
  }

  async getToken(): Promise<string | null> {
    return await storage.get<string>(STORAGE_KEYS.TOKEN);
  }

  async clearAuth(): Promise<void> {
    await storage.remove(STORAGE_KEYS.TOKEN);
    await storage.remove(STORAGE_KEYS.USER);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export const authService = new AuthService();
export default authService;
