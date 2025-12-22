import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import smsService from '../../services/smsService';
import type { SMSThread } from '../../services/smsService';
import './SMSDropdown.css';

export default function SMSDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SMSThread[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await smsService.getAllSMS(10); // Get 10 most recent
      setMessages(data);
    } catch (error) {
      console.error('Error loading SMS:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/sms');
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <div className="sms-dropdown-container">
      <button 
        className="navbar-link icon sms-icon-button" 
        onClick={() => setIsOpen(!isOpen)}
        title="SMS Messages"
      >
        <i className="fa fa-comment-dots"></i>
        {messages.length > 0 && (
          <span className="badge">{messages.length > 9 ? '9+' : messages.length}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="sms-dropdown-overlay" onClick={() => setIsOpen(false)} />
          <div className="sms-dropdown-menu">
            <div className="sms-dropdown-header">
              <h4>
                <i className="fa fa-comment-dots me-2"></i>
                SMS Messages
              </h4>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <div className="sms-dropdown-body">
              {loading ? (
                <div className="sms-loading">
                  <i className="fa fa-spinner fa-spin"></i>
                  <span>Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="sms-empty">
                  <i className="fa fa-inbox"></i>
                  <p>No messages</p>
                </div>
              ) : (
                <div className="sms-list">
                  {messages.map((msg) => (
                    <div key={msg.thread_id} className="sms-item">
                      <div className="sms-item-avatar">
                        <i className="fa fa-user"></i>
                      </div>
                      <div className="sms-item-content">
                        <div className="sms-item-header">
                          <strong className="sms-contact">
                            {msg.contact_name || msg.phone_number}
                          </strong>
                          <span className="sms-time">
                            {smsService.formatTimestamp(msg.latest_timestamp)}
                          </span>
                        </div>
                        <div className="sms-item-message">
                          <span className={`sms-direction ${msg.latest_direction}`}>
                            {msg.latest_direction === 'incoming' ? '📥' : '📤'}
                          </span>
                          {truncateMessage(msg.latest_message)}
                        </div>
                        {!msg.contact_name && (
                          <div className="sms-phone-number">
                            {msg.phone_number}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sms-dropdown-footer">
              <button className="btn-view-all" onClick={handleViewAll}>
                <i className="fa fa-list me-2"></i>
                View All Messages
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

