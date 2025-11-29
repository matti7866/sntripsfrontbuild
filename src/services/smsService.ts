const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const smsService = {
  sendSms: async (data: any): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-sms-send.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: 'SMS sent successfully',
        data: result,
      };
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        message: error.message || 'Failed to send SMS',
      };
    }
  },
};
