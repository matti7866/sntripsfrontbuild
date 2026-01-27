import axios from './api';

const API_BASE_URL = '/email/mailerooController.php';

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface SendNotificationRequest {
  to: string;
  subject: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export interface EmailResponse {
  success: boolean;
  message: string;
  service?: string;
}

/**
 * Send email via Maileroo SMTP
 */
export const sendEmail = async (data: SendEmailRequest): Promise<EmailResponse> => {
  try {
    const response = await axios.post(API_BASE_URL, {
      action: 'sendEmail',
      ...data
    });
    console.log('✅ Maileroo email sent successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Maileroo send email error:', error);
    console.error('Error details:', error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send email'
    };
  }
};

/**
 * Send styled notification email via Maileroo
 */
export const sendNotification = async (data: SendNotificationRequest): Promise<EmailResponse> => {
  try {
    console.log('📧 Sending Maileroo notification to:', data.to);
    const response = await axios.post(API_BASE_URL, {
      action: 'sendNotification',
      ...data
    });
    console.log('✅ Maileroo notification sent successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Maileroo send notification error:', error);
    console.error('Error details:', error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send notification'
    };
  }
};

/**
 * Test Maileroo connection
 */
export const testConnection = async (): Promise<EmailResponse> => {
  try {
    const response = await axios.post(API_BASE_URL, {
      action: 'testConnection'
    });
    return response.data;
  } catch (error: any) {
    console.error('Maileroo connection test error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Connection test failed'
    };
  }
};

/**
 * Send booking confirmation email
 */
export const sendBookingConfirmation = async (
  email: string,
  bookingDetails: {
    bookingNumber: string;
    customerName: string;
    service: string;
    date: string;
    amount: string;
  }
): Promise<EmailResponse> => {
  const htmlMessage = `
    <div style="font-family: Arial, sans-serif;">
      <h2 style="color: #3b82f6;">Booking Confirmation</h2>
      <p>Dear ${bookingDetails.customerName},</p>
      <p>Your booking has been confirmed successfully!</p>
      <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Booking Number:</strong> ${bookingDetails.bookingNumber}</p>
        <p style="margin: 5px 0;"><strong>Service:</strong> ${bookingDetails.service}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${bookingDetails.date}</p>
        <p style="margin: 5px 0;"><strong>Amount:</strong> ${bookingDetails.amount}</p>
      </div>
      <p>Thank you for choosing SN Travels & Tourism!</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Booking Confirmation - ${bookingDetails.bookingNumber}`,
    body: htmlMessage
  });
};

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmation = async (
  email: string,
  paymentDetails: {
    transactionId: string;
    customerName: string;
    amount: string;
    date: string;
    method: string;
  }
): Promise<EmailResponse> => {
  return sendNotification({
    to: email,
    subject: 'Payment Received Successfully',
    message: `
      <p>Dear ${paymentDetails.customerName},</p>
      <p>We have received your payment successfully.</p>
      <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${paymentDetails.transactionId}</p>
        <p style="margin: 5px 0;"><strong>Amount:</strong> ${paymentDetails.amount}</p>
        <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentDetails.method}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${paymentDetails.date}</p>
      </div>
      <p>Thank you for your payment!</p>
    `,
    type: 'success'
  });
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (
  email: string,
  resetLink: string,
  userName: string
): Promise<EmailResponse> => {
  const htmlMessage = `
    <p>Dear ${userName},</p>
    <p>We received a request to reset your password. Click the button below to reset it:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">
      If you didn't request this, please ignore this email. The link will expire in 24 hours.
    </p>
    <p style="color: #666; font-size: 12px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      ${resetLink}
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - SN Travels',
    body: htmlMessage
  });
};

/**
 * Send application status update
 */
export const sendApplicationStatusUpdate = async (
  email: string,
  applicationNumber: string,
  status: string,
  message: string
): Promise<EmailResponse> => {
  let notificationType: 'info' | 'success' | 'warning' | 'error' = 'info';
  
  if (status.toLowerCase().includes('approved') || status.toLowerCase().includes('success')) {
    notificationType = 'success';
  } else if (status.toLowerCase().includes('pending') || status.toLowerCase().includes('processing')) {
    notificationType = 'info';
  } else if (status.toLowerCase().includes('rejected') || status.toLowerCase().includes('failed')) {
    notificationType = 'error';
  }

  return sendNotification({
    to: email,
    subject: `Application ${applicationNumber} - ${status}`,
    message: `
      <p>Your application status has been updated.</p>
      <div style="padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Application Number:</strong> ${applicationNumber}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> ${status}</p>
      </div>
      <p>${message}</p>
    `,
    type: notificationType
  });
};

export default {
  sendEmail,
  sendNotification,
  testConnection,
  sendBookingConfirmation,
  sendPaymentConfirmation,
  sendPasswordReset,
  sendApplicationStatusUpdate
};
