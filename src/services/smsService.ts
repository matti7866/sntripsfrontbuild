import apiClient from './api';

export interface SMSThread {
  thread_id: string;
  phone_number: string;
  contact_name: string | null;
  latest_message: string;
  latest_timestamp: number;
  latest_direction: 'incoming' | 'outgoing';
  unread: boolean;
}

export interface SMSMessage {
  id: string;
  body: string;
  direction: 'incoming' | 'outgoing';
  timestamp: number;
  thread_id: string;
}

export interface PushbulletDevice {
  iden: string;
  nickname: string;
  manufacturer: string;
  model: string;
  active: boolean;
  pushable: boolean;
  has_sms?: boolean | string;
}

const smsService = {
  /**
   * Get all SMS threads (conversations)
   */
  async getThreads(limit: number = 20): Promise<SMSThread[]> {
    const response = await apiClient.get(`/sms/pushbullet.php?action=getThreads&limit=${limit}`);
    return response.data.success ? response.data.data : [];
  },

  /**
   * Get SMS threads for a specific device
   */
  async getSMSThreads(deviceIden: string, limit: number = 50): Promise<SMSThread[]> {
    const response = await apiClient.get(`/sms/pushbullet.php?action=getSMSThreads&device_iden=${deviceIden}&limit=${limit}`);
    return response.data.success ? response.data.data : [];
  },

  /**
   * Get messages from a specific thread on a device
   */
  async getMessages(deviceIden: string, threadId: string): Promise<any> {
    const response = await apiClient.get(`/sms/pushbullet.php?action=getMessages&device_iden=${deviceIden}&thread_id=${encodeURIComponent(threadId)}`);
    return response.data.success ? response.data.data : null;
  },

  /**
   * Send SMS
   */
  async sendSMS(deviceIden: string, phoneNumber: string, message: string): Promise<boolean> {
    const response = await apiClient.post('/sms/pushbullet.php?action=sendSMS', {
      device_iden: deviceIden,
      phone_number: phoneNumber,
      message: message
    });
    return response.data.success;
  },

  /**
   * Get available devices
   */
  async getDevices(): Promise<PushbulletDevice[]> {
    const response = await apiClient.get('/sms/pushbullet.php?action=getDevices');
    return response.data.success ? response.data.data : [];
  },

  /**
   * Format timestamp to readable date/time
   */
  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

export default smsService;
