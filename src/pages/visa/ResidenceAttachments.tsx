import React, { useState, useEffect, useRef } from 'react';
import residenceService from '../../services/residenceService';
import Swal from 'sweetalert2';
import AttachmentsModal from '../../components/residence/AttachmentsModal';
import '../../components/modals/Modal.css';
import './ResidenceAttachments.css';

interface Residence {
  residenceID: number;
  datetime: string;
  passenger_name: string;
  customer_name: string;
  company_name: string;
  passportNumber: string;
  countryName: string;
  uid: string;
  mb_number: string;
  completedStep: number;
  remarks?: string;
}

interface Attachment {
  attachment_id: number;
  residenceID: number;
  file_path: string;
  file_name: string;
  file_type: string | number;
  step_number: number;
  uploaded_at?: string;
}

interface ResidenceWithAttachments extends Residence {
  attachmentCount: number;
  attachments: Attachment[];
  missingDocuments: string[];
}

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

const REQUIRED_DOCUMENTS = [
  { step: 1, name: 'Offer Letter', icon: 'fa-envelope' },
  { step: 2, name: 'Insurance', icon: 'fa-shield' },
  { step: 3, name: 'Labour Card', icon: 'fa-credit-card' },
  { step: 4, name: 'E-Visa', icon: 'fa-ticket' },
  { step: 5, name: 'Change Status', icon: 'fa-exchange' },
  { step: 6, name: 'Medical', icon: 'fa-medkit' },
  { step: 7, name: 'Emirates ID', icon: 'fa-id-card' },
  { step: 8, name: 'Visa Stamping', icon: 'fa-stamp' },
];

// File type options for selection
const FILE_TYPE_OPTIONS = [
  { value: 1, label: 'Passport Copy', icon: 'fa-passport', step: 0 },
  { value: 2, label: 'Offer Letter', icon: 'fa-envelope', step: 1 },
  { value: 3, label: 'Insurance', icon: 'fa-shield', step: 2 },
  { value: 4, label: 'Labour Card', icon: 'fa-credit-card', step: 3 },
  { value: 5, label: 'E-Visa', icon: 'fa-ticket', step: 4 },
  { value: 6, label: 'Change Status', icon: 'fa-exchange', step: 5 },
  { value: 7, label: 'Medical', icon: 'fa-medkit', step: 6 },
  { value: 8, label: 'Emirates ID', icon: 'fa-id-card', step: 7 },
  { value: 9, label: 'Visa Stamping', icon: 'fa-stamp', step: 8 },
  { value: 11, label: 'Photo', icon: 'fa-camera', step: 0 },
  { value: 12, label: 'ID Front', icon: 'fa-id-badge', step: 0 },
  { value: 13, label: 'ID Back', icon: 'fa-id-badge', step: 0 },
  { value: 14, label: 'Other', icon: 'fa-file', step: 0 },
];

