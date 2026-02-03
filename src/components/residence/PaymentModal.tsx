import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import residenceService from '../../services/residenceService';
import walletService from '../../services/walletService';
import mailerooService from '../../services/mailerooService';
import { sendPaymentConfirmation } from '../../services/whatsappService';
import type { Residence } from '../../types/residence';
import '../modals/Modal.css';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  residence: Residence | null;
  accounts: Array<{ accountID: number; accountName: string }>;
  currencies?: Array<{ currencyID: number; currencyName: string }>;
  isFamilyResidence?: boolean;
}

interface UnifiedBreakdown {
  residence_outstanding: number;
  fine_outstanding: number;
  cancellation_outstanding: number;
  custom_charges_outstanding: number;
  total_outstanding: number;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSubmit,
  residence,
  accounts,
  isFamilyResidence = false
}: PaymentModalProps) {
  const [breakdown, setBreakdown] = useState<UnifiedBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'account' | 'wallet'>('account');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [formData, setFormData] = useState({
    paymentAmount: '',
    accountID: '',
    remarks: 'Unified payment for all outstanding charges'
  });

  useEffect(() => {
    if (isOpen && residence) {
      loadBreakdown();
      loadWalletBalance();
    }
  }, [isOpen, residence]);

  const loadWalletBalance = async () => {
    if (!residence) return;
    
    const customerID = residence.customer_id || (residence as any).customerID;
    if (!customerID) return;
    
    setLoadingWallet(true);
    try {
      const data = await walletService.getBalance(customerID);
      setWalletBalance(data.wallet_balance || 0);
    } catch (error) {
      console.log('No wallet found for customer or error loading wallet:', error);
      setWalletBalance(0);
    } finally {
      setLoadingWallet(false);
    }
  };

  const loadBreakdown = async () => {
    if (!residence) return;

    setLoading(true);
    try {
      if (isFamilyResidence) {
        // For family residence, calculate outstanding directly
        const salePrice = parseFloat(residence.sale_price as any) || 0;
        const paidAmount = parseFloat((residence as any).paid_amount as any) || 0;
        const outstanding = salePrice - paidAmount;
        
        setBreakdown({
          residence_outstanding: outstanding,
          fine_outstanding: 0,
          cancellation_outstanding: 0,
          custom_charges_outstanding: 0,
          total_outstanding: outstanding
        });
        
        if (outstanding > 0) {
          setFormData(prev => ({
            ...prev,
            paymentAmount: outstanding.toFixed(2)
          }));
        }
      } else {
        const data = await residenceService.getUnifiedOutstanding(residence.residenceID);
        setBreakdown(data);
        
        // Set default payment amount to total outstanding
        if (data.total_outstanding > 0) {
          setFormData(prev => ({
            ...prev,
            paymentAmount: data.total_outstanding.toFixed(2)
          }));
        }
      }
    } catch (error) {
      console.error('Error loading breakdown:', error);
      Swal.fire('Error', 'Failed to load payment information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendPaymentNotifications = async (paymentAmount: number, paymentMethodUsed: string, accountId?: number) => {
    if (!residence) return;

    const customerEmail = (residence as any).customer_email || (residence as any).customerEmail || '';
    const passengerName = residence.passenger_name || 'Customer';
    const residenceID = residence.residenceID;
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Check if account_id is 25 - if so, skip customer notifications
    const skipCustomerNotifications = accountId === 25;
    
    if (skipCustomerNotifications) {
      console.log('⚠️ Account ID 25 detected - Skipping customer email and WhatsApp notifications');
    }

    // Send admin notification
    try {
      await mailerooService.sendNotification({
        to: 'selabnadirydxb@gmail.com',
        subject: `Visa Payment Received - ${passengerName}`,
        message: `
          <p><strong>A visa payment has been received</strong></p>
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Passenger Name:</strong> ${passengerName}</p>
            <p style="margin: 5px 0;"><strong>Reference ID:</strong> #${residenceID}</p>
            <p style="margin: 5px 0;"><strong>Payment Amount:</strong> ${paymentAmount.toFixed(2)} AED</p>
            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethodUsed}</p>
            <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${currentDate}</p>
            ${customerEmail ? `<p style="margin: 5px 0;"><strong>Customer Email:</strong> ${customerEmail}</p>` : ''}
          </div>
          <p>This is an automated notification from the payment system.</p>
        `,
        type: 'success'
      });
      console.log('Admin notification sent successfully');
    } catch (error) {
      console.error('Failed to send admin notification:', error);
    }

    // Send customer confirmation (only if email exists and not account 25)
    if (customerEmail && !skipCustomerNotifications) {
      try {
        await mailerooService.sendNotification({
          to: customerEmail,
          subject: 'Visa Payment Confirmation - SN Travels',
          message: `
            <p>Dear ${passengerName},</p>
            <p>Thank you for your payment. We have successfully received your visa payment.</p>
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="margin: 5px 0;"><strong>Payment Details:</strong></p>
              <p style="margin: 5px 0;"><strong>Reference ID:</strong> #${residenceID}</p>
              <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ${paymentAmount.toFixed(2)} AED</p>
              <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethodUsed}</p>
              <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${currentDate}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #10b981;">✓ Confirmed</span></p>
            </div>
            <p>Your visa payment has been processed successfully. If you have any questions, please don't hesitate to contact us.</p>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              Thank you for choosing SN Travels & Tourism.
            </p>
          `,
          type: 'success'
        });
        console.log('Customer confirmation sent successfully to:', customerEmail);
      } catch (error) {
        console.error('Failed to send customer confirmation:', error);
      }
    }

    // Send WhatsApp confirmation (if phone number exists and not account 25)
    // Try multiple possible phone field names from residence data
    const customerPhone = (residence as any).mobile || 
                         (residence as any).customer_phone || 
                         (residence as any).customerPhone || 
                         (residence as any).phone || 
                         '';
    
    console.log('Customer phone from residence:', customerPhone);
    console.log('Skip customer notifications:', skipCustomerNotifications);
    
    if (customerPhone && customerPhone.length >= 10 && !skipCustomerNotifications) {
      try {
        console.log('Sending WhatsApp payment confirmation to:', customerPhone);
        const whatsappResult = await sendPaymentConfirmation({
          to: customerPhone,
          reference_id: residenceID.toString(),
          amount: paymentAmount.toFixed(2),
          payment_method: paymentMethodUsed
        });
        
        if (whatsappResult.success) {
          console.log('✅ WhatsApp payment confirmation sent!', whatsappResult.message_sid);
        } else {
          console.error('❌ WhatsApp failed:', whatsappResult.error);
        }
      } catch (error) {
        console.error('❌ Exception sending WhatsApp:', error);
      }
    } else if (skipCustomerNotifications) {
      console.log('ℹ️ Customer notifications skipped (Account ID 25)');
    } else {
      console.warn('⚠️ No customer phone number found for WhatsApp. Phone:', customerPhone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!residence || !breakdown) return;

    const paymentAmount = parseFloat(formData.paymentAmount);
    const customerID = residence.customer_id || (residence as any).customerID;

    // Validation
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      Swal.fire('Validation Error', 'Please enter a valid payment amount', 'error');
      return;
    }

    if (paymentMethod === 'account' && !formData.accountID) {
      Swal.fire('Validation Error', 'Please select a payment account', 'error');
      return;
    }

    if (paymentMethod === 'wallet' && paymentAmount > walletBalance) {
      Swal.fire('Insufficient Balance', `Wallet balance (${walletBalance.toFixed(2)} AED) is less than payment amount`, 'error');
      return;
    }

    if (paymentAmount > breakdown.total_outstanding) {
      Swal.fire('Validation Error', 'Payment amount cannot exceed total outstanding', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (paymentMethod === 'wallet') {
        // Process wallet payment - deducts from wallet and records transaction
        await walletService.payFromWallet({
          customerID,
          amount: paymentAmount,
          referenceType: isFamilyResidence ? 'family_residence' : 'residence',
          referenceID: residence.residenceID,
          currencyID: 1,
          remarks: formData.remarks || `Payment for ${isFamilyResidence ? 'Family ' : ''}Residence #${residence.residenceID}`
        });
        
        // Also process the residence payment record (this links payment to residence in the system)
        if (isFamilyResidence) {
          await residenceService.processFamilyPayment({
            familyResidenceID: residence.residenceID,
            paymentAmount,
            accountID: 38, // Special account ID for wallet payments
            remarks: `Paid from Wallet - ${formData.remarks}`,
            paymentMethod: 'wallet'
          });
        } else {
          await residenceService.processUnifiedPayment({
            residenceID: residence.residenceID,
            paymentAmount,
            accountID: 38, // Special account ID for wallet payments
            remarks: `Paid from Wallet - ${formData.remarks}`,
            paymentMethod: 'wallet'
          });
        }
        
        // Show success message immediately
        Swal.fire('Success!', `Payment of ${paymentAmount.toFixed(2)} AED processed from wallet successfully`, 'success');
        
        // Send email notifications in background (non-blocking)
        sendPaymentNotifications(paymentAmount, 'Wallet').catch(err => 
          console.error('Background email error:', err)
        );
      } else {
        // Process account payment (existing logic)
        if (isFamilyResidence) {
          await residenceService.processFamilyPayment({
            familyResidenceID: residence.residenceID,
            paymentAmount,
            accountID: parseInt(formData.accountID),
            remarks: formData.remarks
          });
          // Show success message immediately
          Swal.fire('Success!', 'Family residence payment processed successfully', 'success');
        } else {
          await residenceService.processUnifiedPayment({
            residenceID: residence.residenceID,
            paymentAmount,
            accountID: parseInt(formData.accountID),
            remarks: formData.remarks
          });
          // Show success message immediately
          Swal.fire('Success!', 'Unified payment processed successfully', 'success');
        }
        
        // Send email notifications in background (non-blocking)
        const selectedAccount = accounts.find(acc => acc.accountID === parseInt(formData.accountID));
        const accountName = selectedAccount?.accountName || 'Account';
        const accountId = parseInt(formData.accountID);
        sendPaymentNotifications(paymentAmount, accountName, accountId).catch(err => 
          console.error('Background notification error:', err)
        );
      }
      
      // Close modal immediately after showing success
      onClose();
      onSubmit({});
    } catch (error: any) {
      console.error('Error processing payment:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to process payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !residence) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
          {/* Header */}
          <div className="modal-header">
            <h3>
              <i className="fa fa-credit-card"></i> Pay Total Outstanding
            </h3>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <i className="fa fa-times"></i>
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Info Alert */}
              <div className="alert alert-info d-flex align-items-start mb-3">
                <i className="fa fa-info-circle me-2 mt-1"></i>
                <div>
                  <strong>Unified Payment System</strong><br/>
                  <small>This payment will cover all outstanding charges for this residence in a single transaction.</small>
                </div>
              </div>

              {/* Passenger Name */}
              <div className="mb-3">
                <label className="form-label">Passenger Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={residence.passenger_name}
                  readOnly
                  style={{ background: '#f8f9fa' }}
                />
              </div>

              {/* Payment Breakdown */}
              <div className="card mb-3 border-0 shadow-sm">
                <div className="card-header text-white" style={{ background: '#343a40' }}>
                  <strong><i className="fa fa-list me-2"></i>Payment Breakdown</strong>
                </div>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center py-4">
                      <i className="fa fa-spinner fa-spin fa-2x text-primary"></i>
                      <p className="mt-2 text-muted">Loading breakdown...</p>
                    </div>
                  ) : breakdown ? (
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Charge Type</th>
                            <th className="text-end">Amount (AED)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {breakdown.residence_outstanding > 0 && (
                            <tr>
                              <td><i className="fa fa-home me-2 text-primary"></i>Residence Fee</td>
                              <td className="text-end">{breakdown.residence_outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          )}
                          {breakdown.fine_outstanding > 0 && (
                            <tr>
                              <td><i className="fa fa-exclamation-triangle me-2 text-warning"></i>E-Visa Fine</td>
                              <td className="text-end">{breakdown.fine_outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          )}
                          {breakdown.cancellation_outstanding > 0 && (
                            <tr>
                              <td><i className="fa fa-times-circle me-2 text-danger"></i>Cancellation Fee</td>
                              <td className="text-end">{breakdown.cancellation_outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          )}
                          {breakdown.custom_charges_outstanding > 0 && (
                            <tr>
                              <td><i className="fa fa-plus-square me-2 text-warning"></i>Custom Charges</td>
                              <td className="text-end">{breakdown.custom_charges_outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          )}
                          {breakdown.total_outstanding === 0 && (
                            <tr>
                              <td colSpan={2} className="text-center text-success py-3">
                                <i className="fa fa-check-circle me-2"></i>
                                No outstanding payments
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="table-light">
                          <tr>
                            <th>Total Outstanding</th>
                            <th className="text-end">
                              <strong>{breakdown.total_outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</strong>
                            </th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      No breakdown available
                    </div>
                  )}
                </div>
              </div>

              {/* Total Outstanding Amount (Display Only) */}
              <div className="mb-3">
                <label className="form-label"><strong>Total Outstanding Amount (AED)</strong></label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={breakdown ? breakdown.total_outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  readOnly
                  style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold',
                    background: '#f8f9fa',
                    color: '#000'
                  }}
                />
              </div>

              <hr className="my-3" />

              {/* Payment Method Selector */}
              <div className="mb-3">
                <label className="form-label">
                  <strong>Payment Method</strong>
                </label>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'account' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setPaymentMethod('account')}
                  >
                    <i className="fa fa-university me-2"></i>
                    Pay from Account
                  </button>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'wallet' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setPaymentMethod('wallet')}
                  >
                    <i className="fa fa-wallet me-2"></i>
                    Pay from Wallet
                    {loadingWallet ? (
                      <span className="ms-2"><i className="fa fa-spinner fa-spin"></i></span>
                    ) : (
                      <span className="ms-2 badge bg-light text-dark">
                        {walletBalance.toFixed(2)} AED
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Wallet Insufficient Balance Warning */}
              {paymentMethod === 'wallet' && breakdown && walletBalance < breakdown.total_outstanding && (
                <div className="alert alert-warning d-flex align-items-start mb-3">
                  <i className="fa fa-exclamation-triangle me-2 mt-1"></i>
                  <div>
                    <strong>Insufficient Wallet Balance</strong><br/>
                    <small>
                      Wallet balance ({walletBalance.toFixed(2)} AED) is less than total outstanding ({breakdown.total_outstanding.toFixed(2)} AED).
                      You can make a partial payment or add funds to wallet first.
                    </small>
                  </div>
                </div>
              )}

              {/* Note Alert */}
              <div className="alert alert-info d-flex align-items-start mb-3">
                <i className="fa fa-info-circle me-2 mt-1"></i>
                <div>
                  <strong>Note:</strong> This creates a single unified payment record that covers all outstanding charges for this residence. You can pay any amount up to the total outstanding.
                </div>
              </div>

              {/* Amount to Pay Now */}
              <div className="mb-3">
                <label className="form-label">
                  Amount to Pay Now (AED) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.paymentAmount}
                  onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                  placeholder="Enter amount to pay"
                  required
                  min="0.01"
                  step="0.01"
                  disabled={!breakdown || breakdown.total_outstanding === 0}
                />
                <small className="form-text text-muted">Enter the amount you want to pay now</small>
              </div>

              {/* Payment Account - Only show if paying from account */}
              {paymentMethod === 'account' && (
                <div className="mb-3">
                  <label className="form-label">
                    Payment Account <span className="text-danger">*</span>
                  </label>
                  {!accounts || accounts.length === 0 ? (
                    <div className="alert alert-warning">
                      <i className="fa fa-exclamation-triangle me-2"></i>
                      No accounts available. Please refresh the page or contact administrator.
                    </div>
                  ) : (
                    <select
                      className="form-control"
                      value={formData.accountID}
                      onChange={(e) => setFormData({ ...formData, accountID: e.target.value })}
                      required
                      disabled={!breakdown || breakdown.total_outstanding === 0}
                    >
                      <option value="">Select Account</option>
                      {accounts.map((account) => (
                        <option key={account.accountID} value={account.accountID}>
                          {account.accountName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Wallet Payment Info - Only show if paying from wallet */}
              {paymentMethod === 'wallet' && (
                <div className="mb-3">
                  <div className="card border-primary">
                    <div className="card-body">
                      <h6 className="card-title">
                        <i className="fa fa-wallet me-2"></i>
                        Wallet Payment
                      </h6>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Available Balance:</span>
                        <strong className="text-primary" style={{ fontSize: '1.2rem' }}>
                          {walletBalance.toFixed(2)} AED
                        </strong>
                      </div>
                      {paymentMethod === 'wallet' && breakdown && walletBalance >= breakdown.total_outstanding && (
                        <div className="mt-2 text-success small">
                          <i className="fa fa-check-circle me-1"></i>
                          Sufficient balance to pay full amount
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Remarks */}
              <div className="mb-3">
                <label className="form-label">Payment Remarks</label>
                <textarea
                  className="form-control"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={3}
                  placeholder="Enter payment remarks (optional)"
                  disabled={!breakdown || breakdown.total_outstanding === 0}
                ></textarea>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                <i className="fa fa-times me-1"></i> Close
              </button>
              <button 
                type="submit" 
                className={`btn ${paymentMethod === 'wallet' ? 'btn-success' : 'btn-primary'}`}
                disabled={loading || !breakdown || breakdown.total_outstanding === 0 || (paymentMethod === 'wallet' && walletBalance <= 0)}
              >
                {loading ? (
                  <>
                    <i className="fa fa-spinner fa-spin me-1"></i> Processing...
                  </>
                ) : paymentMethod === 'wallet' ? (
                  <>
                    <i className="fa fa-wallet me-1"></i> Pay from Wallet
                  </>
                ) : (
                  <>
                    <i className="fa fa-credit-card me-1"></i> Process Payment
                  </>
                )}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
}




