import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import residenceService from '../../services/residenceService';
import Swal from 'sweetalert2';
import SearchableSelect from '../../components/common/SearchableSelect';
import AttachmentsModal from '../../components/residence/AttachmentsModal';
import './VisaExpiry.css';

interface ResidenceExpiry {
  residenceID: number;
  datetime: string;
  passenger_name: string;
  customer_name: string;
  customer_id: number;
  company_name: string;
  passportNumber: string;
  passportExpiryDate: string | null;
  countryName: string;
  countryCode: string;
  expiry_date: string | null;
  uid: string;
  sale_price: number;
  paid_amount: number;
  completedStep: number;
}

export default function VisaExpiry() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'upcoming';
  
  const [residences, setResidences] = useState<ResidenceExpiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('0');
  const [companies, setCompanies] = useState<Array<{ company_id: number; company_name: string }>>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDate, setEditingDate] = useState<string>('');
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedResidenceId, setSelectedResidenceId] = useState<number | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    loadExpiryData();
  }, [currentTab, selectedCompany]);

  const loadCompanies = async () => {
    try {
      const data = await residenceService.getCompanies();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadExpiryData = async () => {
    setLoading(true);
    try {
      const data = await residenceService.getVisaExpiry({ 
        status: currentTab,
        company_id: selectedCompany !== '0' ? selectedCompany : undefined,
        search: searchQuery || undefined 
      });
      setResidences(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading expiry data:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to load expiry data', 'error');
      setResidences([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    setSearchQuery(search);
    setCurrentPage(1);
    loadExpiryData();
  };

  const handleEditClick = (residence: ResidenceExpiry) => {
    setEditingId(residence.residenceID);
    setEditingDate(residence.expiry_date || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingDate('');
  };

  const handleSaveDate = async (residenceID: number) => {
    if (!editingDate) {
      Swal.fire('Error', 'Please select a valid date', 'error');
      return;
    }

    try {
      await residenceService.updateExpiryDate(residenceID, editingDate);
      Swal.fire('Success', 'Expiry date updated successfully', 'success');
      setEditingId(null);
      setEditingDate('');
      loadExpiryData();
    } catch (error: any) {
      console.error('Error updating expiry date:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to update expiry date', 'error');
    }
  };

  const getDaysUntilExpiry = (expiryDate: string | null): number | null => {
    if (!expiryDate || expiryDate === '0000-00-00') return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    // Check if date is valid
    if (isNaN(expiry.getTime())) return null;
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryBadgeClass = (days: number | null): string => {
    if (days === null) return 'bg-secondary';
    if (days < 0) return 'bg-danger';
    if (days <= 7) return 'bg-danger';
    if (days <= 30) return 'bg-warning';
    if (days <= 60) return 'bg-info';
    return 'bg-success';
  };

  const getExpiryText = (days: number | null): string => {
    if (days === null) return 'No date';
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `${days} days left`;
  };

  // Filter and paginate
  const filteredResidences = residences.filter(r => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.passenger_name.toLowerCase().includes(query) ||
      r.customer_name.toLowerCase().includes(query) ||
      r.passportNumber.toLowerCase().includes(query) ||
      r.uid?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredResidences.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResidences = filteredResidences.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="visa-expiry-page">
      {/* Header */}
      <div className="card mb-3">
        <div className="card-body p-3">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h1 className="mb-0" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#000000' }}>
                <i className="fa fa-calendar-times me-2"></i>
                Visa Expiry Management ({filteredResidences.length})
              </h1>
              <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Monitor and manage visa expiry dates</p>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-3">
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search by passenger, customer, passport, or UID..."
              />
              <button type="submit" className="btn btn-primary">
                <i className="fa fa-search"></i>
              </button>
            </div>
          </form>

          {/* Company Filter */}
          <div>
            <label className="form-label mb-1" style={{ color: '#374151', fontWeight: 500, fontSize: '12px' }}>
              Filter by Company
            </label>
            <SearchableSelect
              options={[
                { value: '0', label: 'All Companies' },
                ...companies.map((company) => ({
                  value: String(company.company_id),
                  label: company.company_name
                }))
              ]}
              value={selectedCompany}
              onChange={(value) => {
                setSelectedCompany(String(value));
                setCurrentPage(1);
              }}
              placeholder="Select Company"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-3">
        <div className="card-body p-2">
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn ${currentTab === 'upcoming' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleTabChange('upcoming')}
            >
              <i className="fa fa-clock me-1"></i>
              Upcoming Expiry
            </button>
            <button
              type="button"
              className={`btn ${currentTab === 'expired' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => handleTabChange('expired')}
            >
              <i className="fa fa-exclamation-triangle me-1"></i>
              Expired
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="card-body p-2">
          {loading ? (
            <div className="text-center py-4">
              <i className="fa fa-spinner fa-spin fa-2x" style={{ color: '#9ca3af' }}></i>
              <p className="mt-2" style={{ color: '#6b7280', fontSize: '14px' }}>Loading...</p>
            </div>
          ) : paginatedResidences.length === 0 ? (
            <div className="text-center py-4">
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                {currentTab === 'upcoming' ? 'No upcoming expiries found' : 'No expired visas found'}
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-sm table-striped table-bordered align-middle">
                  <thead>
                    <tr>
                      <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>ID</th>
                      <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Passenger</th>
                      <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Customer</th>
                      <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Company</th>
                      <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Passport</th>
                      <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Passport Expiry</th>
                      <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Visa Expiry</th>
                      <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResidences.map((residence) => {
                      const daysUntilExpiry = getDaysUntilExpiry(residence.expiry_date);
                      const isEditing = editingId === residence.residenceID;

                      return (
                        <tr key={residence.residenceID} style={{ fontSize: '12px' }}>
                          <td style={{ padding: '4px 6px' }}>
                            <strong>#{residence.residenceID}</strong>
                          </td>
                          <td style={{ padding: '4px 6px' }}>
                            <div style={{ fontSize: '11px' }}>
                              <img
                                src={`https://flagpedia.net/data/flags/h24/${residence.countryCode?.toLowerCase()}.png`}
                                alt={residence.countryName}
                                height="10"
                                className="me-1"
                              />
                              <strong>{residence.passenger_name.toUpperCase()}</strong>
                            </div>
                            {residence.uid && (
                              <div className="text-muted" style={{ fontSize: '9px' }}>
                                UID: {residence.uid}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '4px 6px', fontSize: '11px' }}>{residence.customer_name}</td>
                          <td style={{ padding: '4px 6px', fontSize: '11px' }}>{residence.company_name || 'N/A'}</td>
                          <td style={{ padding: '4px 6px', fontSize: '11px' }}>{residence.passportNumber}</td>
                          <td style={{ padding: '4px 6px', fontSize: '11px' }}>
                            {residence.passportExpiryDate ? (
                              new Date(residence.passportExpiryDate).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })
                            ) : (
                              <span className="text-muted">Not set</span>
                            )}
                          </td>
                          <td style={{ padding: '4px 6px' }}>
                            {isEditing ? (
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={editingDate}
                                onChange={(e) => setEditingDate(e.target.value)}
                                style={{ fontSize: '11px', padding: '2px 4px' }}
                              />
                            ) : (
                              <div style={{ fontSize: '11px' }}>
                                {residence.expiry_date && residence.expiry_date !== '0000-00-00' ? (
                                  <>
                                    <div>{new Date(residence.expiry_date).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}</div>
                                  </>
                                ) : (
                                  <span className="text-muted">Not set</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '4px 6px' }}>
                            <span 
                              className={`badge ${getExpiryBadgeClass(daysUntilExpiry)}`}
                              style={{ fontSize: '9px', padding: '2px 6px' }}
                            >
                              {getExpiryText(daysUntilExpiry)}
                            </span>
                          </td>
                          <td style={{ padding: '4px 6px' }}>
                            <div className="d-flex gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    className="btn btn-xs btn-success"
                                    style={{ padding: '2px 6px', fontSize: '11px' }}
                                    onClick={() => handleSaveDate(residence.residenceID)}
                                  >
                                    <i className="fa fa-check"></i> Save
                                  </button>
                                  <button
                                    className="btn btn-xs btn-secondary"
                                    style={{ padding: '2px 6px', fontSize: '11px' }}
                                    onClick={handleCancelEdit}
                                  >
                                    <i className="fa fa-times"></i> Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-xs btn-primary"
                                    style={{ padding: '2px 6px', fontSize: '11px' }}
                                    onClick={() => handleEditClick(residence)}
                                    title="Edit Expiry Date"
                                  >
                                    <i className="fa fa-edit"></i>
                                  </button>
                                  <button
                                    className="btn btn-xs btn-warning"
                                    style={{ padding: '2px 6px', fontSize: '11px' }}
                                    onClick={() => {
                                      setSelectedResidenceId(residence.residenceID);
                                      setShowAttachmentsModal(true);
                                    }}
                                    title="View/Upload Attachments"
                                  >
                                    <i className="fa fa-paperclip"></i>
                                  </button>
                                  <a
                                    href={`/residence/${residence.residenceID}`}
                                    target="_blank"
                                    className="btn btn-xs btn-info"
                                    style={{ padding: '2px 6px', fontSize: '11px' }}
                                    title="View Details"
                                  >
                                    <i className="fa fa-eye"></i>
                                  </a>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredResidences.length > itemsPerPage && (
                <div className="pagination-container" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '8px 12px',
                  borderTop: '1px solid #e5e7eb',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Show</span>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      ({startIndex + 1}-{Math.min(endIndex, filteredResidences.length)} of {filteredResidences.length})
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      <i className="fa fa-angle-left"></i>
                    </button>
                    
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
                        fontSize: '12px'
                      }}
                    >
                      <i className="fa fa-angle-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Attachments Modal */}
      {selectedResidenceId && residences.find(r => r.residenceID === selectedResidenceId) && (
        <AttachmentsModal
          isOpen={showAttachmentsModal}
          onClose={() => {
            setShowAttachmentsModal(false);
            setSelectedResidenceId(null);
          }}
          residence={residences.find(r => r.residenceID === selectedResidenceId) as any}
          onLoadAttachments={async (residenceID) => {
            const data = await residenceService.getAttachments(residenceID);
            return Array.isArray(data) ? data : [];
          }}
          onUploadAttachment={async (residenceID, stepNumber, file, fileType) => {
            await residenceService.uploadAttachment(residenceID, stepNumber, file, fileType);
          }}
          onDeleteAttachment={async (attachmentId) => {
            await residenceService.deleteAttachment(attachmentId);
          }}
        />
      )}
    </div>
  );
}

