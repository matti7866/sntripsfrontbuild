import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { useState, useEffect } from 'react';
import { config } from '../utils/config';
import './adobe-nav.css';

export default function AdobeHeader() {
  const { user, logout } = useAuth();
  const { toggleAppSidebarMobile, appSidebarNone } = useAppSettings();
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Digital Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', searchQuery);
    // Implement search functionality
  };

  return (
    <header className="adobe-header">
      <div className="adobe-header-container">
        {/* Logo */}
        <div className="adobe-header-logo">
          <img src="/assets/logo-white.png" alt="Logo" className="adobe-logo-img" />
          {!appSidebarNone && (
            <button 
              type="button" 
              className="adobe-mobile-toggle" 
              onClick={toggleAppSidebarMobile}
            >
              <i className="fas fa-bars"></i>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="adobe-header-search">
          <form onSubmit={handleSearch} className="adobe-search-form">
            <input 
              type="text" 
              className="adobe-search-input" 
              placeholder="Search for templates and more"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="adobe-search-icon">
              <i className="fas fa-search"></i>
            </button>
          </form>
        </div>

        {/* Right Side Actions */}
        <div className="adobe-header-actions">
          {/* Digital Clock */}
          <div className="adobe-clock">
            <span>{currentTime}</span>
          </div>

          {/* Attendance Status */}
          <div className="adobe-attendance">
            <span className="badge bg-secondary me-1">Absent</span>
            <span>Check-in: <strong>--:--</strong></span>
            <span className="mx-1">|</span>
            <span>Check-out: <strong>--:--</strong></span>
            <span className="mx-1">|</span>
            <span>Break: <strong>--</strong></span>
            <small className="ms-1 text-muted">(Dubai Time)</small>
          </div>

          {/* Chat Icon */}
          <Link to="/chatroom" className="adobe-icon-btn" title="Chatroom">
            <i className="fas fa-comments"></i>
          </Link>

          {/* Attachments Icon */}
          <Link to="/attachments" className="adobe-icon-btn" title="File Attachments">
            <i className="fas fa-paperclip"></i>
          </Link>

          {/* Notes Icon */}
          <Link to="/notes" className="adobe-icon-btn" title="Notes">
            <i className="fas fa-sticky-note"></i>
          </Link>

          {/* Premium Button */}
          <button className="adobe-premium-btn">
            <i className="fas fa-crown"></i>
            <span>Get Premium offer</span>
          </button>

          {/* Settings */}
          <button className="adobe-icon-btn" title="Settings">
            <i className="fas fa-cog"></i>
          </button>

          {/* Help */}
          <button className="adobe-icon-btn" title="Help">
            <i className="fas fa-question-circle"></i>
          </button>

          {/* Notifications */}
          <div className="adobe-notifications dropdown">
            <button 
              className="adobe-icon-btn" 
              title="Notifications"
              data-bs-toggle="dropdown"
            >
              <i className="fas fa-bell"></i>
              <span className="adobe-notification-badge">5</span>
            </button>
            <div className="dropdown-menu dropdown-menu-end adobe-notification-menu">
              <div className="dropdown-header">NOTIFICATIONS (5)</div>
              <a href="#" className="dropdown-item media">
                <div className="media-left">
                  <i className="fa fa-plus media-object bg-gray-500"></i>
                </div>
                <div className="media-body">
                  <h6 className="media-heading">New User Registered</h6>
                  <div className="text-muted fs-10px">1 hour ago</div>
                </div>
              </a>
              <a href="#" className="dropdown-item media">
                <div className="media-left">
                  <i className="fa fa-envelope media-object bg-gray-500"></i>
                </div>
                <div className="media-body">
                  <h6 className="media-heading">New Email</h6>
                  <div className="text-muted fs-10px">2 hour ago</div>
                </div>
              </a>
              <div className="dropdown-footer text-center">
                <Link to="/notifications" className="text-decoration-none">View more</Link>
              </div>
            </div>
          </div>

          {/* Profile */}
          <div className="adobe-profile-dropdown dropdown">
            <button 
              className="adobe-profile-btn dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {user?.staff_pic ? (
                <img 
                  src={user.staff_pic.startsWith('http') ? user.staff_pic : `${config.baseUrl}/${user.staff_pic}`}
                  alt={user?.staff_name || 'User'} 
                  className="adobe-profile-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="adobe-profile-placeholder">
                  <i className="fas fa-user"></i>
                </div>
              )}
            </button>
            <div className="dropdown-menu dropdown-menu-end adobe-profile-menu">
              <div className="adobe-profile-menu-header">
                <div className="d-flex align-items-center">
                  {user?.staff_pic ? (
                    <img 
                      src={user.staff_pic.startsWith('http') ? user.staff_pic : `${config.baseUrl}/${user.staff_pic}`}
                      alt={user?.staff_name || 'User'} 
                      className="adobe-profile-menu-img"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="adobe-profile-placeholder">
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                  <div className="ms-2">
                    <div className="fw-bold">{user?.staff_name || 'User'}</div>
                    <div className="text-muted small">{user?.staff_email}</div>
                  </div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <Link to="/profile" className="dropdown-item">
                <i className="fas fa-user fa-fw me-2"></i> Profile
              </Link>
              <Link to="/days-calculator" className="dropdown-item">
                <i className="fas fa-calculator fa-fw me-2"></i> Days Calculator
              </Link>
              <Link to="/change-password" className="dropdown-item">
                <i className="fas fa-key fa-fw me-2"></i> Change Password
              </Link>
              <div className="dropdown-divider"></div>
              <button onClick={handleLogout} className="dropdown-item">
                <i className="fas fa-sign-out-alt fa-fw me-2"></i> Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