export default function ResidenceAttachments() {
  const [residences, setResidences] = useState<ResidenceWithAttachments[]>([]);
  const [filteredResidences, setFilteredResidences] = useState<ResidenceWithAttachments[]>([]);
  const [paginatedResidences, setPaginatedResidences] = useState<ResidenceWithAttachments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResidence, setSelectedResidence] = useState<ResidenceWithAttachments | null>(null);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [uploadingResidenceId, setUploadingResidenceId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOverResidenceId, setDragOverResidenceId] = useState<number | null>(null);
  
  // File type selection modal state
  const [showFileTypeModal, setShowFileTypeModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingResidenceId, setPendingResidenceId] = useState<number | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<{ fileType: number; stepNumber: number } | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    loadResidences();
  }, []);

  useEffect(() => {
    filterResidences();
  }, [searchQuery, residences]);

  useEffect(() => {
    paginateResidences();
  }, [filteredResidences, currentPage, itemsPerPage]);

  const loadResidences = async () => {
    setLoading(true);
    try {
      // Load all residences from all steps
      const steps = ['1', '1a', '2', '3', '4', '4a', '5', '6', '7', '8', '9'];
      const allResidences: Residence[] = [];
      
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

      // Remove duplicates
      const uniqueResidences = allResidences.reduce((acc, current) => {
        const existing = acc.find(item => item.residenceID === current.residenceID);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, [] as Residence[]);

      // Load attachments for each residence
      const residencesWithAttachments = await Promise.all(
        uniqueResidences.map(async (residence) => {
          try {
            const residenceId = (residence as any).familyResidenceID || residence.residenceID;
            const attachments = await residenceService.getAttachments(residenceId);
            const attachmentCount = Array.isArray(attachments) ? attachments.length : 0;
            
            // Determine missing documents based on completed step
            const missingDocuments: string[] = [];
            REQUIRED_DOCUMENTS.forEach(doc => {
              if (residence.completedStep < doc.step) {
                const hasDoc = attachments.some((att: Attachment) => 
                  att.step_number === doc.step || 
                  (doc.step === 4 && att.step_number === 4) // E-Visa
                );
                if (!hasDoc) {
                  missingDocuments.push(doc.name);
                }
              }
            });

            return {
              ...residence,
              attachmentCount,
              attachments: Array.isArray(attachments) ? attachments : [],
              missingDocuments
            };
          } catch (error) {
            console.error(`Error loading attachments for residence ${residence.residenceID}:`, error);
            return {
              ...residence,
              attachmentCount: 0,
              attachments: [],
              missingDocuments: []
            };
          }
        })
      );

      // Sort by latest residences first (datetime descending)
      const sortedResidences = residencesWithAttachments.sort((a, b) => {
        const dateA = new Date(a.datetime || 0).getTime();
        const dateB = new Date(b.datetime || 0).getTime();
        return dateB - dateA; // Latest first
      });

      setResidences(sortedResidences);
      setFilteredResidences(sortedResidences);
      setCurrentPage(1); // Reset to first page when data loads
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to load residences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterResidences = () => {
    if (!searchQuery.trim()) {
      setFilteredResidences(residences);
      setCurrentPage(1); // Reset to first page when filter changes
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = residences.filter(residence =>
      residence.passenger_name?.toLowerCase().includes(query) ||
      residence.passportNumber?.toLowerCase().includes(query) ||
      residence.customer_name?.toLowerCase().includes(query) ||
      residence.company_name?.toLowerCase().includes(query) ||
      residence.uid?.toLowerCase().includes(query) ||
      residence.mb_number?.toLowerCase().includes(query) ||
      residence.residenceID.toString().includes(query)
    );

    setFilteredResidences(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const paginateResidences = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredResidences.slice(startIndex, endIndex);
    setPaginatedResidences(paginated);
  };

  const totalPages = Math.ceil(filteredResidences.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleOpenAttachments = (residence: ResidenceWithAttachments) => {
    setSelectedResidence(residence);
    setShowAttachmentsModal(true);
  };

  const openFileTypeSelection = (file: File, residenceId: number) => {
    setPendingFile(file);
    setPendingResidenceId(residenceId);
    setSelectedFileType(null);
    setShowFileTypeModal(true);
  };

  const handleFileTypeConfirm = async () => {
    if (!selectedFileType || !pendingFile || !pendingResidenceId) {
      Swal.fire('Error', 'Please select a document type', 'error');
      return;
    }

    setShowFileTypeModal(false);
    setUploadingResidenceId(pendingResidenceId);

    try {
      await residenceService.uploadAttachment(
        pendingResidenceId,
        selectedFileType.stepNumber,
        pendingFile,
        selectedFileType.fileType
      );

      Swal.fire({
        icon: 'success',
        title: 'Uploaded!',
        text: 'File uploaded successfully',
        timer: 2000,
        showConfirmButton: false
      });

      // Reload residences to update attachment counts
      await loadResidences();
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to upload file', 'error');
    } finally {
      setUploadingResidenceId(null);
      setPendingFile(null);
      setPendingResidenceId(null);
      setSelectedFileType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileTypeCancel = () => {
    setShowFileTypeModal(false);
    setPendingFile(null);
    setPendingResidenceId(null);
    setSelectedFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleQuickUpload = (residenceId: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    openFileTypeSelection(file, residenceId);
  };

  const handleDragOver = (e: React.DragEvent, residenceId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverResidenceId(residenceId);
  };

  const handleDragLeave = () => {
    setDragOverResidenceId(null);
  };

  const handleDrop = async (e: React.DragEvent, residenceId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverResidenceId(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Use the same upload handler which will show the file type selection
      await handleQuickUpload(residenceId, files);
    }
  };

  const getStatusBadge = (residence: ResidenceWithAttachments) => {
    if (residence.missingDocuments.length === 0 && residence.attachmentCount > 0) {
      return <span className="badge bg-success">Complete</span>;
    }
    if (residence.missingDocuments.length > 0) {
      return <span className="badge bg-warning text-dark">{residence.missingDocuments.length} Missing</span>;
    }
    return <span className="badge bg-secondary">No Documents</span>;
  };

  return (
    <div className="residence-attachments-page">
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">
              <i className="fa fa-paperclip me-2"></i>
              Residence Attachments
            </h2>
            <p className="text-muted mb-0">Manage documents and attachments for residence records</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={loadResidences}
            disabled={loading}
          >
            <i className="fa fa-refresh me-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fa fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, passport, company, UID, MB number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex justify-content-end align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <label className="text-muted mb-0">Items per page:</label>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto' }}
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  >
                    <option value={6}>6</option>
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>
                <span className="text-muted">
                  Showing {paginatedResidences.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredResidences.length)} of {filteredResidences.length} residences
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Residences Grid */}
      {loading ? (
        <div className="text-center py-5">
          <i className="fa fa-spinner fa-spin fa-3x text-primary"></i>
          <p className="mt-3">Loading residences...</p>
        </div>
      ) : filteredResidences.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="fa fa-inbox fa-3x text-muted mb-3"></i>
            <h5>No residences found</h5>
            <p className="text-muted">Try adjusting your search criteria</p>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-4">
            {paginatedResidences.map((residence) => (
            <div key={residence.residenceID} className="col-md-6 col-lg-4">
              <div
                className={`card residence-card h-100 ${dragOverResidenceId === residence.residenceID ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, residence.residenceID)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, residence.residenceID)}
              >
                <div className="card-body">
                  {/* Header */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="card-title mb-1">
                        {residence.passenger_name || 'N/A'}
                      </h5>
                      <small className="text-muted">
                        ID: {residence.residenceID}
                      </small>
                    </div>
                    {getStatusBadge(residence)}
                  </div>

                  {/* Residence Info */}
                  <div className="residence-info mb-3">
                    <div className="info-item">
                      <i className="fa fa-passport me-2 text-primary"></i>
                      <span>{residence.passportNumber || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <i className="fa fa-building me-2 text-primary"></i>
                      <span>{residence.company_name || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <i className="fa fa-user me-2 text-primary"></i>
                      <span>{residence.customer_name || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <i className="fa fa-flag me-2 text-primary"></i>
                      <span>{residence.countryName || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <i className="fa fa-layer-group me-2 text-primary"></i>
                      <span>Step: {STEP_NAMES[residence.completedStep] || residence.completedStep}</span>
                    </div>
                  </div>

                  {/* Attachment Stats */}
                  <div className="attachment-stats mb-3 p-3 bg-light rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <i className="fa fa-paperclip me-2 text-primary"></i>
                        <strong>{residence.attachmentCount}</strong> attachments
                      </div>
                      {residence.missingDocuments.length > 0 && (
                        <div className="text-warning">
                          <i className="fa fa-exclamation-triangle me-1"></i>
                          {residence.missingDocuments.length} missing
                        </div>
                      )}
                    </div>
                    {residence.missingDocuments.length > 0 && (
                      <div className="mt-2">
                        <small className="text-muted">Missing: {residence.missingDocuments.join(', ')}</small>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary btn-sm flex-fill"
                      onClick={() => handleOpenAttachments(residence)}
                    >
                      <i className="fa fa-folder-open me-1"></i>
                      Manage
                    </button>
                    <label
                      className={`btn btn-success btn-sm flex-fill ${uploadingResidenceId === residence.residenceID ? 'disabled' : ''}`}
                      style={{ cursor: 'pointer', margin: 0 }}
                    >
                      {uploadingResidenceId === residence.residenceID ? (
                        <>
                          <i className="fa fa-spinner fa-spin me-1"></i>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-upload me-1"></i>
                          Quick Upload
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) => handleQuickUpload(residence.residenceID, e.target.files)}
                        accept="image/*,.pdf,.doc,.docx"
                        disabled={uploadingResidenceId === residence.residenceID}
                      />
                    </label>
                  </div>

                  {/* Drag & Drop Hint */}
                  <div className="text-center mt-2">
                    <small className="text-muted">
                      <i className="fa fa-hand-pointer me-1"></i>
                      Drag & drop files here
                    </small>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="card mt-4">
              <div className="card-body">
                <nav aria-label="Residence attachments pagination">
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      >
                        <i className="fa fa-angle-double-left"></i>
                      </button>
                    </li>
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="fa fa-angle-left"></i>
                      </button>
                    </li>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 2 && page <= currentPage + 2)
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <li className="page-item disabled">
                                <span className="page-link">...</span>
                              </li>
                            )}
                            <li className={`page-item ${currentPage === page ? 'active' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            </li>
                          </React.Fragment>
                        );
                      })}

                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="fa fa-angle-right"></i>
                      </button>
                    </li>
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="fa fa-angle-double-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </>
      )}

      {/* Attachments Modal */}
      {selectedResidence && (
        <AttachmentsModal
          isOpen={showAttachmentsModal}
          onClose={() => {
            setShowAttachmentsModal(false);
            setSelectedResidence(null);
            loadResidences(); // Reload to refresh counts
          }}
          residence={selectedResidence}
        />
      )}

      {/* File Type Selection Modal */}
      {showFileTypeModal && pendingFile && (
        <div className="modal-overlay" onClick={handleFileTypeCancel}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>
                <i className="fa fa-file-upload me-2"></i>
                Select Document Type
              </h3>
              <button className="modal-close" onClick={handleFileTypeCancel}>
                <i className="fa fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="mb-4 p-3 bg-light rounded">
                <p className="mb-2">
                  <strong>File:</strong> {pendingFile.name}
                </p>
                <p className="mb-0 text-muted">
                  <strong>Size:</strong> {(pendingFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <div className="file-type-selection" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {FILE_TYPE_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`file-type-option ${selectedFileType?.fileType === option.value ? 'selected' : ''}`}
                    onClick={() => setSelectedFileType({ fileType: option.value, stepNumber: option.step })}
                    style={{
                      padding: '14px',
                      margin: '8px 0',
                      border: selectedFileType?.fileType === option.value ? '2px solid #667eea' : '2px solid #e9ecef',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: selectedFileType?.fileType === option.value ? '#f0f4ff' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedFileType?.fileType !== option.value) {
                        e.currentTarget.style.borderColor = '#cbd5e0';
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedFileType?.fileType !== option.value) {
                        e.currentTarget.style.borderColor = '#e9ecef';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <i className={`fa ${option.icon}`} style={{ fontSize: '20px', color: '#667eea', width: '24px' }}></i>
                    <span style={{ fontWeight: '500', flex: 1 }}>{option.label}</span>
                    {selectedFileType?.fileType === option.value && (
                      <i className="fa fa-check-circle" style={{ color: '#667eea' }}></i>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleFileTypeCancel}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFileTypeConfirm}
                disabled={!selectedFileType || uploadingResidenceId === pendingResidenceId}
              >
                {uploadingResidenceId === pendingResidenceId ? (
                  <>
                    <i className="fa fa-spinner fa-spin me-2"></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fa fa-upload me-2"></i>
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
