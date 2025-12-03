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
      {/* Main Ticket Card */}
      <div className="ticket-card">
        {/* Header Section */}
        <div className="ticket-header">
          <div className="header-left">
            <img 
              src="/assets/logo-white.png" 
              alt="SN Travels" 
              className="ticket-logo-img"
            />
          </div>
          <div className="header-center">
            <p className="boarding-pass-label">E-TICKET CONFIRMATION</p>
          </div>
          <div className="header-right">
            <div className="barcode-container">
              <div className="barcode">
                <div className="barcode-line" style={{width: '2px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '1px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '3px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '1px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '2px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '4px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '1px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '2px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '3px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '1px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '2px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '1px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '3px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '2px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '1px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '4px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '1px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '2px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '3px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '1px', height: '40px'}}></div>
                <div className="barcode-line" style={{width: '2px', height: '40px'}}></div>
              </div>
              <div className="barcode-number">{ticket.Pnr || '1234567890'}</div>
            </div>
          </div>
        </div>

        {/* Booking Reference and Ticket Number - Top Section */}
        <div className="booking-info-top">
          <div className="booking-ref-section-top">
            <span className="booking-label-top">Booking Reference</span>
            <div className="booking-ref-value-top">{ticket.Pnr}</div>
          </div>
          <div className="ticket-number-section-top">
            <span className="ticket-label-top">Ticket Number</span>
            <div className="ticket-number-value-top">{ticket.ticketNumber || 'N/A'}</div>
          </div>
          <div className="flight-type-badge-top">
            {ticket.flight_type === 'RT' ? 'ROUND TRIP' : 'ONE WAY'}
          </div>
        </div>

        {/* Flight Segments Section */}
        <div className="segments-section">
          {/* Outbound Segment */}
          <div className="segment-card">
            <div className="segment-header">
              <i className="fas fa-plane-departure"></i>
              <span>OUTBOUND SEGMENT</span>
            </div>
            <div className="segment-route">
              <div className="segment-airport departure-segment">
                <div className="segment-airport-code">{ticket.from_code || 'N/A'}</div>
                <div className="segment-airport-label">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>Departure</span>
                </div>
              </div>

              <div className="segment-flight-path">
                <div className="segment-path-line"></div>
                <div className="segment-path-dots">
                  <div className="segment-dot-start"></div>
                  <div className="segment-plane-icon">
                    <i className="fas fa-plane"></i>
                  </div>
                  <div className="segment-dot-end"></div>
                </div>
                {ticket.flight_number && (
                  <div className="segment-flight-number">Flight {ticket.flight_number}</div>
                )}
              </div>

              <div className="segment-airport arrival-segment">
                <div className="segment-airport-code">{ticket.to_code || 'N/A'}</div>
                <div className="segment-airport-label">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>Arrival</span>
                </div>
              </div>
            </div>
            <div className="segment-details">
              <div className="segment-detail-item">
                <span className="segment-detail-label">Date:</span>
                <strong>{formatDate(ticket.date_of_travel)}</strong>
              </div>
              <div className="segment-detail-item">
                <span className="segment-detail-label">Departure:</span>
                <strong>{formatTime(ticket.departure_time)}</strong>
              </div>
              <div className="segment-detail-item">
                <span className="segment-detail-label">Arrival:</span>
                <strong>{formatTime(ticket.arrival_time)}</strong>
              </div>
            </div>
          </div>

          {/* Return Segment (if applicable) */}
          {ticket.flight_type === 'RT' && ticket.return_date && (
            <div className="segment-card">
              <div className="segment-header">
                <i className="fas fa-plane-arrival"></i>
                <span>RETURN SEGMENT</span>
              </div>
              <div className="segment-route">
                <div className="segment-airport departure-segment">
                  <div className="segment-airport-code">{ticket.to_code}</div>
                  <div className="segment-airport-label">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>Departure</span>
                  </div>
                </div>

                <div className="segment-flight-path">
                  <div className="segment-path-line"></div>
                  <div className="segment-path-dots">
                    <div className="segment-dot-start"></div>
                    <div className="segment-plane-icon">
                      <i className="fas fa-plane"></i>
                    </div>
                    <div className="segment-dot-end"></div>
                  </div>
                  {ticket.return_flight_number && (
                    <div className="segment-flight-number">Flight {ticket.return_flight_number}</div>
                  )}
                </div>

                <div className="segment-airport arrival-segment">
                  <div className="segment-airport-code">{ticket.from_code}</div>
                  <div className="segment-airport-label">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>Arrival</span>
                  </div>
                </div>
              </div>
              <div className="segment-details">
                <div className="segment-detail-item">
                  <span className="segment-detail-label">Date:</span>
                  <strong>{formatDate(ticket.return_date)}</strong>
                </div>
                <div className="segment-detail-item">
                  <span className="segment-detail-label">Departure:</span>
                  <strong>{formatTime(ticket.return_departure_time)}</strong>
                </div>
                <div className="segment-detail-item">
                  <span className="segment-detail-label">Arrival:</span>
                  <strong>{formatTime(ticket.return_arrival_time)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Passenger Info Card */}
        <div className="passenger-card">
          <div className="passenger-header">
            <i className="fas fa-user"></i>
            <span>Passenger</span>
          </div>
          <div className="passenger-name">{ticket.passenger_name}</div>
        </div>

        {/* Additional Information Section */}
        <div className="additional-info-section">
          <div className="info-row">
            <div className="info-item-modern">
              <span className="info-label-modern">Customer</span>
              <span className="info-value-modern">{ticket.customer_name}</span>
            </div>
            <div className="info-item-modern">
              <span className="info-label-modern">Booking Date</span>
              <span className="info-value-modern">{formatDateTime(ticket.datetime)}</span>
            </div>
          </div>
          
          {/* Pricing */}
          <div className="pricing-section">
            <div className="pricing-row">
              <span className="pricing-label">Total Amount</span>
              <span className="pricing-value">{ticket.currency_name} {parseFloat(String(ticket.sale)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Remarks */}
          {ticket.remarks && (
            <div className="remarks-section">
              <div className="remarks-label">
                <i className="fas fa-info-circle"></i>
                <span>Remarks</span>
              </div>
              <div className="remarks-content">{ticket.remarks}</div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="ticket-bottom-bar">
          <p className="bottom-bar-text">Please arrive at the gate 30 minutes before departure</p>
          <p className="bottom-bar-eticket">E-TICKET</p>
        </div>
      </div>

      {/* Footer Section */}
      <div className="ticket-footer-modern">
        <div className="footer-info">
          <div className="footer-item">
            <i className="fas fa-phone"></i>
            <span>+97142984564</span>
          </div>
          <div className="footer-item">
            <i className="fas fa-envelope"></i>
            <span>info@sntrips.com</span>
          </div>
          <div className="footer-item">
            <i className="fas fa-globe"></i>
            <span>www.sntrips.com</span>
          </div>
          <div className="footer-item">
            <i className="fas fa-certificate"></i>
            <span>License No: 942318 | Dubai, UAE</span>
          </div>
        </div>
        <div className="footer-note-modern">
          <p><strong>Important:</strong> Please carry this e-ticket confirmation along with a valid photo ID for check-in.</p>
          <p className="small-print-modern">This is a computer-generated ticket and does not require a signature. | Issued by: {ticket.staff_name || 'SN Travels Staff'}</p>
        </div>
      </div>

      {/* Flight Details Grid - After Footer */}
      {ticket.flight_type === 'OW' ? (
        /* One Way - Show only Departure and Arrival */
        <div className="details-grid details-grid-one-way">
          <div className="detail-item">
            <div className="detail-label">
              <i className="fas fa-clock"></i>
              <span>Departure</span>
            </div>
            <div className="detail-value">{formatTime(ticket.departure_time)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">
              <i className="fas fa-clock"></i>
              <span>Arrival</span>
            </div>
            <div className="detail-value">{formatTime(ticket.arrival_time)}</div>
          </div>
        </div>
      ) : (
        /* Round Trip - Show complete information for both segments */
        <div className="details-grid details-grid-round-trip">
          {/* Outbound Segment Details */}
          <div className="detail-section-header">
            <i className="fas fa-plane-departure"></i>
            <span>OUTBOUND</span>
          </div>
          <div className="detail-item">
            <div className="detail-label">
              <i className="fas fa-calendar"></i>
              <span>Date</span>
            </div>
            <div className="detail-value">{formatDate(ticket.date_of_travel)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">
              <i className="fas fa-clock"></i>
              <span>Departure</span>
            </div>
            <div className="detail-value">{formatTime(ticket.departure_time)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">
              <i className="fas fa-clock"></i>
              <span>Arrival</span>
            </div>
            <div className="detail-value">{formatTime(ticket.arrival_time)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">
              <i className="fas fa-plane"></i>
              <span>Route</span>
            </div>
            <div className="detail-value">{ticket.from_code} → {ticket.to_code}</div>
          </div>
          
          {/* Return Segment Details */}
          {ticket.return_date && (
            <>
              <div className="detail-section-header">
                <i className="fas fa-plane-arrival"></i>
                <span>RETURN</span>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <i className="fas fa-calendar"></i>
                  <span>Date</span>
                </div>
                <div className="detail-value">{formatDate(ticket.return_date)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <i className="fas fa-clock"></i>
                  <span>Departure</span>
                </div>
                <div className="detail-value">{formatTime(ticket.return_departure_time)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <i className="fas fa-clock"></i>
                  <span>Arrival</span>
                </div>
                <div className="detail-value">{formatTime(ticket.return_arrival_time)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <i className="fas fa-plane"></i>
                  <span>Route</span>
                </div>
                <div className="detail-value">{ticket.to_code} → {ticket.from_code}</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

TicketCopyTemplate.displayName = 'TicketCopyTemplate';

export default TicketCopyTemplate;

