import { useState, useEffect } from 'react';
import residenceService from '../../services/residenceService';
import Swal from 'sweetalert2';
import '../modals/Modal.css';

interface HiddenResidence {
  residenceID: number;
  datetime: string;
  passenger_name: string;
  customer_name: string;
  company_name: string;
  passportNumber: string;
  countryName: string;
  countryCode: string;
  completedStep: number;
  sale_price: number;
  paid_amount: number;
}

interface HiddenResidencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const steps = [
  { value: '1', label: '1 - Offer Letter' },
  { value: '1a', label: '1a - Offer Letter (Submitted)' },
  { value: '2', label: '2 - Insurance' },
  { value: '3', label: '3 - Labour Card' },
  { value: '4', label: '4 - E-Visa' },
  { value: '4a', label: '4a - E-Visa (Submitted)' },
  { value: '5', label: '5 - Change Status' },
  { value: '6', label: '6 - Medical' },
  { value: '7', label: '7 - Emirates ID' },
  { value: '8', label: '8 - Visa Stamping' },
  { value: '9', label: '9 - Completed' },
];

export default function HiddenResidencesModal({ isOpen, onClose, onSuccess }: HiddenResidencesModalProps) {
  const [residences, setResidences] = useState<HiddenResidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResidences, setSelectedResidences] = useState<Set<number>>(new Set());
  const [targetStep, setTargetStep] = useState<string>('1');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHiddenResidences();
      setSelectedResidences(new Set());
      setSelectAll(false);
      setTargetStep('1');
    }
  }, [isOpen]);

  const loadHiddenResidences = async () => {
    setLoading(true);
    try {
      // Fetch residences with step 0 and NULL
      const data = await residenceService.getTasks({ 
        step: '0,null', // Fetch both step 0 and NULL steps
        _t: Date.now() // Cache buster
      });
      
      if (data && data.residences) {
        const residencesArray = Array.isArray(data.residences) ? data.residences : [];
        setResidences(residencesArray);
      } else {
        setResidences([]);
      }
    } catch (error: any) {
      console.error('Error loading hidden residences:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to load hidden residences', 'error');
      setResidences([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResidence = (residenceId: number) => {
    const newSelected = new Set(selectedResidences);
    if (newSelected.has(residenceId)) {
      newSelected.delete(residenceId);
    } else {
      newSelected.add(residenceId);
    }
    setSelectedResidences(newSelected);
    setSelectAll(newSelected.size === residences.length && residences.length > 0);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedResidences(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(residences.map(r => r.residenceID));
      setSelectedResidences(allIds);
      setSelectAll(true);
    }
  };

  const handleMoveResidences = async () => {
    if (selectedResidences.size === 0) {
      Swal.fire('Warning', 'Please select at least one residence to move', 'warning');
      return;
    }

    if (!targetStep) {
      Swal.fire('Warning', 'Please select a target step', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm Move',
      html: `
        <div class="text-start">
          <p>Are you sure you want to move <strong>${selectedResidences.size}</strong> residence(s) to <strong>Step ${targetStep}</strong>?</p>
          <div class="alert alert-info mt-3" style="font-size: 12px;">
            <strong>Note:</strong> This will change the step for all selected residences.
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Move',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d',
    });

    if (result.isConfirmed) {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      try {
        for (const residenceId of selectedResidences) {
          try {
            await residenceService.moveResidenceToStep(residenceId, targetStep);
            successCount++;
          } catch (error: any) {
            errorCount++;
            errors.push(`Residence #${residenceId}: ${error.response?.data?.message || error.message}`);
          }
        }

        // Show results
        if (errorCount === 0) {
          await Swal.fire({
            title: 'Success!',
            html: `Successfully moved ${successCount} residence(s) to Step ${targetStep}`,
            icon: 'success',
            confirmButtonColor: '#007bff'
          });
        } else {
          await Swal.fire({
            title: 'Partial Success',
            html: `
              <div class="text-start">
                <p><strong>Moved:</strong> ${successCount} residence(s)</p>
                <p><strong>Failed:</strong> ${errorCount} residence(s)</p>
                ${errors.length > 0 ? `
                  <div class="alert alert-danger mt-3" style="font-size: 11px; max-height: 200px; overflow-y: auto;">
                    <strong>Errors:</strong><br>
                    ${errors.map(e => `• ${e}`).join('<br>')}
                  </div>
                ` : ''}
              </div>
            `,
            icon: 'warning',
            confirmButtonColor: '#007bff'
          });
        }

        // Reset selections and reload
        setSelectedResidences(new Set());
        setSelectAll(false);
        await loadHiddenResidences();
        onSuccess();
      } catch (error: any) {
        Swal.fire('Error', 'An unexpected error occurred', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container" 
        style={{ maxWidth: '1200px', width: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h3>
            <i className="fa fa-eye-slash"></i>
            Hidden Residences (Step 0 / NULL)
          </h3>
          <button className="modal-close-btn" onClick={onClose} disabled={loading}>
            <i className="fa fa-times"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto' }}>
          {loading && residences.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-spinner fa-spin fa-2x text-primary"></i>
              <p className="mt-3">Loading hidden residences...</p>
            </div>
          ) : residences.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-check-circle fa-3x text-success"></i>
              <p className="mt-3 text-muted">No hidden residences found. All residences are assigned to steps!</p>
            </div>
          ) : (
            <>
              {/* Action Bar */}
              <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                <div className="d-flex align-items-center gap-3">
                  <div>
                    <strong>Selected: {selectedResidences.size} / {residences.length}</strong>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <label className="mb-0" style={{ fontWeight: '500' }}>Move to Step:</label>
                    <select 
                      className="form-select form-select-sm"
                      value={targetStep} 
                      onChange={(e) => setTargetStep(e.target.value)}
                      style={{ width: 'auto', minWidth: '200px' }}
                      disabled={loading}
                    >
                      {steps.map(step => (
                        <option key={step.value} value={step.value}>
                          {step.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleMoveResidences}
                    disabled={selectedResidences.size === 0 || loading}
                  >
                    <i className="fa fa-arrow-right me-2"></i>
                    Move Selected
                  </button>
                </div>
              </div>

              {/* Residences Table */}
              <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                <table className="table table-striped table-bordered table-hover table-sm">
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <tr>
                      <th style={{ width: '50px', textAlign: 'center' }}>
                        <input 
                          type="checkbox"
                          className="form-check-input"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          disabled={loading}
                        />
                      </th>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Passenger</th>
                      <th>Customer</th>
                      <th>Company</th>
                      <th>Passport</th>
                      <th>Sale Price</th>
                      <th>Paid Amount</th>
                      <th>Current Step</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residences.map((residence) => (
                      <tr 
                        key={residence.residenceID}
                        style={{ cursor: 'pointer' }}
                        onClick={() => !loading && handleSelectResidence(residence.residenceID)}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedResidences.has(residence.residenceID)}
                            onChange={() => handleSelectResidence(residence.residenceID)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={loading}
                          />
                        </td>
                        <td><strong>#{residence.residenceID}</strong></td>
                        <td style={{ fontSize: '12px' }}>
                          {new Date(residence.datetime).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            {residence.countryCode && (
                              <img
                                src={`https://flagpedia.net/data/flags/h24/${residence.countryCode.toLowerCase()}.png`}
                                alt={residence.countryName}
                                height="12"
                              />
                            )}
                            <strong style={{ fontSize: '12px' }}>{residence.passenger_name.toUpperCase()}</strong>
                          </div>
                        </td>
                        <td style={{ fontSize: '12px' }}>{residence.customer_name}</td>
                        <td style={{ fontSize: '12px' }}>{residence.company_name || '-'}</td>
                        <td style={{ fontSize: '12px' }}>{residence.passportNumber}</td>
                        <td style={{ fontSize: '12px' }}>{residence.sale_price?.toLocaleString() || '0'}</td>
                        <td style={{ fontSize: '12px' }}>
                          {residence.paid_amount?.toLocaleString() || '0'}
                          {' '}
                          <span 
                            className={residence.paid_amount === residence.sale_price ? 'text-success' : 'text-danger'}
                            style={{ fontSize: '11px', fontWeight: '600' }}
                          >
                            ({residence.sale_price > 0 ? Math.round((residence.paid_amount / residence.sale_price) * 100) : 0}%)
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-danger">
                            {residence.completedStep === null || residence.completedStep === undefined ? 'NULL' : `Step ${residence.completedStep}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Info Alert */}
              <div className="alert alert-info mt-3" style={{ fontSize: '13px' }}>
                <strong><i className="fa fa-info-circle me-2"></i>Information:</strong>
                <ul className="mb-0 mt-2">
                  <li>These residences are currently in <strong>Step 0 or have NULL steps</strong> and are hidden from the main tasks view.</li>
                  <li>Select one or more residences and choose a target step to move them.</li>
                  <li>Click on a row to select/deselect it, or use the checkbox in the header to select all.</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={loading}
          >
            <i className="fa fa-times me-1"></i>
            Close
          </button>
          {residences.length > 0 && (
            <button 
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleMoveResidences}
              disabled={selectedResidences.size === 0 || loading}
            >
              <i className="fa fa-arrow-right me-1"></i>
              Move {selectedResidences.size > 0 ? `${selectedResidences.size} ` : ''}Selected
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
