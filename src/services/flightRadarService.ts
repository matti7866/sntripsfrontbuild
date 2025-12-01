import { config } from '../utils/config';

// Use proxy to avoid CORS issues  
const PROXY_URL = 'https://admin.sntrips.com/api/flight-radar-proxy.php';

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
  async searchFlight(flightNumber: string, travelDate?: string): Promise<FlightData[]> {
    try {
      console.log(`🔍 Searching for flight: ${flightNumber}, Date: ${travelDate}`);
      
      let url = `${PROXY_URL}?action=search&flightNumber=${encodeURIComponent(flightNumber)}`;
      if (travelDate) {
        url += `&travelDate=${encodeURIComponent(travelDate)}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Proxy API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Flight search response:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data?.data || [];
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
      const response = await fetch(`${PROXY_URL}?action=details&flightId=${encodeURIComponent(flightId)}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Proxy API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
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
      console.log(`🛫 Tracking flight: ${flightNumber}, Date: ${date}`);
      
      const flights = await this.searchFlight(flightNumber, date);
      console.log(`Found ${flights?.length || 0} flights`);
      
      if (flights && flights.length > 0) {
        console.log('Selected flight:', flights[0]);
        return flights[0];
      }
      
      console.log('No flights found');
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
   * Handles both live flight-positions and flight-summary responses
   */
  extractFlightInfo(flight: any) {
    // Check if it's a flight-summary response or live flight-positions
    const isSummary = flight.datetime_takeoff !== undefined;
    
    if (isSummary) {
      // Flight summary format
      const takeoffTime = flight.datetime_takeoff ? new Date(flight.datetime_takeoff) : null;
      const landedTime = flight.datetime_landed ? new Date(flight.datetime_landed) : null;
      
      return {
        flightNumber: flight.flight || '',
        airline: flight.operating_as || '',
        aircraft: flight.type || '',
        departureTime: takeoffTime ? takeoffTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
        arrivalTime: landedTime ? landedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
        departureDate: takeoffTime ? takeoffTime.toISOString().split('T')[0] : '',
        arrivalDate: landedTime ? landedTime.toISOString().split('T')[0] : '',
        status: flight.flight_ended ? 'Completed' : 'Scheduled',
        origin: {
          name: '',
          iata: flight.orig_iata || '',
          icao: flight.orig_icao || '',
        },
        destination: {
          name: '',
          iata: flight.dest_iata || '',
          icao: flight.dest_icao || '',
        },
      };
    } else {
      // Live flight-positions format
      return {
        flightNumber: flight.flight || flight.identification?.number?.default || '',
        airline: flight.operating_as || flight.airline?.name || '',
        aircraft: flight.type || flight.aircraft?.model?.text || '',
        departureTime: this.formatTime(flight.time?.scheduled?.departure || flight.time?.estimated?.departure),
        arrivalTime: this.formatTime(flight.time?.scheduled?.arrival || flight.time?.estimated?.arrival),
        departureDate: this.formatDate(flight.time?.scheduled?.departure),
        arrivalDate: this.formatDate(flight.time?.scheduled?.arrival),
        status: flight.status?.text || this.getStatus(flight),
        origin: {
          name: flight.airport?.origin?.name || '',
          iata: flight.orig_iata || flight.airport?.origin?.code?.iata || '',
          icao: flight.orig_icao || flight.airport?.origin?.code?.icao || '',
        },
        destination: {
          name: flight.airport?.destination?.name || '',
          iata: flight.dest_iata || flight.airport?.destination?.code?.iata || '',
          icao: flight.dest_icao || flight.airport?.destination?.code?.icao || '',
        },
      };
    }
  },
};

export default flightRadarService;

