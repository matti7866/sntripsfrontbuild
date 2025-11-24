import apiClient from './api';
import type { UpcomingTravel } from '../types';

const travelService = {
  // Get upcoming travels for a customer
  getUpcomingTravels: async (customerId: number): Promise<UpcomingTravel[]> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('Fetching travels for customer:', customerId);
      const response = await apiClient.get(`/calendar/flights.php?customerId=${customerId}&startDate=${today}`);
      
      if (response.data.flights && Array.isArray(response.data.flights)) {
        // Filter and sort by date
        const travels = response.data.flights
          .filter((flight: any) => {
            const travelDate = new Date(flight.date_of_travel.replace(',', ''));
            return travelDate >= new Date();
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(a.date_of_travel.replace(',', ''));
            const dateB = new Date(b.date_of_travel.replace(',', ''));
            return dateA.getTime() - dateB.getTime();
          });
        
        console.log('Travels loaded:', travels.length);
        return travels;
      }
      
      return [];
    } catch (error: any) {
      // Handle 404 gracefully - endpoint might not exist yet
      if (error.response?.status === 404) {
        console.log('Calendar/flights endpoint not found, returning empty array');
        return [];
      }
      console.error('Error fetching upcoming travels:', error);
      return [];
    }
  },
};

export default travelService;

