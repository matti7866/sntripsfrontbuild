import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/api';
import WalletBalance from '../../components/common/WalletBalance';
import WalletModal from '../../components/common/WalletModal';
import WalletTransactionsModal from '../../components/common/WalletTransactionsModal';
import Swal from 'sweetalert2';
import './CustomerWallet.css';

interface Customer {
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  wallet_account_number: string | null;
  wallet_balance: number;
}

export default function CustomerWallet() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [walletRefresh, setWalletRefresh] = useState(0);

  useEffect(() => {
    loadCustomers();
  }, [currentPage, searchQuery]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/wallet/get-customers.php', {
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined
      });

      const data = response.data.data || response.data;
      setCustomers(Array.isArray(data) ? data : []);
      
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error: any) {
      console.error('Error loading customers:', error);
      Swal.fire('Error', 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleAddFunds = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowAddModal(true);
  };

  const handleWithdraw = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowWithdrawModal(true);
  };

  const handleViewHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
  };

  const handleTransactionSuccess = () => {
    setWalletRefresh(prev => prev + 1);
    loadCustomers(); // Reload to get updated balance
  };

  return (
    <div className="customer-wallet-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fa fa-wallet me-2"></i>
            Customer Wallet Management
          </h1>
          <p className="page-subtitle">Manage customer wallet balances, deposits, and withdrawals</p>
        </div>
        <button
          onClick={() => loadCustomers()}
          className="btn btn-secondary"
        >
          <i className="fa fa-sync me-2"></i>
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <i className="fa fa-search"></i>
          <input
            type="text"
            className="form-control"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search by customer name, email, or phone..."
          />
        </div>
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="text-center py-5">
          <i className="fa fa-spinner fa-spin fa-3x text-primary"></i>
          <p className="mt-3">Loading customers...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <i className="fa fa-users fa-4x text-muted mb-3"></i>
          <h4>No customers found</h4>
          <p className="text-muted">Try adjusting your search criteria</p>
        </div>
      ) : (
        <>
          <div className="customers-grid">
            {customers.map((customer) => (
              <div key={customer.customer_id} className="customer-wallet-card">
                <div className="customer-info-header">
                  <div className="customer-avatar">
                    <i className="fa fa-user"></i>
                  </div>
                  <div className="customer-details">
                    <h5 className="customer-name">{customer.customer_name}</h5>
                    {customer.wallet_account_number && (
                      <p className="wallet-account-num">
                        <i className="fa fa-credit-card me-1"></i>
                        {customer.wallet_account_number}
                      </p>
                    )}
                    <p className="customer-contact">
                      {customer.customer_email && (
                        <span><i className="fa fa-envelope me-1"></i>{customer.customer_email}</span>
                      )}
                      {customer.customer_phone && (
                        <span className="ms-2"><i className="fa fa-phone me-1"></i>{customer.customer_phone}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="wallet-balance-display">
                  <div className="balance-label">Wallet Balance</div>
                  <div className="balance-value">
                    {(customer.wallet_balance || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} <span className="currency">AED</span>
                  </div>
                </div>

                <div className="wallet-card-actions">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleAddFunds(customer)}
                  >
                    <i className="fa fa-plus-circle me-1"></i>
                    Add Funds
                  </button>
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => handleWithdraw(customer)}
                    disabled={(customer.wallet_balance || 0) <= 0}
                  >
                    <i className="fa fa-minus-circle me-1"></i>
                    Withdraw
                  </button>
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() => handleViewHistory(customer)}
                  >
                    <i className="fa fa-history me-1"></i>
                    History
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-section">
              <nav>
                <ul className="pagination">
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
        </>
      )}

      {/* Modals */}
      {selectedCustomer && (
        <>
          <WalletModal
            isOpen={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setSelectedCustomer(null);
            }}
            customerID={selectedCustomer.customer_id}
            customerName={selectedCustomer.customer_name}
            mode="add"
            onSuccess={handleTransactionSuccess}
          />

          <WalletModal
            isOpen={showWithdrawModal}
            onClose={() => {
              setShowWithdrawModal(false);
              setSelectedCustomer(null);
            }}
            customerID={selectedCustomer.customer_id}
            customerName={selectedCustomer.customer_name}
            mode="withdraw"
            currentBalance={selectedCustomer.wallet_balance || 0}
            onSuccess={handleTransactionSuccess}
          />

          <WalletTransactionsModal
            isOpen={showHistoryModal}
            onClose={() => {
              setShowHistoryModal(false);
              setSelectedCustomer(null);
            }}
            customerID={selectedCustomer.customer_id}
            customerName={selectedCustomer.customer_name}
          />
        </>
      )}
    </div>
  );
}

