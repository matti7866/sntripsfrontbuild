import { useState } from 'react';
import './EditDataModal.css';

interface EditDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: {
    residenceID: number;
    passenger_name: string;
    passportNumber: string;
    passportExpiryDate: string | null;
    expiry_date: string | null;
    uid: string | null;
    customer_name: string;
    company_name: string;
  };
  onSave: (data: {
    passportNumber: string;
    passportExpiryDate: string;
    visaExpiryDate: string;
    uid: string;
  }) => Promise<void>;
}

export default function EditDataModal({ isOpen, onClose, record, onSave }: EditDataModalProps) {
  const [formData, setFormData] = useState({
    passportNumber: record.passportNumber || '',
    passportExpiryDate: record.passportExpiryDate && record.passportExpiryDate !== '0000-00-00' 
      ? record.passportExpiryDate 
      : '',
    visaExpiryDate: record.expiry_date && record.expiry_date !== '0000-00-00' 
      ? record.expiry_date 
      : '',
    uid: record.uid || ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.passportNumber.trim()) {
      newErrors.passportNumber = 'Passport number is required';
    }

    if (!formData.passportExpiryDate) {
      newErrors.passportExpiryDate = 'Passport expiry date is required';
    }

    if (!formData.visaExpiryDate) {
      newErrors.visaExpiryDate = 'Visa expiry date is required';
    }

    // Validate dates are in the future or at least valid
    if (formData.passportExpiryDate) {
      const passportExpiry = new Date(formData.passportExpiryDate);
      if (isNaN(passportExpiry.getTime())) {
        newErrors.passportExpiryDate = 'Invalid date';
      }
    }

    if (formData.visaExpiryDate) {
      const visaExpiry = new Date(formData.visaExpiryDate);
      if (isNaN(visaExpiry.getTime())) {
        newErrors.visaExpiryDate = 'Invalid date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      // Modal will be closed by parent component on success
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose}></div>
      <div className="modal fade show d-block" tabIndex={-1} style={{ display: 'block' }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">
                <i className="fa fa-edit me-2"></i>
                Fix Passport & Visa Data
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={onClose}
                disabled={saving}
              ></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Record Info */}
                <div className="alert alert-info mb-4">
                  <div className="row">
                    <div className="col-md-6">
                      <strong>Residence ID:</strong> #{record.residenceID}
                    </div>
                    <div className="col-md-6">
                      <strong>Passenger:</strong> {record.passenger_name}
                    </div>
                  </div>
                  <div className="row mt-2">
                    <div className="col-md-6">
                      <strong>Customer:</strong> {record.customer_name}
                    </div>
                    <div className="col-md-6">
                      <strong>Company:</strong> {record.company_name || 'N/A'}
                    </div>
                  </div>
                  {record.uid && (
                    <div className="row mt-2">
                      <div className="col-md-12">
                        <strong>Current UID:</strong> <span className="text-primary">{record.uid}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="mb-3">
                  <label className="form-label">
                    <i className="fa fa-passport me-1"></i>
                    Passport Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.passportNumber ? 'is-invalid' : ''}`}
                    value={formData.passportNumber}
                    onChange={(e) => handleChange('passportNumber', e.target.value)}
                    placeholder="Enter passport number"
                    disabled={saving}
                  />
                  {errors.passportNumber && (
                    <div className="invalid-feedback">{errors.passportNumber}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    <i className="fa fa-calendar me-1"></i>
                    Passport Expiry Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${errors.passportExpiryDate ? 'is-invalid' : ''}`}
                    value={formData.passportExpiryDate}
                    onChange={(e) => handleChange('passportExpiryDate', e.target.value)}
                    disabled={saving}
                  />
                  {errors.passportExpiryDate && (
                    <div className="invalid-feedback">{errors.passportExpiryDate}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    <i className="fa fa-calendar-check me-1"></i>
                    Visa Expiry Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${errors.visaExpiryDate ? 'is-invalid' : ''}`}
                    value={formData.visaExpiryDate}
                    onChange={(e) => handleChange('visaExpiryDate', e.target.value)}
                    disabled={saving}
                  />
                  {errors.visaExpiryDate && (
                    <div className="invalid-feedback">{errors.visaExpiryDate}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    <i className="fa fa-id-card me-1"></i>
                    UID Number (Optional)
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.uid ? 'is-invalid' : ''}`}
                    value={formData.uid}
                    onChange={(e) => handleChange('uid', e.target.value)}
                    placeholder="Enter UID number"
                    disabled={saving}
                  />
                  {errors.uid && (
                    <div className="invalid-feedback">{errors.uid}</div>
                  )}
                </div>

                {/* Help Text */}
                <div className="alert alert-warning mt-3">
                  <i className="fa fa-info-circle me-2"></i>
                  <strong>Note:</strong> Once you confirm, this record will be marked as FIXED and moved to the FIXED tab.
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={onClose}
                  disabled={saving}
                >
                  <i className="fa fa-times me-1"></i>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fa fa-spinner fa-spin me-1"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-check me-1"></i>
                      Confirm & Mark as Fixed
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

