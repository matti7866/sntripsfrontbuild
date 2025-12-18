import { useState, useEffect } from 'react';
import walletService from '../../services/walletService';
import axios from '../../services/api';
import Swal from 'sweetalert2';

interface Account {
  account_ID: number;
  account_Name: string;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerID: number;
  customerName: string;
  mode: 'add' | 'withdraw';
  currentBalance?: number;
  onSuccess?: () => void;
}

export default function WalletModal({
  isOpen,
  onClose,
  customerID,
  customerName,
  mode,
  currentBalance = 0,
  onSuccess
}: WalletModalProps) {
  const [amount, setAmount] = useState('');
  const [accountID, setAccountID] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactionType, setTransactionType] = useState<'deposit' | 'refund'>('deposit');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setAmount('');
      setAccountID('');
      setRemarks('');
      setTransactionType('deposit');
      loadAccounts();
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      // Load accounts from the accounts API (returns simple array)
      const response = await axios.get('/accounts.php');
      
      console.log('Accounts API response:', response.data);
      
      // Filter for AED currency (curID = 1)
      const accountsData = Array.isArray(response.data) 
        ? response.data.filter((acc: any) => acc.currency == 1 || acc.curID == 1)
        : [];
      
      setAccounts(accountsData);
      console.log('Loaded accounts:', accountsData);
    } catch (error) {
      console.error('Error loading accounts:', error);
      Swal.fire('Warning', 'Could not load accounts. Please try again.', 'warning');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Swal.fire('Error', 'Please enter a valid amount', 'error');
      return;
    }

    const accountIDValue = parseInt(accountID);
    if (!accountIDValue || accountIDValue <= 0) {
      Swal.fire('Error', 'Please select an account', 'error');
      return;
    }

    if (mode === 'withdraw' && amountValue > currentBalance) {
      Swal.fire('Error', `Insufficient balance. Available: ${currentBalance.toFixed(2)} AED`, 'error');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (mode === 'add') {
        response = await walletService.addFunds({
          customerID,
          amount: amountValue,
          currencyID: 1,
          accountID: accountIDValue,
          remarks: remarks || undefined,
          transactionType
        });
        
        console.log('Add funds response:', response);
        const transactionId = response.transaction_id;
        
        // Show success with receipt button
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          html: `
            <p>Funds ${transactionType === 'deposit' ? 'deposited' : 'refunded'} successfully</p>
            ${transactionId ? `<div class="mt-3">
              <a href="/wallet/receipt/${transactionId}" target="_blank" class="btn btn-primary">
                <i class="fa fa-receipt me-2"></i>View Receipt
              </a>
            </div>` : ''}
          `,
          showConfirmButton: true,
          confirmButtonText: 'Close'
        });
      } else {
        response = await walletService.withdraw({
          customerID,
          amount: amountValue,
          currencyID: 1,
          accountID: accountIDValue,
          remarks: remarks || undefined
        });
        
        console.log('Withdraw response:', response);
        const transactionId = response.transaction_id;
        
        // Show success with receipt button
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          html: `
            <p>Funds withdrawn successfully</p>
            ${transactionId ? `<div class="mt-3">
              <a href="/wallet/receipt/${transactionId}" target="_blank" class="btn btn-primary">
                <i class="fa fa-receipt me-2"></i>View Receipt
              </a>
            </div>` : ''}
          `,
          showConfirmButton: true,
          confirmButtonText: 'Close'
        });
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Wallet transaction error:', error);
      Swal.fire('Error', error.response?.data?.message || 'Transaction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose}></div>
      <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ background: '#2d353c', color: '#ffffff' }}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className={`fa fa-${mode === 'add' ? 'plus' : 'minus'}-circle me-2`}></i>
                {mode === 'add' ? 'Add Funds' : 'Withdraw Funds'}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Customer</label>
                  <input
                    type="text"
                    className="form-control"
                    value={customerName}
                    disabled
                  />
                </div>

                {mode === 'add' && (
                  <div className="mb-3">
                    <label className="form-label">Transaction Type</label>
                    <select
                      className="form-select"
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value as 'deposit' | 'refund')}
                    >
                      <option value="deposit">Deposit</option>
                      <option value="refund">Refund</option>
                    </select>
                  </div>
                )}

                {mode === 'withdraw' && (
                  <div className="alert alert-info">
                    <i className="fa fa-info-circle me-2"></i>
                    Current Balance: <strong>{currentBalance.toFixed(2)} AED</strong>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">
                    {mode === 'add' ? 'Receiving Account' : 'Paying Account'} *
                  </label>
                  <select
                    className="form-select"
                    value={accountID}
                    onChange={(e) => setAccountID(e.target.value)}
                    required
                    disabled={loadingAccounts}
                  >
                    <option value="">
                      {loadingAccounts ? 'Loading accounts...' : '-- Select Account --'}
                    </option>
                    {accounts.map((account) => (
                      <option key={account.account_ID} value={account.account_ID}>
                        {account.account_Name}
                      </option>
                    ))}
                  </select>
                  <small className="form-text text-muted">
                    {mode === 'add' 
                      ? 'Select which company account will receive this deposit'
                      : 'Select which company account will provide the withdrawal'}
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Amount (AED) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="0.01"
                    step="0.01"
                    required
                    autoFocus
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Remarks (Optional)</label>
                  <textarea
                    className="form-control"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter any notes or remarks"
                    rows={3}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn btn-${mode === 'add' ? 'success' : 'warning'}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fa fa-spinner fa-spin me-2"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className={`fa fa-${mode === 'add' ? 'check' : 'arrow-down'} me-2`}></i>
                      {mode === 'add' ? 'Add Funds' : 'Withdraw'}
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

