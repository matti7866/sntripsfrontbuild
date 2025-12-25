import apiClient from './api';
import type {
  GmailEmail,
  EmailFilters,
  SendEmailRequest,
  EmailLabel,
  EmailStats
} from '../types/email';

const gmailService = {
  /**
   * Get emails from Gmail inbox
   */
  async getEmails(filters: EmailFilters = {}): Promise<{
    data: GmailEmail[];
    nextPageToken?: string;
    total?: number;
  }> {
    const response = await apiClient.post('/email/gmailController.php', {
      action: 'getEmails',
      ...filters
    });
    
    if (response.data.success) {
      return {
        data: response.data.data || [],
        nextPageToken: response.data.nextPageToken,
        total: response.data.resultSizeEstimate
      };
    }
    throw new Error(response.data.message || 'Failed to fetch emails');
  },

  /**
   * Get single email details
   */
  async getEmail(id: string): Promise<GmailEmail> {
    const response = await apiClient.post('/email/gmailController.php', {
      action: 'getEmail',
      id
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Email not found');
  },

  /**
   * Send email
   */
  async sendEmail(data: SendEmailRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post('/email/gmailController.php', {
      action: 'sendEmail',
      ...data
    });
    
    return {
      success: response.data.success,
      message: response.data.message || 'Email sent successfully'
    };
  },

  /**
   * Delete email (move to trash)
   */
  async deleteEmail(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post('/email/gmailController.php', {
      action: 'deleteEmail',
      id
    });
    
    return {
      success: response.data.success,
      message: response.data.message || 'Email deleted successfully'
    };
  },

  /**
   * Mark email as read
   */
  async markAsRead(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post('/email/gmailController.php', {
      action: 'markAsRead',
      id
    });
    
    return {
      success: response.data.success,
      message: response.data.message || 'Email marked as read'
    };
  },

  /**
   * Mark email as unread
   */
  async markAsUnread(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post('/email/gmailController.php', {
      action: 'markAsUnread',
      id
    });
    
    return {
      success: response.data.success,
      message: response.data.message || 'Email marked as unread'
    };
  },

  /**
   * Star email
   */
  async starEmail(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post('/email/gmailController.php', {
      action: 'starEmail',
      id
    });
    
    return {
      success: response.data.success,
      message: response.data.message || 'Email starred'
    };
  },

  /**
   * Unstar email
   */
  async unstarEmail(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post('/email/gmailController.php', {
      action: 'unstarEmail',
      id
    });
    
    return {
      success: response.data.success,
      message: response.data.message || 'Email unstarred'
    };
  },

  /**
   * Search emails
   */
  async searchEmails(query: string, limit: number = 50): Promise<{
    data: GmailEmail[];
    total?: number;
  }> {
    const response = await apiClient.post('/email/gmailController.php', {
      action: 'searchEmails',
      query,
      limit
    });
    
    if (response.data.success) {
      return {
        data: response.data.data || [],
        total: response.data.resultSizeEstimate
      };
    }
    throw new Error(response.data.message || 'Failed to search emails');
  }
};

export default gmailService;

