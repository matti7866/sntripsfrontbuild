import api from './api';
import config from '../utils/config';
import axios from 'axios';

export interface Settings {
  ev_status?: string;
  ev_url?: string;
  ev_api_key?: string;
  ev_instance?: string;
  whatsapp_api_provider?: string; // 'meta', 'ev', or 'etisalat'
  whatsapp_api_enabled?: string;
  meta_app_id?: string;
  meta_app_secret?: string;
  meta_access_token?: string;
  meta_phone_number_id?: string;
  meta_business_account_id?: string;
  meta_api_version?: string;
  etisalat_whatsapp_api_url?: string;
  etisalat_whatsapp_username?: string;
  etisalat_whatsapp_password?: string;
  etisalat_whatsapp_client_id?: string;
  etisalat_whatsapp_secret_id?: string;
  etisalat_whatsapp_sender_id?: string;
  ai_parsing_enabled?: string;
  openai_api_key?: string;
  ai_model?: string;
  sms_api_enabled?: string;
  sms_api_url?: string;
  sms_api_username?: string;
  sms_api_password?: string;
  sms_api_client_id?: string;
  sms_api_secret_id?: string;
  sms_sender_id?: string;
}

export interface EvStatusResponse {
  status: string;
  data: {
    apiStatus: string;
    instanceStatus: string;
  };
}

export interface TestConnectionResponse {
  status: string;
  message: string;
}

class SettingsService {
  private getFormData(data: any): FormData {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  }

  async getSettings(): Promise<Settings> {
    // Load settings from PHP backend
    const formData = this.getFormData({ action: 'getSettings' });
    const response = await axios.post<{ status: string; settings: Settings }>(
      `${config.baseUrl}/settingsController.php`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data.settings || {};
  }

  async saveWhatsAppSettings(settings: Partial<Settings>): Promise<{ status: string; message: string }> {
    const formData = this.getFormData({
      action: 'saveSettings',
      ...Object.keys(settings).reduce((acc, key) => {
        acc[`settings[${key}]`] = settings[key as keyof Settings];
        return acc;
      }, {} as any)
    });
    const response = await axios.post<{ status: string; message: string }>(
      `${config.baseUrl}/settingsController.php`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  }

  async saveMetaWhatsAppSettings(settings: Partial<Settings>): Promise<{ status: string; message: string }> {
    const formData = this.getFormData({
      action: 'saveMetaWhatsAppSettings',
      ...Object.keys(settings).reduce((acc, key) => {
        acc[`settings[${key}]`] = settings[key as keyof Settings];
        return acc;
      }, {} as any)
    });
    const response = await axios.post<{ status: string; message: string }>(
      `${config.baseUrl}/settingsController.php`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  }

  async saveEtisalatWhatsAppSettings(settings: Partial<Settings>): Promise<{ status: string; message: string }> {
    const formData = this.getFormData({
      action: 'saveEtisalatWhatsAppSettings',
      ...Object.keys(settings).reduce((acc, key) => {
        acc[`settings[${key}]`] = settings[key as keyof Settings];
        return acc;
      }, {} as any)
    });
    const response = await axios.post<{ status: string; message: string }>(
      `${config.baseUrl}/settingsController.php`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  }

  async testMetaWhatsAppConnection(accessToken: string, phoneNumberId: string): Promise<TestConnectionResponse> {
    const formData = this.getFormData({
      action: 'testMetaWhatsAppConnection',
      access_token: accessToken,
      phone_number_id: phoneNumberId
    });
    const response = await axios.post<TestConnectionResponse>(
      `${config.baseUrl}/settingsController.php`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  }

  async saveOpenAISettings(settings: Partial<Settings>): Promise<{ status: string; message: string }> {
    const formData = this.getFormData({
      action: 'saveOpenAISettings',
      ...Object.keys(settings).reduce((acc, key) => {
        acc[`settings[${key}]`] = settings[key as keyof Settings];
        return acc;
      }, {} as any)
    });
    const response = await axios.post<{ status: string; message: string }>(
      `${config.baseUrl}/settingsController.php`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  }

  async saveSMSSettings(settings: Partial<Settings>): Promise<{ status: string; message: string }> {
    const formData = this.getFormData({
      action: 'saveSMSSettings',
      ...Object.keys(settings).reduce((acc, key) => {
        acc[`settings[${key}]`] = settings[key as keyof Settings];
        return acc;
      }, {} as any)
    });
    const response = await axios.post<{ status: string; message: string }>(
      `${config.baseUrl}/settingsController.php`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  }

  async getEvStatus(): Promise<EvStatusResponse> {
    const formData = this.getFormData({ action: 'loadEvStatus' });
    const response = await axios.post<EvStatusResponse>(
      `${config.baseUrl}/settingsController.php`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  }

  async testOpenAIConnection(apiKey: string): Promise<TestConnectionResponse> {
    const formData = this.getFormData({
      action: 'testOpenAIConnection',
      api_key: apiKey
    });
    const response = await axios.post<TestConnectionResponse>(
      `${config.baseUrl}/settingsController.php`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  }

  async testSMSConnection(apiUrl: string, username: string, password: string, clientId?: string, secretId?: string): Promise<TestConnectionResponse> {
    const formData = this.getFormData({
      action: 'testSMSConnection',
      api_url: apiUrl,
      username,
      password,
      client_id: clientId || '',
      secret_id: secretId || ''
    });
    const response = await axios.post<TestConnectionResponse>(
      `${config.baseUrl}/settingsController.php`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  }

  async sendEtisalatWhatsApp(phoneNumber: string, message: string): Promise<{ status: string; message: string; data?: any }> {
    const formData = this.getFormData({
      action: 'sendEtisalatWhatsApp',
      phone_number: phoneNumber,
      message: message
    });
    const response = await axios.post<{ status: string; message: string; data?: any }>(
      `${config.baseUrl}/settingsController.php`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  }
}

export const settingsService = new SettingsService();

