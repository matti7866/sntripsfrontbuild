import { useState, useEffect } from 'react';
import walletService, { type WalletBalance as WalletBalanceType } from '../../services/walletService';
import './WalletBalance.css';

interface WalletBalanceProps {
  customerID: number;
  customerName: string;
  onAddFunds?: () => void;
  onWithdraw?: () => void;
  onViewHistory?: () => void;
  refreshTrigger?: number;
}

export default function WalletBalance({
  customerID,
  customerName,
  onAddFunds,
  onWithdraw,
  onViewHistory,
  refreshTrigger = 0
}: WalletBalanceProps) {
  const [balance, setBalance] = useState<WalletBalanceType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBalance();
  }, [customerID, refreshTrigger]);

  const loadBalance = async () => {
    if (!customerID) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await walletService.getBalance(customerID);
      setBalance(data);
    } catch (err: any) {
      console.error('Error loading wallet balance:', err);
      setError(err.response?.data?.message || 'Failed to load wallet balance');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !balance) {
    return (
      <div className="wallet-balance-card">
        <div className="text-center">
          <i className="fa fa-spinner fa-spin"></i> Loading wallet...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-balance-card">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!balance) return null;

  return (
    <div className="wallet-balance-card">
      <div className="wallet-header">
        <div className="wallet-icon">
          <i className="fa fa-wallet"></i>
        </div>
        <div className="wallet-info">
          <h4 className="mb-1">Wallet Balance</h4>
          <p className="text-muted mb-0">{customerName}</p>
        </div>
      </div>

      <div className="wallet-balance">
        <div className="balance-amount">
          <span className="currency">AED</span>
          <span className="amount">{balance.wallet_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="wallet-stats">
        <div className="stat-item">
          <i className="fa fa-exchange-alt"></i>
          <div>
            <div className="stat-value">{balance.total_transactions}</div>
            <div className="stat-label">Transactions</div>
          </div>
        </div>
        {balance.last_transaction_date && (
          <div className="stat-item">
            <i className="fa fa-clock"></i>
            <div>
              <div className="stat-value">
                {new Date(balance.last_transaction_date).toLocaleDateString()}
              </div>
              <div className="stat-label">Last Transaction</div>
            </div>
          </div>
        )}
      </div>

      <div className="wallet-actions">
        {onAddFunds && (
          <button className="btn btn-success btn-sm" onClick={onAddFunds}>
            <i className="fa fa-plus-circle me-1"></i>
            Add Funds
          </button>
        )}
        {onWithdraw && (
          <button className="btn btn-warning btn-sm" onClick={onWithdraw}>
            <i className="fa fa-minus-circle me-1"></i>
            Withdraw
          </button>
        )}
        {onViewHistory && (
          <button className="btn btn-info btn-sm" onClick={onViewHistory}>
            <i className="fa fa-history me-1"></i>
            History
          </button>
        )}
      </div>
    </div>
  );
}





