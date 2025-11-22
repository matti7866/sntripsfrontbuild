import { api } from './api';
import type { LoginCredentials, LoginResponse, User } from '../types';
import storage from '../utils/storage';
import { STORAGE_KEYS } from '../config/api';

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Check if it's OTP login (password is actually OTP)
      if (credentials.password && credentials.password.length === 6 && /^\d+$/.test(credentials.password)) {
        // OTP login
        const response = await api.post<LoginResponse>('/auth/verify-otp.php', {
          email: credentials.username,
          otp: credentials.password
        });
        
        if (response.success && response.token && response.user) {
          await storage.set(STORAGE_KEYS.token, response.token);
          await storage.set(STORAGE_KEYS.user, response.user);
        }
        
        return response;
      } else {
        // Regular password login (fallback)
        const response = await api.post<LoginResponse>('/auth/login.php', credentials);
        
        if (response.success && response.token && response.user) {
          await storage.set(STORAGE_KEYS.token, response.token);
          await storage.set(STORAGE_KEYS.user, response.user);
        }
        
        return response;
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  }
  
  async sendOTP(email: string): Promise<{ success: boolean; message: string; staff?: { name: string; picture?: string } }> {
    try {
      const response = await api.post<{ success: boolean; message: string; staff?: { name: string; picture?: string } }>('/auth/send-otp.php', {
        email
      });
      return response;
    } catch (error: any) {
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error ||
        error.message || 
        'Failed to send OTP';
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
  
  async verifyOTP(email: string, otp: string): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/verify-otp.php', {
        email,
        otp
      });
      
      if (response.success && response.token && response.user) {
        await storage.set(STORAGE_KEYS.token, response.token);
        await storage.set(STORAGE_KEYS.user, response.user);
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
      await storage.remove(STORAGE_KEYS.token);
      await storage.remove(STORAGE_KEYS.user);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await storage.get<User>(STORAGE_KEYS.user);
      if (!user) return null;

      // Development mode: Just return stored user without API verification
      // This prevents 404 errors when backend endpoints don't exist yet
      return user;
      
      // Production code (uncomment when backend is ready):
      // try {
      //   const response = await api.get<{ success: boolean; user: User }>('/auth/me.php');
      //   if (response.success && response.user) {
      //     await storage.set(STORAGE_KEYS.user, response.user);
      //     return response.user;
      //   }
      // } catch (apiError) {
      //   console.log('API verification failed, using stored user');
      // }
      // return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async verifyToken(): Promise<boolean> {
    try {
      const token = await storage.get<string>(STORAGE_KEYS.token);
      if (!token) return false;

      // Development mode: Just check token exists
      return true;
      
      // Production code (uncomment when backend is ready):
      // try {
      //   const response = await api.get<{ success: boolean }>('/auth/verify.php');
      //   return response.success;
      // } catch (error) {
      //   return false;
      // }
    } catch (error) {
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    return await storage.get<string>(STORAGE_KEYS.token);
  }

  async getStoredUser(): Promise<User | null> {
    return await storage.get<User>(STORAGE_KEYS.user);
  }

  async clearAuth(): Promise<void> {
    await storage.remove(STORAGE_KEYS.token);
    await storage.remove(STORAGE_KEYS.user);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export const authService = new AuthService();
export default authService;

