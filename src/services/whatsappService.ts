/**
 * WhatsApp Service
 * Frontend service for sending WhatsApp messages via Twilio
 */

const WHATSAPP_API_URL = '/api/whatsapp-api.php';

export interface WhatsAppResponse {
  success: boolean;
  message_sid?: string;
  status?: string;
  to?: string;
  error?: string;
}

export interface AuthCodeParams {
  to: string;
  code: string | number;
}

export interface CustomTemplateParams {
  to: string;
  template_sid: string;
  variables?: Record<string, string>;
}

/**
 * Send authentication/OTP code via WhatsApp
 * Uses approved template: "{{1}} is your verification code. For your security, do not share this code."
 */
export const sendAuthCode = async (
  params: AuthCodeParams
): Promise<WhatsAppResponse> => {
  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'auth_code',
        ...params,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('WhatsApp auth code error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
    };
  }
};

/**
 * Send custom template message via WhatsApp
 */
export const sendCustomTemplate = async (
  params: CustomTemplateParams
): Promise<WhatsAppResponse> => {
  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'custom_template',
        ...params,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('WhatsApp custom template error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
    };
  }
};

/**
 * Test WhatsApp API connection
 */
export const testWhatsAppAPI = async (): Promise<WhatsAppResponse> => {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}?test=1`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('WhatsApp API test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to WhatsApp API',
    };
  }
};

/**
 * Format phone number for WhatsApp (ensure it has country code)
 */
export const formatPhoneForWhatsApp = (phone: string, defaultCountryCode = '971'): string => {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add default country code if not present
  if (!cleaned.startsWith(defaultCountryCode)) {
    cleaned = defaultCountryCode + cleaned;
  }
  
  return '+' + cleaned;
};

/**
 * Generate a random OTP code
 */
export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

export default {
  sendAuthCode,
  sendCustomTemplate,
  testWhatsAppAPI,
  formatPhoneForWhatsApp,
  generateOTP,
};
