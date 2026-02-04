import axios from './api';

const API_BASE_URL = '/sms/twilioController.php';

export interface SendSMSRequest {
  to: string;
  message: string;
}

export interface SMSResponse {
  success: boolean;
  message: string;
  provider?: string;
  message_sid?: string;
  to?: string;
}

/**
 * Send SMS via Twilio
 */
export const sendSMS = async (data: SendSMSRequest): Promise<SMSResponse> => {
  try {
    console.log('📱 Sending Twilio SMS to:', data.to);
    const response = await axios.post(API_BASE_URL, {
      action: 'sendSMS',
      ...data
    });
    console.log('✅ Twilio SMS sent successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Twilio SMS error:', error);
    console.error('Error details:', error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send SMS'
    };
  }
};

/**
 * Test Twilio connection
 */
export const testConnection = async (): Promise<SMSResponse> => {
  try {
    const response = await axios.post(API_BASE_URL, {
      action: 'testConnection'
    });
    return response.data;
  } catch (error: any) {
    console.error('Twilio connection test error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Connection test failed'
    };
  }
};

/**
 * Send payment confirmation SMS
 */
export const sendPaymentConfirmationSMS = async (
  phoneNumber: string,
  customerName: string,
  amount: number,
  currency: string = 'AED'
): Promise<SMSResponse> => {
  const message = `Dear ${customerName}, your payment of ${amount.toFixed(2)} ${currency} has been received successfully. Thank you for choosing SN Travels & Tourism.`;
  
  return sendSMS({
    to: phoneNumber,
    message
  });
};

/**
 * Send visa payment confirmation SMS
 */
export const sendVisaPaymentSMS = async (
  phoneNumber: string,
  customerName: string,
  amount: number,
  referenceId: string
): Promise<SMSResponse> => {
  const message = `Dear ${customerName}, your visa payment of ${amount.toFixed(2)} AED (Ref: #${referenceId}) has been confirmed. Thank you! - SN Travels`;
  
  return sendSMS({
    to: phoneNumber,
    message
  });
};

/**
 * Send booking confirmation SMS
 */
export const sendBookingConfirmationSMS = async (
  phoneNumber: string,
  customerName: string,
  bookingNumber: string,
  service: string
): Promise<SMSResponse> => {
  const message = `Dear ${customerName}, your booking #${bookingNumber} for ${service} is confirmed. Thank you! - SN Travels`;
  
  return sendSMS({
    to: phoneNumber,
    message
  });
};

/**
 * Send custom SMS
 */
export const sendCustomSMS = async (
  phoneNumber: string,
  message: string
): Promise<SMSResponse> => {
  return sendSMS({
    to: phoneNumber,
    message
  });
};

export default {
  sendSMS,
  testConnection,
  sendPaymentConfirmationSMS,
  sendVisaPaymentSMS,
  sendBookingConfirmationSMS,
  sendCustomSMS
};
