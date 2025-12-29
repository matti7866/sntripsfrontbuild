import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import residenceService from '../../services/residenceService';
import Swal from 'sweetalert2';
import CreateResidenceModal from '../../components/residence/CreateResidenceModal';
import './ResidenceList.css';

interface ResidenceWithDetails {
  residenceID: number;
  datetime: string;
  passenger_name: string;
  customer_name: string;
  company_name: string;
  passportNumber: string;
  countryName: string;
  countryCode: string;
  sale_price: number;
  paid_amount: number;
  completedStep: number;
  hold: number;
  cancelled: number;
  remarks: string;
  visa_type_name: string;
  uid: string;
  mb_number: string;
  LabourCardNumber: string;
  sale_currency_symbol: string;
  // Step dates for calculating time in step
  offerLetterDate?: string;
  insuranceDate?: string;
  laborCardDate?: string;
  eVisaDate?: string;
  changeStatusDate?: string;
  medicalDate?: string;
  emiratesIDDate?: string;
  visaStampingDate?: string;
  contractSubmissionDate?: string;
}

// Map step numbers to names
const STEP_NAMES: Record<number, string> = {
  0: 'New',
  1: 'Offer Letter',
  2: 'Offer Letter (Submitted)',
  3: 'Insurance',
  4: 'Labour Card',
  5: 'E-Visa',
  6: 'Change Status',
  7: 'Medical',
  8: 'Emirates ID',
  9: 'Visa Stamping',
  10: 'Completed'
};

