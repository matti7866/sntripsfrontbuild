import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './PendingPaymentsModal.css';

interface Payment {
  transaction_number: string;
  person_name: string;
  pay_card_number: string;
  card_number: string;
  card_expiry_date: string;
  transaction_type?: string;
  remarks?: string;
}

interface PendingPaymentsData {
  company_code: string;
  company_name: string;
  total_payments: number;
  payments: Payment[];
}

interface ResidenceCardData {
  company_name?: string;
  company_code?: string;
  category?: string;
  classification?: string;
  person_name?: string;
  designation?: string;
  expiry_date?: string;
  employee_classification?: string;
  permit_number?: string;
  permit_type?: string;
  permit_active?: string;
  payment_number?: string;
  paycard_number?: string;
  person_code?: string;
  transaction_number?: string;
}

interface PendingPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyNumber: string;
  companyName: string;
}

export default function PendingPaymentsModal({ isOpen, onClose, companyNumber, companyName }: PendingPaymentsModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentsData, setPaymentsData] = useState<PendingPaymentsData | null>(null);
  const [residenceCardData, setResidenceCardData] = useState<ResidenceCardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rcError, setRcError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pending' | 'residence'>('pending');

  // Function to decode HTML entities
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Filter payments based on search query
  const filteredPayments = paymentsData?.payments?.filter((payment) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const decodedPersonName = decodeHtmlEntities(payment.person_name).toLowerCase();
    const decodedTransactionType = payment.transaction_type ? decodeHtmlEntities(payment.transaction_type).toLowerCase() : '';
    const decodedRemarks = payment.remarks ? decodeHtmlEntities(payment.remarks).toLowerCase() : '';
    
    return (
      payment.transaction_number.toLowerCase().includes(query) ||
      decodedPersonName.includes(query) ||
      payment.pay_card_number.toLowerCase().includes(query) ||
      payment.card_number.toLowerCase().includes(query) ||
      payment.card_expiry_date.toLowerCase().includes(query) ||
      decodedTransactionType.includes(query) ||
      decodedRemarks.includes(query)
    );
  }) || [];

  useEffect(() => {
    if (isOpen && companyNumber) {
      fetchPendingPayments();
      fetchResidenceCardInfo();
      setSearchQuery(''); // Reset search when modal opens
    }
  }, [isOpen, companyNumber]);

  const fetchPendingPayments = async () => {
    if (!companyNumber) {
      setError('Company number not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.sntrips.com/trx/pendingPayments.php?companyCode=${companyNumber}`);
      const data = await response.json();

      if (data.status === 'success') {
        setPaymentsData(data.data);
      } else {
        setError(data.message || 'Failed to fetch pending payments');
      }
    } catch (err: any) {
      console.error('Error fetching pending payments:', err);
      setError('Failed to fetch pending payments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResidenceCardInfo = async () => {
    if (!companyNumber) {
      setRcError('Company number not available');
      return;
    }

    setRcError(null);

    try {
      const response = await fetch(`https://api.sntrips.com/residence-card-info.php?companyCode=${companyNumber}`);
      const data = await response.json();

      if (data.status === 'success' && data.data) {
        setResidenceCardData({
          company_name: data.data.company_info?.company_name,
          company_code: data.data.company_info?.company_code,
          category: data.data.company_info?.category,
          classification: data.data.company_info?.classification,
          person_name: data.data.residence_info?.person_name,
          designation: data.data.residence_info?.designation,
          expiry_date: data.data.residence_info?.expiry_date,
          employee_classification: data.data.residence_info?.employee_classification,
          permit_number: data.data.residence_info?.card_number,
          permit_type: data.data.residence_info?.card_type,
          permit_active: data.data.residence_info?.card_active,
          payment_number: data.data.residence_info?.payment_number,
          paycard_number: data.data.residence_info?.paycard_number,
          person_code: data.data.residence_info?.person_code,
          transaction_number: data.data.residence_info?.transaction_number
        });
      } else {
        setRcError(data.message || 'Failed to fetch residence card information');
      }
    } catch (err: any) {
      console.error('Error fetching residence card info:', err);
      setRcError('Failed to fetch residence card information. Please try again.');
    }
  };

  const handleRefresh = () => {
    setSearchQuery(''); // Reset search on refresh
    if (activeTab === 'pending') {
      fetchPendingPayments();
    } else {
      fetchResidenceCardInfo();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show pending-payments-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', padding: 0, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-scrollable" style={{ maxWidth: '50vw', width: '50vw', margin: '25vh auto', height: '50vh', maxHeight: '50vh', padding: 0, position: 'relative', top: 0, transform: 'none' }}>
        <div className="modal-content" style={{ height: '50vh', maxHeight: '50vh', display: 'flex', flexDirection: 'column', borderRadius: '0.5rem', margin: 0, border: 'none' }}>
          <div className="modal-header bg-primary text-white" style={{ flexShrink: 0 }}>
            <h5 className="modal-title">
              <i className="fa fa-money-bill-wave me-2"></i>
              Pending Payments - {companyName}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body" style={{ overflowY: 'auto', flex: '1 1 auto', padding: '1rem' }}>
            {loading ? (
              <div className="text-center py-5">
                <i className="fa fa-spinner fa-spin fa-3x text-primary"></i>
                <p className="mt-3 text-muted">Loading pending payments...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger">
                <i className="fa fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            ) : paymentsData ? (
              <>
                <div className="card mb-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <strong>Company Code:</strong>
                        <p className="mb-0">{paymentsData.company_code}</p>
                      </div>
                      <div className="col-md-4">
                        <strong>Company Name:</strong>
                        <p className="mb-0">{decodeHtmlEntities(paymentsData.company_name || companyName)}</p>
                      </div>
                      <div className="col-md-4">
                        <strong>Total Pending Payments:</strong>
                        <p className="mb-0">
                          <span className="badge bg-danger" style={{ fontSize: '1rem' }}>
                            {paymentsData.total_payments}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fa fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by transaction number, person name, card number, expiry date..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setSearchQuery('')}
                        title="Clear search"
                      >
                        <i className="fa fa-times"></i>
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <small className="text-muted mt-1 d-block">
                      Showing {filteredPayments.length} of {paymentsData.payments.length} payments
                    </small>
                  )}
                </div>

                {paymentsData.payments && paymentsData.payments.length > 0 ? (
                  filteredPayments.length > 0 ? (
                    <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', flex: '1 1 auto' }}>
                      <table className="table table-striped table-bordered table-hover" style={{ width: '100%', fontSize: '0.9rem', marginBottom: 0 }}>
                        <thead className="table-dark">
                          <tr>
                            <th style={{ width: '4%', textAlign: 'center' }}>#</th>
                            <th style={{ width: '18%' }}>Transaction No</th>
                            <th style={{ width: '28%' }}>Person Name</th>
                            <th style={{ width: '16%' }}>Pay Card Number</th>
                            <th style={{ width: '14%' }}>Card Number</th>
                            <th style={{ width: '20%', textAlign: 'center' }}>Card Expiry Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.map((payment, index) => (
                            <tr key={index}>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>{index + 1}</td>
                              <td style={{ verticalAlign: 'middle' }}>
                                <strong>{payment.transaction_number}</strong>
                                {payment.transaction_type && (
                                  <>
                                    <br />
                                    <small className="text-muted">{decodeHtmlEntities(payment.transaction_type)}</small>
                                  </>
                                )}
                                {payment.remarks && (
                                  <>
                                    <br />
                                    <small className="text-info">
                                      <i className="fa fa-info-circle me-1"></i>
                                      {decodeHtmlEntities(payment.remarks)}
                                    </small>
                                  </>
                                )}
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>{decodeHtmlEntities(payment.person_name)}</td>
                              <td style={{ verticalAlign: 'middle' }}>{payment.pay_card_number}</td>
                              <td style={{ verticalAlign: 'middle' }}>{payment.card_number}</td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <span className="badge bg-warning text-dark">
                                  {payment.card_expiry_date}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="alert alert-warning text-center">
                      <i className="fa fa-search fa-3x mb-3"></i>
                      <h5>No Results Found</h5>
                      <p className="mb-0">No payments match your search query: "<strong>{searchQuery}</strong>"</p>
                    </div>
                  )
                ) : (
                  <div className="alert alert-success text-center">
                    <i className="fa fa-check-circle fa-3x mb-3"></i>
                    <h5>No Pending Payments</h5>
                    <p className="mb-0">All payments have been processed for this company.</p>
                  </div>
                )}
              </>
            ) : null}
          </div>

          <div className="modal-footer" style={{ flexShrink: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={handleRefresh} disabled={loading}>
              <i className="fa fa-refresh me-2"></i>
              Refresh
            </button>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

