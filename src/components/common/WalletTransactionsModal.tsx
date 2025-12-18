import { useState, useEffect } from 'react';
import walletService, { type WalletTransaction } from '../../services/walletService';
import './WalletTransactionsModal.css';

interface WalletTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerID: number;
  customerName: string;
}

export default function WalletTransactionsModal({
  isOpen,
  onClose,
  customerID,
  customerName
}: WalletTransactionsModalProps) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen, customerID, currentPage]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await walletService.getTransactions(customerID, currentPage, 20);
      console.log('Wallet transactions response:', response);
      console.log('Response type:', typeof response);
      console.log('Is array?', Array.isArray(response));
      console.log('response.data:', response.data);
      console.log('response.pagination:', response.pagination);
      
      // Handle different response structures
      let transactionsData = [];
      let paginationData = null;
      
      if (Array.isArray(response)) {
        // Response is directly an array of transactions
        transactionsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        // Response has data property with array
        transactionsData = response.data;
        paginationData = response.pagination;
      } else if (Array.isArray(response)) {
        transactionsData = response;
      }
      
      console.log('Final transactions array:', transactionsData);
      console.log('Transactions count:', transactionsData.length);
      
      setTransactions(transactionsData);
      if (paginationData) {
        setTotalPages(paginationData.totalPages || 1);
        setTotalRecords(paginationData.totalRecords || 0);
      } else {
        setTotalPages(1);
        setTotalRecords(transactionsData.length);
      }
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'fa-arrow-down text-success';
      case 'refund':
        return 'fa-undo text-info';
      case 'payment':
        return 'fa-shopping-cart text-primary';
      case 'withdrawal':
        return 'fa-arrow-up text-warning';
      default:
        return 'fa-exchange-alt';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
        return 'success';
      case 'payment':
      case 'withdrawal':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose}></div>
      <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content" style={{ background: '#2d353c', color: '#ffffff' }}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fa fa-history me-2"></i>
                Wallet Transaction History
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <h6 className="text-muted">{customerName}</h6>
                <p className="small text-muted mb-0">
                  Total Transactions: {totalRecords}
                </p>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <i className="fa fa-spinner fa-spin fa-2x text-primary"></i>
                  <p className="mt-3">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fa fa-inbox fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No transactions found</p>
                </div>
              ) : (
                <div className="wallet-transactions-list">
                  {transactions.map((transaction) => (
                    <div key={transaction.transaction_id} className="transaction-item">
                      <div className="transaction-icon">
                        <i className={`fa ${getTransactionIcon(transaction.transaction_type)}`}></i>
                      </div>
                      <div className="transaction-details">
                        <div className="transaction-type">
                          <strong>{transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}</strong>
                          {transaction.reference_type && (
                            <span className="badge bg-secondary ms-2">
                              {transaction.reference_type} #{transaction.reference_id}
                            </span>
                          )}
                        </div>
                        <div className="transaction-meta">
                          <span className="text-muted">
                            <i className="fa fa-calendar me-1"></i>
                            {new Date(transaction.datetime).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-muted ms-3">
                            <i className="fa fa-user me-1"></i>
                            {transaction.staff_name}
                          </span>
                          {transaction.account_name && (
                            <span className="text-muted ms-3">
                              <i className="fa fa-university me-1"></i>
                              {transaction.account_name}
                            </span>
                          )}
                        </div>
                        {transaction.remarks && (
                          <div className="transaction-remarks">
                            <i className="fa fa-comment me-1"></i>
                            {transaction.remarks}
                          </div>
                        )}
                        <div className="transaction-balance-change">
                          <span className="balance-label">Balance:</span>
                          <span>{transaction.balance_before.toFixed(2)}</span>
                          <i className="fa fa-arrow-right mx-2"></i>
                          <span className="fw-bold">{transaction.balance_after.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="transaction-amount">
                        <span className={`amount text-${getTransactionColor(transaction.transaction_type)}`}>
                          {transaction.transaction_type === 'deposit' || transaction.transaction_type === 'refund' ? '+' : '-'}
                          {transaction.amount.toFixed(2)}
                        </span>
                        <span className="currency">{transaction.currency_symbol || 'AED'}</span>
                      </div>
                      {(transaction.transaction_type === 'deposit' || transaction.transaction_type === 'withdrawal') && (
                        <div className="transaction-actions mt-2">
                          <a
                            href={`/wallet/receipt/${transaction.transaction_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="fa fa-receipt me-1"></i>
                            Receipt
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <nav>
                    <ul className="pagination pagination-sm">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                      </li>
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
                          <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          </li>
                        );
                      })}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

