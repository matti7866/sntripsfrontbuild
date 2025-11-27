import { useState } from 'react';
import type { Residence } from '../../types/residence';
import '../modals/Modal.css';

interface CancelResidenceModalProps {
  residence: Residence | null;
  onCancel: (charges: number, remarks: string) => void;
  onClose: () => void;
}

export default function CancelResidenceModal({ residence, onCancel, onClose }: CancelResidenceModalProps) {
  const [charges, setCharges] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!remarks.trim()) {
      alert('Please provide cancellation remarks');
      return;
    }

    if (confirm(`Are you sure you want to cancel this residence?\n\nPassenger: ${residence?.passenger_name}\nCancellation Charges: AED ${charges}\n\nThis action cannot be undone.`)) {
      setSaving(true);
      try {
        await onCancel(charges, remarks);
      } finally {
        setSaving(false);
      }
    }
  };

  if (!residence) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header bg-danger text-white">
          <h3><i className="fa fa-times-circle me-2"></i>Cancel Residence</h3>
          <button className="modal-close" onClick={onClose} style={{ color: 'white' }}>
            <i className="fa fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="mb-3">Cancelling residence for: <strong>{residence.passenger_name}</strong></p>

            {/* Warning Alert */}
            <div className="alert alert-danger mb-3">
              <i className="fa fa-exclamation-triangle me-2"></i>
              <strong>Warning:</strong> This action cannot be undone. The residence will be permanently marked as cancelled.
            </div>

            {/* Residence Info */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label"><strong>Residence ID:</strong></label>
                <input type="text" className="form-control" value={`#${residence.residenceID}`} readOnly />
              </div>
              <div className="col-md-6">
                <label className="form-label"><strong>Customer:</strong></label>
                <input type="text" className="form-control" value={residence.customer_name} readOnly />
              </div>
            </div>

            {/* Cancellation Charges */}
            <div className="mb-3">
              <label className="form-label"><strong>Cancellation Charges (AED): <span className="text-danger">*</span></strong></label>
              <input
                type="number"
                className="form-control"
                value={charges}
                onChange={(e) => setCharges(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                required
                placeholder="Enter cancellation charges (0 if no charge)"
              />
              <small className="text-muted">Amount to charge the customer for cancellation</small>
            </div>

            {/* Remarks */}
            <div className="mb-3">
              <label className="form-label"><strong>Cancellation Reason: <span className="text-danger">*</span></strong></label>
              <textarea
                className="form-control"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                required
                rows={3}
                placeholder="Explain why this residence is being cancelled..."
              />
              <small className="text-muted">This will be saved in the cancellation record</small>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              <i className="fa fa-times"></i> Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Cancelling...
                </>
              ) : (
                <>
                  <i className="fa fa-times-circle me-2"></i>
                  Confirm Cancellation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}















