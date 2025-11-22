import apiClient from './api';
import type { Ticket, TicketFilters } from '../types';

const ticketService = {
  // Get all tickets for a customer
  getCustomerTickets: async (customerId: number, filters?: TicketFilters): Promise<Ticket[]> => {
    try {
      const params = new URLSearchParams();
      params.append('customerId', customerId.toString());
      
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const queryString = params.toString();
      const url = `/ticket/list.php${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching tickets for customer:', customerId);
      const response = await apiClient.get(url);
      const tickets = response.data.data || [];
      console.log('Tickets loaded:', tickets.length);
      return tickets;
    } catch (error: any) {
      // Handle 404 gracefully - endpoint might not exist or no data
      if (error.response?.status === 404) {
        console.log('Tickets endpoint returned 404, returning empty array');
        return [];
      }
      console.error('Error loading tickets:', error);
      return [];
    }
  },

  // Get ticket by ID
  getTicket: async (ticketId: number): Promise<Ticket> => {
    try {
      const response = await apiClient.get(`/ticket/list.php?ticketId=${ticketId}`);
      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      throw new Error('Ticket not found');
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Ticket not found (404)');
      }
      throw error;
    }
  },
};

export default ticketService;

