import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import ticketService from '../../services/ticketService';
import flightRadarService from '../../services/flightRadarService';
import './FlightTrackerCard.css';

interface UpcomingFlight {
  ticket: number;
  ticketNumber: string;
  Pnr: string;
  passenger_name: string;
  date_of_travel: string;
  return_date?: string;
  flight_number?: string;
  return_flight_number?: string;
  departure_time?: string;
  arrival_time?: string;
  from_place: string;
  to_place: string;
  customer_name: string;
  flight_type: string;
}

interface FlightStatus {
  flightNumber: string;
  status: string;
  departureTime: string;
  arrivalTime: string;
  delay?: string;
  gate?: string;
}

export default function FlightTrackerCard() {
  const [flightStatuses, setFlightStatuses] = useState<Record<string, FlightStatus>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Fetch upcoming flights (next 7 days)
  const { data: upcomingFlights, isLoading } = useQuery({
    queryKey: ['upcomingFlights'],
    queryFn: async () => {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await ticketService.getUpcomingFlights({ startDate, endDate });
      return response;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const flights: UpcomingFlight[] = upcomingFlights || [];

  // Track flight statuses for flights with flight numbers
  useEffect(() => {
    const trackFlights = async () => {
      if (!flights || flights.length === 0) return;
      
      const statuses: Record<string, FlightStatus> = {};
      
      for (const flight of flights.slice(0, 5)) { // Track first 5 flights
        if (flight.flight_number) {
          try {
            const flightData = await flightRadarService.trackFlight(
              flight.flight_number,
              flight.date_of_travel
            );
            
            if (flightData) {
              const info = flightRadarService.extractFlightInfo(flightData);
              statuses[flight.flight_number] = {
                flightNumber: flight.flight_number,
                status: info.status,
                departureTime: info.departureTime,
                arrivalTime: info.arrivalTime,
              };
            }
          } catch (error) {
            console.error(`Error tracking flight ${flight.flight_number}:`, error);
          }
        }
      }
      
      setFlightStatuses(statuses);
    };

    trackFlights();
  }, [flights]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger refetch
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('scheduled') || statusLower.includes('on time')) return 'status-on-time';
    if (statusLower.includes('delayed')) return 'status-delayed';
    if (statusLower.includes('departed') || statusLower.includes('airborne')) return 'status-departed';
    if (statusLower.includes('landed') || statusLower.includes('arrived')) return 'status-landed';
    if (statusLower.includes('cancelled')) return 'status-cancelled';
    return 'status-unknown';
  };

  return (
    <div className="dashboard-section flight-tracker-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <i className="fas fa-plane-departure"></i>
            Live Flight Tracker
          </h2>
          <p className="section-subtitle">Real-time status for upcoming flights</p>
        </div>
        <button 
          className="refresh-btn" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i>
        </button>
      </div>
      <div className="section-body flight-tracker-body">
        {isLoading ? (
          <div className="text-center py-4">
            <i className="fa fa-spinner fa-spin fa-2x text-primary"></i>
            <p className="mt-2 text-muted">Loading flights...</p>
          </div>
        ) : flights.length === 0 ? (
          <div className="no-flights">
            <i className="fas fa-plane-slash"></i>
            <p>No upcoming flights in the next 7 days</p>
          </div>
        ) : (
          <div className="flights-list">
            {flights.slice(0, 5).map((flight) => {
              const flightStatus = flight.flight_number ? flightStatuses[flight.flight_number] : null;
              const daysUntil = Math.ceil((new Date(flight.date_of_travel).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={flight.ticket} className="flight-item">
                  <div className="flight-item-header">
                    <div className="flight-route">
                      <span className="flight-airport">{flight.from_place}</span>
                      <i className="fas fa-long-arrow-alt-right flight-arrow"></i>
                      <span className="flight-airport">{flight.to_place}</span>
                    </div>
                    {flight.flight_number && (
                      <span className="flight-number-badge">
                        <i className="fas fa-plane"></i>
                        {flight.flight_number}
                      </span>
                    )}
                  </div>
                  
                  <div className="flight-item-body">
                    <div className="flight-info-row">
                      <span className="flight-label">Passenger:</span>
                      <span className="flight-value">{flight.passenger_name}</span>
                    </div>
                    <div className="flight-info-row">
                      <span className="flight-label">Travel Date:</span>
                      <span className="flight-value">
                        {new Date(flight.date_of_travel).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="days-badge">
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                        </span>
                      </span>
                    </div>
                    {flight.flight_number && flightStatus && (
                      <>
                        <div className="flight-info-row">
                          <span className="flight-label">Status:</span>
                          <span className={`flight-status ${getStatusColor(flightStatus.status)}`}>
                            {flightStatus.status}
                          </span>
                        </div>
                        <div className="flight-info-row">
                          <span className="flight-label">Times:</span>
                          <span className="flight-value">
                            <i className="fas fa-plane-departure"></i> {flightStatus.departureTime}
                            <i className="fas fa-plane-arrival ms-2"></i> {flightStatus.arrivalTime}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

