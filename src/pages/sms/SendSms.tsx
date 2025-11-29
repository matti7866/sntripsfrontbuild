import React, { useState } from 'react';
import { Panel, PanelHeader, PanelBody } from '../../coloradmin-components/panel/panel';
import { smsService } from '../../services/smsService';
import './SendSms.css';

interface SmsRequest {
  msg: string;
  recipient: string;
  sender: string;
  category: string;
}

const SendSms: React.FC = () => {
  const [formData, setFormData] = useState<SmsRequest>({
    msg: '',
    recipient: '',
    sender: 'SNTRAVEL',
    category: 'TXN',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await smsService.sendSms(formData);
      
      if (response.success) {
        setResult({ type: 'success', message: response.message });
        // Clear the message field after successful send
        setFormData((prev) => ({ ...prev, msg: '' }));
      } else {
        setResult({ type: 'error', message: response.message });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ol className="breadcrumb float-xl-end">
        <li className="breadcrumb-item">
          <a href="#/">Home</a>
        </li>
        <li className="breadcrumb-item active">Send SMS</li>
      </ol>
      <h1 className="page-header">
        Send SMS <small>Send SMS notifications to customers</small>
      </h1>

      <div className="row">
        <div className="col-xl-8">
          <Panel>
            <PanelHeader>SMS Message Form</PanelHeader>
            <PanelBody>

              {result && (
                <div className={`alert alert-${result.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
                  <strong>{result.type === 'success' ? 'Success!' : 'Error!'}</strong> {result.message}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setResult(null)}
                  ></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Recipient Phone Number <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="recipient"
                    value={formData.recipient}
                    onChange={handleChange}
                    placeholder="e.g., 971501652906"
                    required
                  />
                  <small className="form-text text-muted">
                    Enter phone number with country code (e.g., 971 for UAE)
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Sender ID <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="sender"
                    value={formData.sender}
                    onChange={handleChange}
                    placeholder="SNTRAVEL"
                    required
                  />
                  <small className="form-text text-muted">
                    Sender name that will appear on the recipient's phone
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Category <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="TXN">Transactional (TXN)</option>
                    <option value="PRO">Promotional (PRO)</option>
                    <option value="OTP">OTP</option>
                  </select>
                  <small className="form-text text-muted">
                    Select the category of the SMS message
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Message <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control"
                    name="msg"
                    value={formData.msg}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Enter your message here..."
                    required
                  />
                  <small className="form-text text-muted">
                    Characters: {formData.msg.length} | SMS count: {Math.ceil(formData.msg.length / 160) || 1}
                  </small>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-paper-plane me-2"></i>
                        Send SMS
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setFormData({
                        msg: '',
                        recipient: '',
                        sender: 'SNTRAVEL',
                        category: 'TXN',
                      });
                      setResult(null);
                    }}
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </PanelBody>
          </Panel>
        </div>

        <div className="col-xl-4">
          <Panel>
            <PanelHeader>SMS Guidelines</PanelHeader>
            <PanelBody>
              <div className="alert alert-info">
                <h6 className="alert-heading">Important Notes:</h6>
                <ul className="mb-0 ps-3">
                  <li>Include country code in phone number</li>
                  <li>1 SMS = 160 characters</li>
                  <li>Use TXN for transactional messages</li>
                  <li>Use PRO for promotional messages</li>
                  <li>Use OTP for verification codes</li>
                </ul>
              </div>

              <h6 className="mt-4">Testing Tips:</h6>
              <p className="small text-muted">
                Start with a test phone number to verify the SMS delivery before sending to customers.
              </p>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default SendSms;

