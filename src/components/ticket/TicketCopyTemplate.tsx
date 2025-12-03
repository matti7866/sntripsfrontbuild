import { forwardRef } from 'react';
import type { Ticket } from '../../types/ticket';
import './TicketCopyTemplate.css';

interface TicketCopyTemplateProps {
  ticket: Ticket;
}

const TicketCopyTemplate = forwardRef<HTMLDivElement, TicketCopyTemplateProps>(({ ticket }, ref) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString || timeString.trim() === '' || timeString === 'null' || timeString === 'undefined') {
      return '00:00';
    }
    return timeString;
  };

  return (
    <div ref={ref} className="ticket-copy-template">
      {/* Logo Section with Black Background */}
      <div className="ticket-logo-section">
        <img 
          src="/assets/logo-white.png" 
          alt="SN Travels" 
          className="ticket-logo"
        />
        <div className="company-info">
          <p className="license-no">License No: 942318 | Dubai, UAE</p>
        </div>
      </div>

      {/* Ticket Title */}
      <div className="ticket-title-section">
        <div className="ticket-title-row">
          <h2>E-TICKET CONFIRMATION</h2>
          <span className="ticket-type-badge-small">
            {ticket.flight_type === 'RT' ? 'ROUND TRIP' : 'ONE WAY'}
          </span>
        </div>
        <div className="ticket-number-display">
          Ticket No: <span>{ticket.ticketNumber || 'N/A'}</span>
        </div>
        <div className="pnr-display">
          PNR: <span>{ticket.Pnr}</span>
        </div>
      </div>

      {/* Passenger Information */}
      <div className="ticket-section">
        <div className="section-header">
          <i className="fas fa-user"></i>
          PASSENGER INFORMATION
        </div>
        <div className="section-content">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Passenger Name</div>
              <div className="info-value">{ticket.passenger_name}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Customer</div>
              <div className="info-value">{ticket.customer_name}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Booking Date</div>
              <div className="info-value">{formatDateTime(ticket.datetime)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Information */}
      <div className="ticket-section">
        <div className="section-header">
          <i className="fas fa-plane-departure"></i>
          FLIGHT DETAILS - OUTBOUND
        </div>
        <div className="section-content">
          <div className="flight-route">
            <div className="airport-box">
              <div className="airport-code">{ticket.from_code}</div>
              <div className="airport-label">Departure</div>
            </div>
            <div className="flight-arrow">
              <i className="fas fa-long-arrow-alt-right"></i>
              {ticket.flight_number && (
                <div className="flight-number-label">Flight {ticket.flight_number}</div>
              )}
            </div>
            <div className="airport-box">
              <div className="airport-code">{ticket.to_code}</div>
              <div className="airport-label">Arrival</div>
            </div>
          </div>
          
          <div className="info-grid mt-3">
            <div className="info-item">
              <div className="info-label">Travel Date</div>
              <div className="info-value">{formatDate(ticket.date_of_travel)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Departure Time</div>
              <div className="info-value">{formatTime(ticket.departure_time)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Arrival Time</div>
              <div className="info-value">{formatTime(ticket.arrival_time)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Return Flight (if applicable) */}
      {ticket.flight_type === 'RT' && ticket.return_date && (
        <div className="ticket-section">
          <div className="section-header">
            <i className="fas fa-plane-arrival"></i>
            FLIGHT DETAILS - RETURN
          </div>
          <div className="section-content">
            <div className="flight-route">
              <div className="airport-box">
                <div className="airport-code">{ticket.to_code}</div>
                <div className="airport-label">Departure</div>
              </div>
              <div className="flight-arrow">
                <i className="fas fa-long-arrow-alt-right"></i>
                {ticket.return_flight_number && (
                  <div className="flight-number-label">Flight {ticket.return_flight_number}</div>
                )}
              </div>
              <div className="airport-box">
                <div className="airport-code">{ticket.from_code}</div>
                <div className="airport-label">Arrival</div>
              </div>
            </div>
            
            <div className="info-grid mt-3">
            <div className="info-item">
              <div className="info-label">Return Date</div>
              <div className="info-value">{formatDate(ticket.return_date)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Departure Time</div>
              <div className="info-value">{formatTime(ticket.return_departure_time)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Arrival Time</div>
              <div className="info-value">{formatTime(ticket.return_arrival_time)}</div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Information */}
      <div className="ticket-section">
        <div className="section-header">
          <i className="fas fa-money-bill-wave"></i>
          FARE INFORMATION
        </div>
        <div className="section-content">
          <div className="price-grid">
            <div className="price-row">
              <span className="price-label">Base Fare</span>
              <span className="price-value">{ticket.currency_name} {parseFloat(String(ticket.sale)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="price-row total-row">
              <span className="price-label">Total Amount</span>
              <span className="price-value total">{ticket.currency_name} {parseFloat(String(ticket.sale)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {ticket.remarks && (
        <div className="ticket-section">
          <div className="section-header">
            <i className="fas fa-info-circle"></i>
            REMARKS
          </div>
          <div className="section-content">
            <p className="remarks-text">{ticket.remarks}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="ticket-footer">
        <div className="footer-content">
          <div className="footer-section">
            <i className="fas fa-phone"></i>
            <span>+97142984564</span>
          </div>
          <div className="footer-section">
            <i className="fas fa-envelope"></i>
            <span>info@sntrips.com</span>
          </div>
          <div className="footer-section">
            <i className="fas fa-globe"></i>
            <span>www.sntrips.com</span>
          </div>
        </div>
        <div className="footer-note">
          <p><strong>Important:</strong> Please carry this e-ticket confirmation along with a valid photo ID for check-in.</p>
          <p className="small-print">This is a computer-generated ticket and does not require a signature. | Issued by: {ticket.staff_name || 'SN Travels Staff'}</p>
        </div>
      </div>
    </div>
  );
});

TicketCopyTemplate.displayName = 'TicketCopyTemplate';

export default TicketCopyTemplate;