export default function ResidenceList() {
  const navigate = useNavigate();
  const [residences, setResidences] = useState<ResidenceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Search and Filters
  const [search, setSearch] = useState('');
  const [stepFilter, setStepFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, active, hold, cancelled
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [createResidenceModalOpen, setCreateResidenceModalOpen] = useState(false);
  const [fullLookups, setFullLookups] = useState<any>(null);

  useEffect(() => {
    loadResidences();
    loadLookups();
  }, []);

  const loadLookups = async () => {
    try {
      const data = await residenceService.getLookups();
      setFullLookups(data);
    } catch (error) {
      console.error('Error loading lookups:', error);
    }
  };

  const loadResidences = async () => {
    setLoading(true);
    setError('');
    try {
      // Get all residences from all steps
      const steps = ['1', '1a', '2', '3', '4', '4a', '5', '6', '7', '8', '9', '10'];
      const allResidences: ResidenceWithDetails[] = [];
      
      for (const step of steps) {
        try {
          const data = await residenceService.getTasks({ step, search: '' });
          if (data && data.residences) {
            allResidences.push(...data.residences);
          }
        } catch (err) {
          console.error(`Error loading step ${step}:`, err);
        }
      }
      
      // Remove duplicates based on residenceID
      const uniqueResidences = allResidences.reduce((acc, current) => {
        const existing = acc.find(item => item.residenceID === current.residenceID);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, [] as ResidenceWithDetails[]);
      
      setResidences(uniqueResidences);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while loading residences');
      Swal.fire('Error', error, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate time in current step
  const calculateTimeInStep = (residence: ResidenceWithDetails): string => {
    const stepDates: Record<number, string | undefined> = {
      1: residence.offerLetterDate,
      3: residence.insuranceDate,
      4: residence.laborCardDate,
      5: residence.eVisaDate,
      6: residence.changeStatusDate,
      7: residence.medicalDate,
      8: residence.emiratesIDDate,
      9: residence.visaStampingDate,
      10: residence.contractSubmissionDate
    };

    const stepDate = stepDates[residence.completedStep] || residence.datetime;
    
    if (!stepDate) return 'N/A';
    
    const stepStartDate = new Date(stepDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - stepStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;
    
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    
    if (months === 1 && remainingDays === 0) return '1 month';
    if (months === 1) return `1 month ${remainingDays} days`;
    if (remainingDays === 0) return `${months} months`;
    return `${months} months ${remainingDays} days`;
  };

  // Filter residences
  const getFilteredResidences = () => {
    let filtered = [...residences];

    // Exclude completed residences (step 9 and above)
    filtered = filtered.filter(r => r.completedStep < 9);

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(r => 
        r.passenger_name.toLowerCase().includes(searchLower) ||
        r.passportNumber?.toLowerCase().includes(searchLower) ||
        r.customer_name?.toLowerCase().includes(searchLower) ||
        r.company_name?.toLowerCase().includes(searchLower) ||
        r.uid?.toLowerCase().includes(searchLower) ||
        r.mb_number?.toLowerCase().includes(searchLower) ||
        r.residenceID.toString().includes(searchLower)
      );
    }

    // Step filter
    if (stepFilter !== 'all') {
      filtered = filtered.filter(r => r.completedStep === parseInt(stepFilter));
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(r => r.hold === 0 && r.cancelled === 0);
    } else if (statusFilter === 'hold') {
      filtered = filtered.filter(r => r.hold === 1);
    } else if (statusFilter === 'cancelled') {
      filtered = filtered.filter(r => r.cancelled === 1);
    }

    // Sort by date - most recent first
    filtered.sort((a, b) => {
      const dateA = new Date(a.datetime).getTime();
      const dateB = new Date(b.datetime).getTime();
      return dateB - dateA; // Descending order (newest first)
    });

    return filtered;
  };

  const filteredResidences = getFilteredResidences();
  const totalPages = Math.ceil(filteredResidences.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResidences = filteredResidences.slice(startIndex, endIndex);

  // Calculate totals
  const calculateTotals = () => {
    const totals = filteredResidences.reduce((acc, residence) => {
      // Convert to numbers to ensure proper addition (not concatenation)
      const salePrice = Number(residence.sale_price) || 0;
      const paidAmount = Number(residence.paid_amount) || 0;
      
      acc.totalSale += salePrice;
      acc.totalPaid += paidAmount;
      acc.totalBalance += (salePrice - paidAmount);
      return acc;
    }, { totalSale: 0, totalPaid: 0, totalBalance: 0 });
    
    return totals;
  };

  const totals = calculateTotals();

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const getStatusBadge = (residence: ResidenceWithDetails) => {
    if (residence.cancelled === 1) {
      return <span className="badge bg-danger">Cancelled</span>;
    }
    if (residence.hold === 1) {
      return <span className="badge bg-warning text-dark">On Hold</span>;
    }
    if (residence.completedStep === 9) {
      return <span className="badge bg-success">Completed</span>;
    }
    return <span className="badge bg-primary">In Progress</span>;
  };

  const getBalancePercentage = (residence: ResidenceWithDetails): number => {
    if (residence.sale_price === 0) return 0;
    return Math.round((residence.paid_amount / residence.sale_price) * 100);
  };

  const formatCurrency = (amount: number, symbol: string = 'AED') => {
    return `${symbol} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="residence-list-page">
        <div className="text-center py-8">
          <i className="fa fa-spinner fa-spin fa-2x" style={{ color: '#9ca3af' }}></i>
          <p className="mt-2" style={{ color: '#6b7280' }}>Loading all residences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="residence-list-page-compact">
      {/* Compact Header */}
      <div className="compact-header">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div>
            <h1 className="mb-0" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#000000' }}>
              <i className="fa fa-list me-2"></i>
              In-Progress Residences ({filteredResidences.length})
            </h1>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-sm btn-secondary" 
              onClick={() => navigate('/residence/tasks')}
            >
              <i className="fa fa-arrow-left me-1"></i>
              Back
            </button>
            <button 
              className="btn btn-sm btn-primary" 
              onClick={() => setCreateResidenceModalOpen(true)}
            >
              <i className="fa fa-plus-circle me-1"></i>
              Add New
            </button>
          </div>
        </div>
        
        {/* Compact Filters Row */}
        <div className="d-flex gap-2 mb-2 flex-wrap">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{ flex: '1', minWidth: '200px' }}
          />
          <select 
            className="form-select form-select-sm"
            value={stepFilter}
            onChange={(e) => {
              setStepFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: '180px' }}
          >
            <option value="all">All Steps</option>
            {Object.entries(STEP_NAMES)
              .filter(([value]) => parseInt(value) < 10)
              .map(([value, label]) => (
                <option key={value} value={value}>
                  Step {value} - {label}
                </option>
              ))}
          </select>
          <select 
            className="form-select form-select-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: '140px' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              setSearch('');
              setStepFilter('all');
              setStatusFilter('all');
              setCurrentPage(1);
            }}
          >
            <i className="fa fa-times"></i>
          </button>
        </div>
      </div>

      {/* Summary Cards - Above Table */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'nowrap' }}>
        <div className="card summary-card" style={{ flex: '1', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', minWidth: 0 }}>
          <div className="card-body text-white" style={{ padding: '10px 12px' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sale</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {totals.totalSale.toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '24px', opacity: 0.3, flexShrink: 0, marginLeft: '8px' }}>
                <i className="fa fa-dollar-sign"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="card summary-card" style={{ flex: '1', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', border: 'none', minWidth: 0 }}>
          <div className="card-body text-white" style={{ padding: '10px 12px' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Paid</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {totals.totalPaid.toLocaleString()}
                </div>
                <div style={{ fontSize: '9px', opacity: 0.9, marginTop: '2px' }}>
                  {totals.totalSale > 0 && isFinite(totals.totalPaid / totals.totalSale) 
                    ? Math.round((totals.totalPaid / totals.totalSale) * 100) 
                    : 0}% collected
                </div>
              </div>
              <div style={{ fontSize: '24px', opacity: 0.3, flexShrink: 0, marginLeft: '8px' }}>
                <i className="fa fa-check-circle"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="card summary-card" style={{ flex: '1', background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)', border: 'none', minWidth: 0 }}>
          <div className="card-body text-white" style={{ padding: '10px 12px' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Balance</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {totals.totalBalance.toLocaleString()}
                </div>
                <div style={{ fontSize: '9px', opacity: 0.9, marginTop: '2px' }}>
                  Outstanding
                </div>
              </div>
              <div style={{ fontSize: '24px', opacity: 0.3, flexShrink: 0, marginLeft: '8px' }}>
                <i className="fa fa-exclamation-circle"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table - Below Cards */}
      <div className="card compact-table-card">
        <div className="card-body p-2">
          {error && (
            <div className="alert alert-danger alert-sm mb-2">
              {error}
            </div>
          )}
          
          {filteredResidences.length === 0 ? (
            <div className="text-center py-4">
              <p style={{ color: '#6b7280', fontSize: '14px' }}>No residences found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-striped table-bordered align-middle compact-table">
                <thead>
                  <tr>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>ID</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>
                      Date <i className="fa fa-arrow-down" style={{ fontSize: '8px' }}></i>
                    </th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Passenger</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Passport</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Customer</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Company</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Step</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Time</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Sale</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Paid</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Balance</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResidences.map((residence) => {
                    const balancePercentage = getBalancePercentage(residence);
                    const balance = residence.sale_price - residence.paid_amount;
                    
                    return (
                      <tr 
                        key={residence.residenceID} 
                        className={
                          residence.hold === 1 ? 'bg-hold' : 
                          residence.cancelled === 1 ? 'bg-cancelled' : ''
                        }
                        style={{ fontSize: '12px' }}
                      >
                        <td style={{ padding: '4px 6px' }}>
                          <strong style={{ fontSize: '12px' }}>#{residence.residenceID}</strong>
                        </td>
                        <td style={{ padding: '4px 6px', fontSize: '11px' }}>{formatDate(residence.datetime)}</td>
                        <td style={{ padding: '4px 6px' }}>
                          <div style={{ fontSize: '11px' }}>
                            <img
                              src={`https://flagpedia.net/data/flags/h24/${residence.countryCode?.toLowerCase()}.png`}
                              alt={residence.countryName}
                              height="10"
                              className="me-1"
                            />
                            <strong style={{ fontSize: '11px' }}>{residence.passenger_name.toUpperCase()}</strong>
                          </div>
                          {residence.uid && (
                            <div className="text-muted" style={{ fontSize: '9px' }}>
                              UID: {residence.uid}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '4px 6px', fontSize: '11px' }}>{residence.passportNumber || '-'}</td>
                        <td style={{ padding: '4px 6px', fontSize: '11px' }}>{residence.customer_name || '-'}</td>
                        <td style={{ padding: '4px 6px', fontSize: '11px' }}>
                          {residence.company_name ? (
                            <>
                              <strong style={{ fontSize: '11px' }}>{residence.company_name}</strong>
                              {residence.mb_number && (
                                <div className="text-muted" style={{ fontSize: '9px' }}>
                                  MB: {residence.mb_number}
                                </div>
                              )}
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <span className="badge bg-info" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            {residence.completedStep}
                          </span>
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <span className="badge bg-secondary" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            {calculateTimeInStep(residence)}
                          </span>
                        </td>
                        <td className="price-cell" style={{ padding: '4px 6px' }}>
                          <strong style={{ fontSize: '11px' }}>
                            {residence.sale_price.toLocaleString()}
                          </strong>
                        </td>
                        <td className="price-cell" style={{ padding: '4px 6px' }}>
                          <span className="text-success" style={{ fontSize: '11px', fontWeight: '600' }}>
                            {residence.paid_amount.toLocaleString()}
                          </span>
                          <div className="text-muted" style={{ fontSize: '9px' }}>
                            {balancePercentage}%
                          </div>
                        </td>
                        <td className="price-cell" style={{ padding: '4px 6px' }}>
                          <span className={balance > 0 ? 'balance-negative' : 'balance-positive'} style={{ fontSize: '11px', fontWeight: '600' }}>
                            {balance.toLocaleString()}
                          </span>
                        </td>
                        <td style={{ padding: '4px 6px' }}>{getStatusBadge(residence)}</td>
                        <td style={{ padding: '4px 6px' }}>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-xs btn-primary"
                              onClick={() => navigate(`/residence/${residence.residenceID}`)}
                              title="View Details"
                              style={{ padding: '2px 6px', fontSize: '11px' }}
                            >
                              <i className="fa fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-xs btn-info"
                              onClick={() => navigate(`/residence/tasks?step=${residence.completedStep}`)}
                              title="Go to Step Tasks"
                              style={{ padding: '2px 6px', fontSize: '11px' }}
                            >
                              <i className="fa fa-tasks"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot style={{ background: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'right', fontWeight: 'bold', padding: '6px 8px', fontSize: '11px' }}>
                      TOTALS:
                    </td>
                    <td className="price-cell" style={{ fontWeight: 'bold', fontSize: '12px', background: '#f3f4f6', padding: '6px 8px' }}>
                      {totals.totalSale.toLocaleString()}
                    </td>
                    <td className="price-cell" style={{ fontWeight: 'bold', fontSize: '12px', background: '#f3f4f6', padding: '6px 8px' }}>
                      <span className="text-success">
                        {totals.totalPaid.toLocaleString()}
                      </span>
                      <div className="text-muted" style={{ fontSize: '9px' }}>
                        {totals.totalSale > 0 && isFinite(totals.totalPaid / totals.totalSale)
                          ? Math.round((totals.totalPaid / totals.totalSale) * 100) 
                          : 0}%
                      </div>
                    </td>
                    <td className="price-cell" style={{ fontWeight: 'bold', fontSize: '12px', background: '#f3f4f6', padding: '6px 8px' }}>
                      <span className="balance-negative">
                        {totals.totalBalance.toLocaleString()}
                      </span>
                    </td>
                    <td colSpan={2} style={{ background: '#f3f4f6', padding: '6px 8px' }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          
          {/* Compact Pagination */}
          {filteredResidences.length > 0 && (
            <div className="pagination-container" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '8px 12px',
              borderTop: '1px solid #e5e7eb',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '12px'
            }}>
              {/* Items per page selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Show</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  ({startIndex + 1}-{Math.min(endIndex, filteredResidences.length)} of {filteredResidences.length})
                </span>
              </div>

              {/* Page navigation */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      color: currentPage === 1 ? '#9ca3af' : '#374151'
                    }}
                  >
                    <i className="fa fa-angle-double-left"></i>
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      color: currentPage === 1 ? '#9ca3af' : '#374151'
                    }}
                  >
                    <i className="fa fa-angle-left"></i>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          backgroundColor: currentPage === pageNum ? '#000000' : '#ffffff',
                          color: currentPage === pageNum ? '#ffffff' : '#374151',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: currentPage === pageNum ? '600' : '400',
                          minWidth: '28px'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      color: currentPage === totalPages ? '#9ca3af' : '#374151'
                    }}
                  >
                    <i className="fa fa-angle-right"></i>
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      color: currentPage === totalPages ? '#9ca3af' : '#374151'
                    }}
                  >
                    <i className="fa fa-angle-double-right"></i>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Residence Modal */}
      {fullLookups && (
        <CreateResidenceModal
          isOpen={createResidenceModalOpen}
          onClose={() => setCreateResidenceModalOpen(false)}
          onSuccess={() => {
            setCreateResidenceModalOpen(false);
            loadResidences();
          }}
          lookups={{
            customers: fullLookups.customers || [],
            nationalities: (fullLookups.nationalities || []).map((n: any) => ({
              nationality_id: n.airport_id || n.nationality_id,
              nationality_name: n.countryName || n.nationality_name
            })),
            currencies: fullLookups.currencies || [],
            positions: (fullLookups.positions || []).map((p: any) => ({
              position_id: p.position_id,
              position_name: p.posiiton_name || p.position_name
            }))
          }}
        />
      )}
    </div>
  );
}
