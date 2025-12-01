import axios from 'axios';
import { config } from '../utils/config';

const FLIGHTRADAR24_API_BASE = 'https://fr24api.flightradar24.com/v1';

interface FlightData {
  identification?: {
    id?: string;
    number?: {
      default?: string;
    };
    callsign?: string;
  };
  status?: {
    text?: string;
    icon?: string;
    estimated?: string;
    real?: string;
    diverted?: string;
  };
  aircraft?: {
    model?: {
      code?: string;
      text?: string;
    };
    registration?: string;
  };
  airline?: {
    name?: string;
    code?: {
      iata?: string;
      icao?: string;
    };
  };
  airport?: {
    origin?: {
      name?: string;
      code?: {
        iata?: string;
        icao?: string;
      };
      position?: {
        latitude?: number;
        longitude?: number;
      };
      timezone?: {
        name?: string;
        offset?: number;
      };
    };
    destination?: {
      name?: string;
      code?: {
        iata?: string;
        icao?: string;
      };
      position?: {
        latitude?: number;
        longitude?: number;
      };
      timezone?: {
        name?: string;
        offset?: number;
      };
    };
  };
  time?: {
    scheduled?: {
      departure?: number;
      arrival?: number;
    };
    real?: {
      departure?: number;
      arrival?: number;
    };
    estimated?: {
      departure?: number;
      arrival?: number;
    };
  };
}

const flightRadarService = {
  /**
   * Search for flights by flight number
   */
  async searchFlight(flightNumber: string): Promise<FlightData[]> {
    try {
      const response = await axios.get(`${FLIGHTRADAR24_API_BASE}/search/flight`, {
        params: {
          query: flightNumber,
        },
        headers: {
          'Authorization': `Bearer ${config.flightRadar24ApiKey}`,
          'Accept': 'application/json',
        },
      });
      
      return response.data?.results || [];
    } catch (error: any) {
      console.error('FlightRadar24 search error:', error);
      throw error;
    }
  },

  /**
   * Get flight details by flight ID
   */
  async getFlightDetails(flightId: string): Promise<FlightData> {
    try {
      const response = await axios.get(`${FLIGHTRADAR24_API_BASE}/flight/${flightId}`, {
        headers: {
          'Authorization': `Bearer ${config.flightRadar24ApiKey}`,
          'Accept': 'application/json',
        },
      });
      
      return response.data;
    } catch (error: any) {
      console.error('FlightRadar24 details error:', error);
      throw error;
    }
  },

  /**
   * Get live flight tracking data
   */
  async trackFlight(flightNumber: string, date?: string): Promise<FlightData | null> {
    try {
      const flights = await this.searchFlight(flightNumber);
      
      if (flights && flights.length > 0) {
        // If date provided, find flight matching that date
        if (date) {
          const targetDate = new Date(date);
          const matchingFlight = flights.find((flight: any) => {
            if (flight.time?.scheduled?.departure) {
              const flightDate = new Date(flight.time.scheduled.departure * 1000);
              return flightDate.toDateString() === targetDate.toDateString();
            }
            return false;
          });
          
          return matchingFlight || flights[0];
        }
        
        return flights[0];
      }
      
      return null;
    } catch (error: any) {
      console.error('FlightRadar24 track error:', error);
      return null;
    }
  },

  /**
   * Format flight times from unix timestamp
   */
  formatTime(timestamp?: number): string {
    if (!timestamp) return '';
    
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  },

  /**
   * Format flight date from unix timestamp
   */
  formatDate(timestamp?: number): string {
    if (!timestamp) return '';
    
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0];
  },

  /**
   * Get flight status text
   */
  getStatus(flight: FlightData): string {
    return flight.status?.text || 'Unknown';
  },

  /**
   * Extract useful flight info for ticket form
   */
  extractFlightInfo(flight: FlightData) {
    return {
      flightNumber: flight.identification?.number?.default || '',
      airline: flight.airline?.name || '',
      aircraft: flight.aircraft?.model?.text || '',
      departureTime: this.formatTime(flight.time?.scheduled?.departure || flight.time?.estimated?.departure),
      arrivalTime: this.formatTime(flight.time?.scheduled?.arrival || flight.time?.estimated?.arrival),
      departureDate: this.formatDate(flight.time?.scheduled?.departure),
      arrivalDate: this.formatDate(flight.time?.scheduled?.arrival),
      status: this.getStatus(flight),
      origin: {
        name: flight.airport?.origin?.name || '',
        iata: flight.airport?.origin?.code?.iata || '',
        icao: flight.airport?.origin?.code?.icao || '',
      },
      destination: {
        name: flight.airport?.destination?.name || '',
        iata: flight.airport?.destination?.code?.iata || '',
        icao: flight.airport?.destination?.code?.icao || '',
      },
    };
  },
};

export default flightRadarService;

