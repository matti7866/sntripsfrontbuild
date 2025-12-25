import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import gmailService from '../../services/gmailService';
import type { GmailEmail, EmailFilters } from '../../types/email';
import './EmailInbox.css';

export default function EmailInbox() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLabel, setCurrentLabel] = useState<string>('INBOX');
  const [showSidebar, setShowSidebar] = useState(true);

  // Filters
  const filters: EmailFilters = {
    labelIds: [currentLabel],
    limit: 50
  };

  // Fetch emails
  const { data: emailsData, isLoading, error, refetch } = useQuery({
    queryKey: ['gmail-emails', currentLabel],
    queryFn: async () => {
      console.log('Fetching emails for label:', currentLabel);
      try {
        const result = await gmailService.getEmails(filters);
        console.log('Emails fetched successfully:', result);
        return result;
      } catch (error: any) {
        console.error('Error fetching emails:', error);
        console.error('Error response:', error.response?.data);
        throw error;
      }
    },
    staleTime: 30000,
    refetchInterval: 60000, // Auto-refresh every minute
    retry: 1
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => gmailService.markAsRead(id),
    onSuccess: () => {
      refetch();
    }
  });

  // Star email mutation
  const starMutation = useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) =>
      starred ? gmailService.unstarEmail(id) : gmailService.starEmail(id),
    onSuccess: () => {
      refetch();
    }
  });

  // Delete email mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => gmailService.deleteEmail(id),
    onSuccess: () => {
      Swal.fire('Success', 'Email moved to trash', 'success');
      setSelectedEmail(null);
      refetch();
    },
    onError: (error: any) => {
      Swal.fire('Error', error.response?.data?.message || 'Failed to delete email', 'error');
    }
  });

  const emails = emailsData?.data || [];

  // Handle email click
  const handleEmailClick = async (email: GmailEmail) => {
    setSelectedEmail(email);
    if (email.isUnread) {
      markAsReadMutation.mutate(email.id);
    }
  };

  // Handle compose
  const handleCompose = () => {
    setShowComposeModal(true);
  };

  // Toggle email selection
  const toggleEmailSelection = (id: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEmails(newSelected);
  };

  // Select all
  const selectAll = () => {
    if (selectedEmails.size === emails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(emails.map(e => e.id)));
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    }
  };

  // Extract sender name from email address
  const extractSenderName = (from: string) => {
    const match = from.match(/^"?([^"<]+)"?\s*<?/);
    return match ? match[1].trim() : from.split('<')[0].trim();
  };

  // Extract email address
  const extractEmail = (from: string) => {
    const match = from.match(/<([^>]+)>/);
    return match ? match[1] : from;
  };

  return (
    <div className="gmail-container">
      {/* Gmail Sidebar */}
      <div className={`gmail-sidebar ${showSidebar ? 'show' : ''}`}>
        <button className="compose-button" onClick={handleCompose}>
          <i className="fas fa-plus me-2"></i>
          Compose
        </button>

        <nav className="gmail-nav">
          <div
            className={`nav-item ${currentLabel === 'INBOX' ? 'active' : ''}`}
            onClick={() => setCurrentLabel('INBOX')}
          >
            <i className="fas fa-inbox"></i>
            <span>Inbox</span>
            {emails.filter(e => e.labels.includes('INBOX') && e.isUnread).length > 0 && (
              <span className="badge">{emails.filter(e => e.labels.includes('INBOX') && e.isUnread).length}</span>
            )}
          </div>
          <div
            className={`nav-item ${currentLabel === 'STARRED' ? 'active' : ''}`}
            onClick={() => setCurrentLabel('STARRED')}
          >
            <i className="fas fa-star"></i>
            <span>Starred</span>
          </div>
          <div
            className={`nav-item ${currentLabel === 'SENT' ? 'active' : ''}`}
            onClick={() => setCurrentLabel('SENT')}
          >
            <i className="fas fa-paper-plane"></i>
            <span>Sent</span>
          </div>
          <div
            className={`nav-item ${currentLabel === 'DRAFT' ? 'active' : ''}`}
            onClick={() => setCurrentLabel('DRAFT')}
          >
            <i className="fas fa-file"></i>
            <span>Drafts</span>
          </div>
          <div
            className={`nav-item ${currentLabel === 'SPAM' ? 'active' : ''}`}
            onClick={() => setCurrentLabel('SPAM')}
          >
            <i className="fas fa-exclamation-triangle"></i>
            <span>Spam</span>
          </div>
          <div
            className={`nav-item ${currentLabel === 'TRASH' ? 'active' : ''}`}
            onClick={() => setCurrentLabel('TRASH')}
          >
            <i className="fas fa-trash"></i>
            <span>Trash</span>
          </div>
        </nav>
      </div>

      {/* Gmail Content */}
      <div className="gmail-content">
        {/* Toolbar */}
        <div className="gmail-toolbar">
          <div className="toolbar-left">
            <button className="icon-button" onClick={() => setShowSidebar(!showSidebar)}>
              <i className="fas fa-bars"></i>
            </button>
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={selectedEmails.size === emails.length && emails.length > 0}
                onChange={selectAll}
              />
            </div>
            <button className="icon-button" onClick={() => refetch()} title="Refresh">
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>

          <div className="toolbar-center">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search mail"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    gmailService.searchEmails(searchQuery).then(result => {
                      // Handle search results
                      console.log('Search results:', result);
                    });
                  }
                }}
              />
            </div>
          </div>

          <div className="toolbar-right">
            <span className="email-count">
              {emails.length} {currentLabel === 'INBOX' ? 'emails' : currentLabel.toLowerCase()}
            </span>
          </div>
        </div>

        {/* Email List and Detail */}
        <div className="gmail-main">
          {/* Email List */}
          <div className={`email-list ${selectedEmail ? 'with-detail' : ''}`}>
            {error && (
              <div className="error-state">
                <i className="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <p>Failed to load emails</p>
                <small className="text-muted">{(error as any)?.message || 'Unknown error'}</small>
                <button className="btn btn-primary mt-3" onClick={() => refetch()}>
                  <i className="fas fa-sync-alt me-2"></i>
                  Try Again
                </button>
              </div>
            )}
            {!error && isLoading ? (
              <div className="loading-state">
                <i className="fas fa-spinner fa-spin fa-3x text-primary"></i>
                <p>Loading emails...</p>
              </div>
            ) : !error && emails.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p>No emails in {currentLabel.toLowerCase()}</p>
              </div>
            ) : !error && (
              <div className="email-list-items">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className={`email-item ${email.isUnread ? 'unread' : ''} ${selectedEmail?.id === email.id ? 'selected' : ''}`}
                    onClick={() => handleEmailClick(email)}
                  >
                    <div className="email-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedEmails.has(email.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleEmailSelection(email.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div
                      className="email-star"
                      onClick={(e) => {
                        e.stopPropagation();
                        starMutation.mutate({ id: email.id, starred: email.isStarred });
                      }}
                    >
                      <i className={`${email.isStarred ? 'fas' : 'far'} fa-star`}></i>
                    </div>
                    <div className="email-sender">
                      {extractSenderName(email.from)}
                    </div>
                    <div className="email-subject-snippet">
                      <span className="email-subject">{email.subject || '(no subject)'}</span>
                      <span className="email-snippet"> - {email.snippet}</span>
                    </div>
                    <div className="email-date">
                      {formatDate(email.date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Detail */}
          {selectedEmail && (
            <div className="email-detail">
              <div className="email-detail-header">
                <div className="detail-actions">
                  <button
                    className="icon-button"
                    onClick={() => setSelectedEmail(null)}
                    title="Back to list"
                  >
                    <i className="fas fa-arrow-left"></i>
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => deleteMutation.mutate(selectedEmail.id)}
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => {
                      if (selectedEmail.isUnread) {
                        markAsReadMutation.mutate(selectedEmail.id);
                      } else {
                        gmailService.markAsUnread(selectedEmail.id).then(() => refetch());
                      }
                    }}
                    title={selectedEmail.isUnread ? 'Mark as read' : 'Mark as unread'}
                  >
                    <i className={`fas fa-envelope${selectedEmail.isUnread ? '-open' : ''}`}></i>
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => {
                      // Reply functionality
                      setShowComposeModal(true);
                    }}
                    title="Reply"
                  >
                    <i className="fas fa-reply"></i>
                  </button>
                </div>
              </div>

              <div className="email-detail-body">
                <h2 className="email-detail-subject">{selectedEmail.subject || '(no subject)'}</h2>
                
                <div className="email-detail-meta">
                  <div className="sender-info">
                    <div className="sender-avatar">
                      {extractSenderName(selectedEmail.from).charAt(0).toUpperCase()}
                    </div>
                    <div className="sender-details">
                      <div className="sender-name">{extractSenderName(selectedEmail.from)}</div>
                      <div className="sender-email">&lt;{extractEmail(selectedEmail.from)}&gt;</div>
                    </div>
                  </div>
                  <div className="email-date-full">
                    {new Date(selectedEmail.date).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div className="email-content" dangerouslySetInnerHTML={{ __html: selectedEmail.body || selectedEmail.snippet }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showComposeModal && (
        <EmailComposeModal
          onClose={() => setShowComposeModal(false)}
          onSend={() => {
            setShowComposeModal(false);
            Swal.fire('Success', 'Email sent successfully!', 'success');
            refetch();
          }}
          replyTo={selectedEmail}
        />
      )}
    </div>
  );
}

// Compose Modal Component
interface EmailComposeModalProps {
  onClose: () => void;
  onSend: () => void;
  replyTo?: GmailEmail | null;
}

function EmailComposeModal({ onClose, onSend, replyTo }: EmailComposeModalProps) {
  const [to, setTo] = useState(replyTo ? replyTo.from.match(/<([^>]+)>/)?.[1] || replyTo.from : '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!to || !subject) {
      Swal.fire('Validation Error', 'To and Subject are required', 'warning');
      return;
    }

    setSending(true);
    try {
      const result = await gmailService.sendEmail({ to, subject, body });
      if (result.success) {
        onSend();
      } else {
        Swal.fire('Error', result.message, 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to send email', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000 }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-envelope me-2"></i>
              {replyTo ? 'Reply' : 'New Message'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSend}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">To:</label>
                <input
                  type="email"
                  className="form-control"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Subject:</label>
                <input
                  type="text"
                  className="form-control"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Message:</label>
                <textarea
                  className="form-control"
                  rows={10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message here..."
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-2"></i>
                    Send
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

