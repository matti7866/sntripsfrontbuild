const PROXY_URL = 'https://admin.sntrips.com/api/aviationstack-proxy.php';

interface AviationStackFlight {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal?: string;
    gate?: string;
    delay?: number;
    scheduled: string;
    estimated?: string;
    actual?: string;
    estimated_runway?: string;
    actual_runway?: string;
  };
  arrival: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
    delay?: number;
    scheduled: string;
    estimated?: string;
    actual?: string;
    estimated_runway?: string;
    actual_runway?: string;
  };
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
  flight: {
    number: string;
    iata: string;
    icao: string;
    codeshared?: any;
  };
  aircraft?: {
    registration?: string;
    iata?: string;
    icao?: string;
    icao24?: string;
  };
  live?: {
    updated: string;
    latitude: number;
    longitude: number;
    altitude: number;
    direction: number;
    speed_horizontal: number;
    speed_vertical: number;
    is_ground: boolean;
  };
}

interface AviationStackResponse {
  pagination?: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: AviationStackFlight[];
}

const aviationstackService = {
  /**
   * Search for flight by flight number and optional date
   */
  async searchFlight(flightNumber: string, flightDate?: string): Promise<AviationStackFlight[]> {
    try {
      console.log(`✈️ Searching AviationStack for: ${flightNumber}, Date: ${flightDate}`);
      
      let url = `${PROXY_URL}?action=search&flightNumber=${encodeURIComponent(flightNumber)}`;
      if (flightDate) {
        url += `&flightDate=${encodeURIComponent(flightDate)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status}`);
      }
      
      const data: AviationStackResponse = await response.json();
      console.log('AviationStack response:', data);
      
      if ((data as any).error) {
        throw new Error((data as any).error);
      }
      
      return data.data || [];
    } catch (error: any) {
      console.error('AviationStack search error:', error);
      throw error;
    }
  },

  /**
   * Get flight info (first result from search)
   */
  async getFlightInfo(flightNumber: string, flightDate?: string): Promise<AviationStackFlight | null> {
    try {
      const flights = await this.searchFlight(flightNumber, flightDate);
      
      if (flights && flights.length > 0) {
        // If multiple results, prefer scheduled or active flights
        const preferredFlight = flights.find(f => 
          f.flight_status === 'scheduled' || 
          f.flight_status === 'active' ||
          f.flight_status === 'landed'
        ) || flights[0];
        
        return preferredFlight;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting flight info:', error);
      return null;
    }
  },

  /**
   * Extract flight info for ticket form
   */
  extractFlightInfo(flight: AviationStackFlight) {
    const depTime = new Date(flight.departure.scheduled);
    const arrTime = new Date(flight.arrival.scheduled);
    
    return {
      flightNumber: flight.flight.iata,
      airline: flight.airline.name,
      aircraft: flight.aircraft?.iata || flight.aircraft?.icao || '',
      departureTime: depTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC'
      }),
      arrivalTime: arrTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC'
      }),
      departureDate: flight.flight_date,
      arrivalDate: arrTime.toISOString().split('T')[0],
      status: flight.flight_status,
      delay: flight.departure.delay || flight.arrival.delay || 0,
      origin: {
        iata: flight.departure.iata,
        icao: flight.departure.icao,
        name: flight.departure.airport,
        terminal: flight.departure.terminal,
        gate: flight.departure.gate,
      },
      destination: {
        iata: flight.arrival.iata,
        icao: flight.arrival.icao,
        name: flight.arrival.airport,
        terminal: flight.arrival.terminal,
        gate: flight.arrival.gate,
        baggage: flight.arrival.baggage,
      },
    };
  },
};

export default aviationstackService;

