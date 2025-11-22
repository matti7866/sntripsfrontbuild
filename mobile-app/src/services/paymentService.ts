import apiClient from './api';
import type { CustomerPayment, CustomerPaymentFilters } from '../types';

export const customerPaymentService = {
  async getCustomerPayments(filters: CustomerPaymentFilters): Promise<{ data: CustomerPayment[]; pagination?: any }> {
    try {
      console.log('Fetching payments for customer:', filters.customer);
      const response = await apiClient.post('/payment/customerPayments.php', {
        action: 'searchPayments',
        ...filters
      });
      const payments = response.data.success ? response.data.data : [];
      console.log('Payments loaded:', payments.length);
      return {
        data: payments,
        pagination: response.data.pagination
      };
    } catch (error: any) {
      // Handle 404 gracefully - endpoint might not exist or no data
      if (error.response?.status === 404) {
        console.log('Payments endpoint returned 404, returning empty array');
        return { data: [] };
      }
      console.error('Error loading payments:', error);
      return { data: [] };
    }
  },
};

