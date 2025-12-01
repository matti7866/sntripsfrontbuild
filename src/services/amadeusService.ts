import { config } from '../utils/config';

const PROXY_URL = 'https://admin.sntrips.com/api/amadeus-proxy.php';

interface AmadeusFlightSegment {
  departure: {
    iataCode: string;
    terminal?: string;
    at: string; // ISO datetime
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: string; // ISO datetime
  };
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
  };
  operating?: {
    carrierCode: string;
  };
  duration: string;
}

interface AmadeusFlight {
  type: string;
  scheduledDepartureDate: string;
  flightDesignator: {
    carrierCode: string;
    flightNumber: string;
  };
  segments?: AmadeusFlightSegment[];
}

const amadeusService = {
  /**
   * Search for flight schedule by flight number and date
   */
  async searchFlight(flightNumber: string, departureDate?: string): Promise<AmadeusFlight[]> {
    try {
      console.log(`🔍 Searching Amadeus for flight: ${flightNumber}, Date: ${departureDate}`);
      
      let url = `${PROXY_URL}?action=searchFlight&flightNumber=${encodeURIComponent(flightNumber)}`;
      if (departureDate) {
        url += `&departureDate=${encodeURIComponent(departureDate)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Amadeus API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Amadeus response:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data?.data || [];
    } catch (error: any) {
      console.error('Amadeus search error:', error);
      throw error;
    }
  },

  /**
   * Get flight status
   */
  async getFlightStatus(flightNumber: string, departureDate?: string): Promise<AmadeusFlight | null> {
    try {
      const flights = await this.searchFlight(flightNumber, departureDate);
      
      if (flights && flights.length > 0) {
        return flights[0];
      }
      
      return null;
    } catch (error: any) {
      console.error('Amadeus status error:', error);
      return null;
    }
  },

  /**
   * Extract flight info for ticket form
   */
  extractFlightInfo(flight: AmadeusFlight) {
    const segment = flight.segments?.[0];
    
    if (!segment) {
      return {
        flightNumber: `${flight.flightDesignator.carrierCode}${flight.flightDesignator.flightNumber}`,
        airline: flight.flightDesignator.carrierCode,
        aircraft: '',
        departureTime: '',
        arrivalTime: '',
        departureDate: flight.scheduledDepartureDate || '',
        arrivalDate: '',
        status: 'Scheduled',
        origin: {
          iata: '',
          name: '',
        },
        destination: {
          iata: '',
          name: '',
        },
      };
    }

    const depTime = new Date(segment.departure.at);
    const arrTime = new Date(segment.arrival.at);
    
    return {
      flightNumber: `${segment.carrierCode}${segment.number}`,
      airline: segment.carrierCode,
      aircraft: segment.aircraft.code,
      departureTime: depTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      arrivalTime: arrTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      departureDate: depTime.toISOString().split('T')[0],
      arrivalDate: arrTime.toISOString().split('T')[0],
      status: 'Scheduled',
      origin: {
        iata: segment.departure.iataCode,
        name: segment.departure.iataCode,
        terminal: segment.departure.terminal,
      },
      destination: {
        iata: segment.arrival.iataCode,
        name: segment.arrival.iataCode,
        terminal: segment.arrival.terminal,
      },
      duration: segment.duration,
    };
  },
};

export default amadeusService;

