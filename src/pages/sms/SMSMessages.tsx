import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import smsService from '../../services/smsService';
import type { SMSThread, PushbulletDevice } from '../../services/smsService';
import './SMSMessages.css';

export default function SMSMessages() {
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedThread, setSelectedThread] = useState<SMSThread | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [threadMessages, setThreadMessages] = useState<any>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showThreads, setShowThreads] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Check if mobile and prevent body scroll
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowThreads(true);
      }
    };
    
    // Prevent body scroll when SMS page is active
    document.body.style.overflow = 'hidden';
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.body.style.overflow = '';
    };
  }, []);

  // Fetch devices
  const { data: devices = [] } = useQuery<PushbulletDevice[]>({
    queryKey: ['pushbullet-devices'],
    queryFn: () => smsService.getDevices(),
    staleTime: 60000
  });

  // Auto-select first SMS-capable device
  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) {
      const smsDevice = devices.find(d => d.has_sms === true || d.has_sms === 'true');
      if (smsDevice) {
        setSelectedDevice(smsDevice.iden);
      }
    }
  }, [devices, selectedDevice]);

  // Fetch SMS threads for selected device
  const { data: threads = [], isLoading, refetch } = useQuery<SMSThread[]>({
    queryKey: ['sms-threads', selectedDevice],
    queryFn: () => smsService.getSMSThreads(selectedDevice, 100),
    enabled: !!selectedDevice,
    refetchInterval: 30000,
    staleTime: 20000
  });

  // Filter threads based on search
  const filteredThreads = threads.filter(thread => 
    thread.phone_number.includes(searchTerm) ||
    thread.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.latest_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Scroll to bottom when messages load
  useEffect(() => {
    if (threadMessages && messagesContainerRef.current && threadMessages.thread && threadMessages.thread.length > 0) {
      // Wait for DOM to update, then scroll smoothly
      setTimeout(() => {
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          // Calculate exact scroll position to show last message
          const scrollHeight = container.scrollHeight;
          const clientHeight = container.clientHeight;
          const maxScroll = scrollHeight - clientHeight;
          
          // Scroll to bottom smoothly, but ensure we don't scroll past the container
          container.scrollTo({
            top: Math.max(0, maxScroll),
            behavior: 'smooth'
          });
        }
      }, 200);
    }
  }, [threadMessages]);

  // Load messages for selected thread
  const loadThreadMessages = async (thread: SMSThread) => {
    if (!selectedDevice) return;
    
    setSelectedThread(thread);
    setLoadingMessages(true);
    setThreadMessages(null);
    
    // Hide threads panel on mobile when selecting a thread
    if (isMobile) {
      setShowThreads(false);
    }
    
    try {
      const data = await smsService.getMessages(selectedDevice, thread.thread_id);
      setThreadMessages(data);
    } catch (error) {
      console.error('Error loading thread messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatFullDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 2) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Get SMS-capable devices
  const smsDevices = devices.filter(d => (d.has_sms === true || d.has_sms === 'true') && d.active);
  const selectedDeviceName = smsDevices.find(d => d.iden === selectedDevice)?.nickname || 
                             smsDevices.find(d => d.iden === selectedDevice)?.model || 
                             'Unknown Device';

  return (
    <div className="sms-messages-page">
      {/* Header */}
      <div className="sms-page-header">
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon">
              <i className="fa fa-comments"></i>
            </div>
            <div>
              <h1>SMS Messages</h1>
              {selectedDevice && (
                <p className="device-indicator">
                  <i className="fa fa-mobile-alt"></i> {selectedDeviceName}
                </p>
              )}
            </div>
          </div>
          
          <div className="header-actions">
            <div className="device-selector-wrapper">
              <select
                className="device-selector"
                value={selectedDevice}
                onChange={(e) => {
                  setSelectedDevice(e.target.value);
                  setSelectedThread(null);
                  setThreadMessages(null);
                }}
              >
                <option value="">Select Device</option>
                {smsDevices.map(device => (
                  <option key={device.iden} value={device.iden}>
                    {device.nickname || `${device.manufacturer} ${device.model}`}
                  </option>
                ))}
              </select>
            </div>
            <button 
              className="btn-refresh" 
              onClick={() => refetch()} 
              disabled={!selectedDevice || isLoading}
              title="Refresh conversations"
            >
              <i className={`fa ${isLoading ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="sms-main-container">
        {/* Threads Sidebar */}
        <aside className={`sms-sidebar ${showThreads ? 'show' : ''}`}>
          <div className="sidebar-header">
            <h2>Conversations</h2>
            <button 
              className="btn-close-sidebar"
              onClick={() => setShowThreads(false)}
              aria-label="Close sidebar"
            >
              <i className="fa fa-times"></i>
            </button>
          </div>

          <div className="sidebar-search">
            <div className="search-input-wrapper">
              <i className="fa fa-search search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="search-clear"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <i className="fa fa-times"></i>
                </button>
              )}
            </div>
            {selectedDevice && (
              <div className="threads-count-badge">
                {filteredThreads.length}
              </div>
            )}
          </div>

          <div className="threads-container">
            {!selectedDevice ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="fa fa-mobile-alt"></i>
                </div>
                <h3>No Device Selected</h3>
                <p>Please select a device from the dropdown above to view SMS conversations.</p>
              </div>
            ) : isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading conversations...</p>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="fa fa-inbox"></i>
                </div>
                <h3>No Conversations</h3>
                <p>{searchTerm ? 'No conversations match your search.' : 'No SMS conversations found on this device.'}</p>
              </div>
            ) : (
              <div className="threads-list">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.thread_id}
                    className={`thread-card ${selectedThread?.thread_id === thread.thread_id ? 'active' : ''}`}
                    onClick={() => loadThreadMessages(thread)}
                  >
                    <div className="thread-avatar">
                      {thread.contact_name ? (
                        <span>{thread.contact_name.charAt(0).toUpperCase()}</span>
                      ) : (
                        <i className="fa fa-user"></i>
                      )}
                    </div>
                    <div className="thread-details">
                      <div className="thread-top">
                        <span className="thread-name">
                          {thread.contact_name || thread.phone_number}
                        </span>
                        <span className="thread-time">
                          {smsService.formatTimestamp(thread.latest_timestamp)}
                        </span>
                      </div>
                      <div className="thread-preview">
                        <span className={`direction-badge ${thread.latest_direction}`}>
                          {thread.latest_direction === 'incoming' ? (
                            <i className="fa fa-arrow-down"></i>
                          ) : (
                            <i className="fa fa-arrow-up"></i>
                          )}
                        </span>
                        <span className="preview-text">{thread.latest_message}</span>
                      </div>
                      {thread.contact_name && (
                        <div className="thread-phone-number">{thread.phone_number}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Messages Panel */}
        <main className="sms-messages-main">
          {!selectedThread ? (
            <div className="no-conversation-selected">
              <div className="empty-icon-large">
                <i className="fa fa-comment-dots"></i>
              </div>
              <h2>Select a Conversation</h2>
              <p>Choose a conversation from the sidebar to view messages</p>
            </div>
          ) : (
            <>
              {/* Messages Header */}
              <div className="messages-header-bar">
                <button 
                  className="btn-back"
                  onClick={() => {
                    setSelectedThread(null);
                    setThreadMessages(null);
                    if (isMobile) {
                      setShowThreads(true);
                    }
                  }}
                  aria-label="Back to conversations"
                >
                  <i className="fa fa-arrow-left"></i>
                </button>
                <div className="contact-header-info">
                  <div className="contact-avatar-large">
                    {selectedThread.contact_name ? (
                      <span>{selectedThread.contact_name.charAt(0).toUpperCase()}</span>
                    ) : (
                      <i className="fa fa-user"></i>
                    )}
                  </div>
                  <div className="contact-details">
                    <h3>{selectedThread.contact_name || selectedThread.phone_number}</h3>
                    {selectedThread.contact_name && (
                      <span className="contact-phone">{selectedThread.phone_number}</span>
                    )}
                  </div>
                </div>
                <button 
                  className="btn-menu"
                  aria-label="More options"
                >
                  <i className="fa fa-ellipsis-v"></i>
                </button>
              </div>

              {/* Messages Body */}
              <div className="messages-content" ref={messagesContainerRef}>
                {loadingMessages ? (
                  <div className="loading-messages">
                    <div className="spinner"></div>
                    <p>Loading messages...</p>
                  </div>
                ) : threadMessages && threadMessages.thread && threadMessages.thread.length > 0 ? (
                  <div className="messages-list-wrapper">
                    {threadMessages.thread.map((msg: any, index: number) => {
                      const isSent = msg.direction === 'outgoing';
                      const showDateSeparator = index === 0 || 
                        (new Date(msg.timestamp * 1000).toDateString() !== 
                         new Date(threadMessages.thread[index - 1].timestamp * 1000).toDateString());
                      
                      return (
                        <div key={index}>
                          {showDateSeparator && (
                            <div className="date-separator">
                              <span>{formatFullDate(msg.timestamp).split(' ')[0] === 'Today' ? 'Today' : 
                                     formatFullDate(msg.timestamp).split(' ')[0] === 'Yesterday' ? 'Yesterday' :
                                     new Date(msg.timestamp * 1000).toLocaleDateString('en-US', { 
                                       weekday: 'long', 
                                       month: 'long', 
                                       day: 'numeric',
                                       year: new Date(msg.timestamp * 1000).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                     })}</span>
                            </div>
                          )}
                          <div className={`message-wrapper ${isSent ? 'sent' : 'received'}`}>
                            <div className="message-bubble">
                              <div className="message-text">{msg.body}</div>
                              <div className="message-meta">
                                <span className="message-time">
                                  {new Date(msg.timestamp * 1000).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                {isSent && (
                                  <span className="message-status">
                                    <i className="fa fa-check-double"></i>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-messages">
                    <div className="empty-icon-large">
                      <i className="fa fa-comments"></i>
                    </div>
                    <h3>No Messages</h3>
                    <p>This conversation doesn't have any messages yet.</p>
                  </div>
                )}
              </div>

              {/* Messages Footer */}
              <div className="messages-footer-bar">
                <div className="footer-info">
                  <i className="fa fa-info-circle"></i>
                  <span>SMS sending via web portal coming soon</span>
                </div>
              </div>
            </>
          )}
        </main>

        {/* Mobile Overlay */}
        {showThreads && isMobile && (
          <div className="mobile-overlay" onClick={() => setShowThreads(false)}></div>
        )}
      </div>
    </div>
  );
}
