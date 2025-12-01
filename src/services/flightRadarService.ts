import SDK from '@flightradar24/fr24sdk';
import { config } from '../utils/config';

// Create a single client instance
let clientInstance: any = null;

const getClient = () => {
  if (!clientInstance) {
    clientInstance = new SDK.Client({ 
      apiToken: config.flightRadar24ApiKey 
    });
  }
  return clientInstance;
};

interface FlightInfo {
  flightNumber: string;
  airline: string;
  aircraft: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  status: string;
  origin: {
    name: string;
    iata: string;
    icao: string;
  };
  destination: {
    name: string;
    iata: string;
    icao: string;
  };
}

const flightRadarService = {
  /**
   * Search for flights by flight number
   */
  async searchFlight(flightNumber: string): Promise<any[]> {
    try {
      const client = getClient();
      
      // Use the search API
      const result = await client.search.getByQuery({
        query: flightNumber,
        limit: 10
      });
      
      console.log('Search result:', result);
      return result?.flights || [];
    } catch (error: any) {
      console.error('FlightRadar24 search error:', error);
      throw error;
    }
  },

  /**
   * Get flight details by flight ID
   */
  async getFlightDetails(flightId: string): Promise<any> {
    try {
      const client = getClient();
      const flight = await client.flightSummary.get({ flightId });
      return flight;
    } catch (error: any) {
      console.error('FlightRadar24 details error:', error);
      throw error;
    }
  },

  /**
   * Get live flight tracking data
   */
  async trackFlight(flightNumber: string, date?: string): Promise<any | null> {
    try {
      console.log('Tracking flight:', flightNumber, 'on date:', date);
      
      const flights = await this.searchFlight(flightNumber);
      console.log('Found flights:', flights);
      
      if (flights && flights.length > 0) {
        // Return the first matching flight
        return flights[0];
      }
      
      return null;
    } catch (error: any) {
      console.error('FlightRadar24 track error:', error);
      return null;
    }
  },

  /**
   * Format flight times from unix timestamp or time string
   */
  formatTime(timeValue?: number | string): string {
    if (!timeValue) return '';
    
    try {
      let date: Date;
      
      if (typeof timeValue === 'number') {
        // Unix timestamp
        date = new Date(timeValue * 1000);
      } else {
        // ISO string or other format
        date = new Date(timeValue);
      }
      
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (e) {
      return '';
    }
  },

  /**
   * Format flight date
   */
  formatDate(timeValue?: number | string): string {
    if (!timeValue) return '';
    
    try {
      let date: Date;
      
      if (typeof timeValue === 'number') {
        date = new Date(timeValue * 1000);
      } else {
        date = new Date(timeValue);
      }
      
      if (isNaN(date.getTime())) return '';
      
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  },

  /**
   * Get flight status text
   */
  getStatus(flight: any): string {
    return flight?.status?.text || flight?.status || 'Scheduled';
  },

  /**
   * Extract useful flight info for ticket form
   */
  extractFlightInfo(flight: any): FlightInfo {
    console.log('Extracting info from flight:', flight);
    
    const info: FlightInfo = {
      flightNumber: flight?.flight?.identification?.number?.default || flight?.flightNumber || '',
      airline: flight?.airline?.name || flight?.airline || '',
      aircraft: flight?.aircraft?.model?.text || flight?.aircraft || '',
      departureTime: this.formatTime(flight?.time?.scheduled?.departure || flight?.departureTime),
      arrivalTime: this.formatTime(flight?.time?.scheduled?.arrival || flight?.arrivalTime),
      departureDate: this.formatDate(flight?.time?.scheduled?.departure || flight?.departureDate),
      arrivalDate: this.formatDate(flight?.time?.scheduled?.arrival || flight?.arrivalDate),
      status: this.getStatus(flight),
      origin: {
        name: flight?.airport?.origin?.name || flight?.origin?.name || '',
        iata: flight?.airport?.origin?.code?.iata || flight?.origin?.iata || '',
        icao: flight?.airport?.origin?.code?.icao || flight?.origin?.icao || '',
      },
      destination: {
        name: flight?.airport?.destination?.name || flight?.destination?.name || '',
        iata: flight?.airport?.destination?.code?.iata || flight?.destination?.iata || '',
        icao: flight?.airport?.destination?.code?.icao || flight?.destination?.icao || '',
      },
    };
    
    console.log('Extracted flight info:', info);
    return info;
  },

  /**
   * Close the client (cleanup)
   */
  close() {
    if (clientInstance) {
      clientInstance.close();
      clientInstance = null;
    }
  }
};

export default flightRadarService;
