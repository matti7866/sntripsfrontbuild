import apiClient from './api';
import type { LoyaltyCard, LoyaltyCardTransaction } from '../types';

const loyaltyCardService = {
  // Get loyalty card for a customer
  getCustomerLoyaltyCard: async (customerId: number): Promise<LoyaltyCard | null> => {
    try {
      console.log('Fetching loyalty card for customer:', customerId);
      const response = await apiClient.get(`/loyalty/card.php?customerId=${customerId}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      // Handle 404 gracefully - endpoint might not exist yet
      if (error.response?.status === 404) {
        console.log('Loyalty card endpoint not found');
        return null;
      }
      console.error('Error fetching loyalty card:', error);
      return null;
    }
  },

  // Create loyalty card for a customer
  createLoyaltyCard: async (customerId: number): Promise<LoyaltyCard> => {
    const response = await apiClient.post('/loyalty/card.php', {
      action: 'create',
      customer_id: customerId
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create loyalty card');
  },

  // Get loyalty card transactions
  getTransactions: async (cardId: number): Promise<LoyaltyCardTransaction[]> => {
    try {
      const response = await apiClient.get(`/loyalty/transactions.php?cardId=${cardId}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  },

  // Add points to loyalty card
  addPoints: async (cardId: number, points: number, description: string): Promise<void> => {
    await apiClient.post('/loyalty/transactions.php', {
      action: 'add',
      card_id: cardId,
      points: points,
      type: 'earned',
      description: description
    });
  },
};

export default loyaltyCardService;

