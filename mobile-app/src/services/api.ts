import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from '../config/api';
import { STORAGE_KEYS } from '../config/constants';
import storage from '../utils/storage';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
});

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
  async (config) => {
        const token = await storage.get<string>(STORAGE_KEYS.TOKEN);
        if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Log detailed error for debugging
        if (error.response) {
          console.error('API Error:', {
            status: error.response.status,
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            fullURL: `${error.config?.baseURL}${error.config?.url}`,
            data: error.response.data,
          });
        } else if (error.request) {
          console.error('Network Error:', {
            url: error.config?.url,
            message: 'No response received from server',
          });
        }

        if (error.response?.status === 401) {
          // Token expired or invalid - clear auth and redirect to login
          await storage.remove(STORAGE_KEYS.TOKEN);
          await storage.remove(STORAGE_KEYS.USER);
          // You can trigger navigation to login here if needed
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }
}

export const api = new ApiService();
export default api;
