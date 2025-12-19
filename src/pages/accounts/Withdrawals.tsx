import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import withdrawalService from '../../services/withdrawalService';
import type {
  Withdrawal,
  Account,
  Currency,
  CreateWithdrawalRequest,
  UpdateWithdrawalRequest
} from '../../types/withdrawal';
import './Withdrawals.css';

const ITEMS_PER_PAGE = 15;

export default function Withdrawals() {
  const queryClient = useQueryClient();

  // State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Form states
  const [formData, setFormData] = useState<CreateWithdrawalRequest>({
    accountID: 0,
    withdrawal_amount: 0,
    currencyID: 0,
    datetime: new Date().toISOString().slice(0, 16),
    remarks: ''
  });

  const [editFormData, setEditFormData] = useState<UpdateWithdrawalRequest>({
    withdrawal_ID: 0,
    accountID: 0,
    withdrawal_amount: 0,
    currencyID: 0,
    datetime: new Date().toISOString().slice(0, 16),
    remarks: ''
  });

  // Fetch withdrawals
  const { data: withdrawals = [], isLoading, refetch, error } = useQuery<Withdrawal[]>({
    queryKey: ['withdrawals'],
    queryFn: async () => {
      try {
        const result = await withdrawalService.getWithdrawals();
        return result;
      } catch (err: any) {
        console.error('Error fetching withdrawals:', err);
        throw err;
      }
    },
    retry: 1
  });

  // Fetch accounts
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['withdrawal-accounts'],
    queryFn: async () => {
      try {
        const result = await withdrawalService.getAccounts();
        return result;
      } catch (err: any) {
        console.error('Error fetching accounts:', err);
        return [];
      }
    },
    staleTime: 300000
  });

  // Fetch currencies
  const { data: currencies = [] } = useQuery<Currency[]>({
    queryKey: ['withdrawal-currencies'],
    queryFn: async () => {
      try {
        const result = await withdrawalService.getCurrencies();
        return result;
      } catch (err: any) {
        console.error('Error fetching currencies:', err);
        return [];
      }
    },
    staleTime: 300000
  });

  // Show error if query fails
  useEffect(() => {
    if (error) {
      console.error('Error fetching withdrawals:', error);
    }
  }, [error]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterAccount]);

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (data: CreateWithdrawalRequest) => withdrawalService.addWithdrawal(data),
    onSuccess: (response) => {
      if (response === 'Success' || response.trim() === 'Success') {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Withdrawal added successfully',
          timer: 2000,
          showConfirmButton: false
        });
        setShowAddModal(false);
        resetAddForm();
        refetch();
      } else {
        Swal.fire('Error', response, 'error');
      }
    },
    onError: (error: any) => {
      Swal.fire('Error', error.response?.data?.message || 'Failed to add withdrawal', 'error');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateWithdrawalRequest) => withdrawalService.updateWithdrawal(data),
    onSuccess: (response) => {
      if (response === 'Success' || response.trim() === 'Success') {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Withdrawal updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
        setShowEditModal(false);
        resetEditForm();
        refetch();
      } else {
        Swal.fire('Error', response, 'error');
      }
    },
    onError: (error: any) => {
      Swal.fire('Error', error.response?.data?.message || 'Failed to update withdrawal', 'error');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => withdrawalService.deleteWithdrawal(id),
    onSuccess: (response) => {
      if (response === 'Success' || response.trim() === 'Success') {
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Withdrawal deleted successfully',
          timer: 2000,
          showConfirmButton: false
        });
        refetch();
      } else {
        Swal.fire('Error', response, 'error');
      }
    },
    onError: (error: any) => {
      Swal.fire('Error', error.response?.data?.message || 'Failed to delete withdrawal', 'error');
    }
  });

  const resetAddForm = () => {
    setFormData({
      accountID: accounts.length > 0 ? accounts[0].account_ID : 0,
      withdrawal_amount: 0,
      currencyID: currencies.length > 0 ? currencies[0].currencyID : 0,
      datetime: new Date().toISOString().slice(0, 16),
      remarks: ''
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      withdrawal_ID: 0,
      accountID: 0,
      withdrawal_amount: 0,
      currencyID: 0,
      datetime: new Date().toISOString().slice(0, 16),
      remarks: ''
    });
  };

  const handleAddNew = () => {
    resetAddForm();
    setShowAddModal(true);
  };

  const handleEdit = async (id: number) => {
    try {
      const withdrawal = await withdrawalService.getWithdrawal(id);
      setEditFormData({
        withdrawal_ID: withdrawal.withdrawal_ID,
        accountID: withdrawal.accountID,
        withdrawal_amount: withdrawal.withdrawal_amount,
        currencyID: withdrawal.currencyID,
        datetime: withdrawal.datetime.slice(0, 16),
        remarks: withdrawal.remarks || ''
      });
      setSelectedId(id);
      setShowEditModal(true);
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Failed to fetch withdrawal', 'error');
    }
  };

  const handleDelete = (id: number, remarks: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete withdrawal: ${remarks || '#' + id}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
      }
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.accountID || formData.accountID === 0) {
      Swal.fire('Validation Error', 'Account is required', 'error');
      return;
    }
    if (!formData.withdrawal_amount || formData.withdrawal_amount <= 0) {
      Swal.fire('Validation Error', 'Amount must be greater than 0', 'error');
      return;
    }
    if (!formData.currencyID || formData.currencyID === 0) {
      Swal.fire('Validation Error', 'Currency is required', 'error');
      return;
    }
    if (!formData.datetime) {
      Swal.fire('Validation Error', 'Date and time is required', 'error');
      return;
    }

    addMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editFormData.accountID || editFormData.accountID === 0) {
      Swal.fire('Validation Error', 'Account is required', 'error');
      return;
    }
    if (!editFormData.withdrawal_amount || editFormData.withdrawal_amount <= 0) {
      Swal.fire('Validation Error', 'Amount must be greater than 0', 'error');
      return;
    }
    if (!editFormData.currencyID || editFormData.currencyID === 0) {
      Swal.fire('Validation Error', 'Currency is required', 'error');
      return;
    }
    if (!editFormData.datetime) {
      Swal.fire('Validation Error', 'Date and time is required', 'error');
      return;
    }

    updateMutation.mutate(editFormData);
  };

  // Filter withdrawals
  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    const matchesSearch = 
      withdrawal.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.withdrawal_amount.toString().includes(searchTerm);
    
    const matchesAccount = filterAccount === 0 || withdrawal.accountID === filterAccount;
    
    return matchesSearch && matchesAccount;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredWithdrawals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedWithdrawals = filteredWithdrawals.slice(startIndex, endIndex);

  // Calculate total withdrawals
  const totalWithdrawals = filteredWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.withdrawal_amount, 0);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDateTime = (dateTimeString: string): string => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredWithdrawals.length)} of {filteredWithdrawals.length} withdrawals
        </div>
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            title="First page"
          >
            <i className="fa fa-angle-double-left"></i>
          </button>
          <button
            className="pagination-btn"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous page"
          >
            <i className="fa fa-angle-left"></i>
          </button>
          
          {startPage > 1 && (
            <>
              <button className="pagination-btn" onClick={() => goToPage(1)}>1</button>
              {startPage > 2 && <span className="pagination-ellipsis">...</span>}
            </>
          )}
          
          {pages.map((page) => (
            <button
              key={page}
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
              <button className="pagination-btn" onClick={() => goToPage(totalPages)}>
                {totalPages}
              </button>
            </>
          )}
          
          <button
            className="pagination-btn"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Next page"
          >
            <i className="fa fa-angle-right"></i>
          </button>
          <button
            className="pagination-btn"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            title="Last page"
          >
            <i className="fa fa-angle-double-right"></i>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="withdrawals-container">
      <div className="withdrawals-card">
        <div className="withdrawals-header">
          <div className="header-content">
            <div className="header-icon">
              <i className="fa fa-hand-holding-usd"></i>
            </div>
            <div>
              <h1>Withdrawals Management</h1>
              <p className="header-subtitle">Manage and track all account withdrawals</p>
            </div>
          </div>
        </div>

        <div className="withdrawals-body">
          {/* Actions and Filters */}
          <div className="toolbar">
            <button className="btn-primary btn-add" onClick={handleAddNew}>
              <i className="fa fa-plus"></i>
              <span>Add Withdrawal</span>
            </button>
            
            <div className="filters">
              <div className="search-wrapper">
                <i className="fa fa-search search-icon"></i>
                <input
                  type="text"
                  placeholder="Search by account, remarks, or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search" 
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    <i className="fa fa-times"></i>
                  </button>
                )}
              </div>
              
              <select
                className="filter-select"
                value={filterAccount}
                onChange={(e) => setFilterAccount(Number(e.target.value))}
              >
                <option value="0">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.account_ID} value={account.account_ID}>
                    {account.account_Name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon orange">
                <i className="fa fa-list"></i>
              </div>
              <div className="summary-content">
                <div className="summary-label">Total Withdrawals</div>
                <div className="summary-value">{filteredWithdrawals.length}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon red">
                <i className="fa fa-coins"></i>
              </div>
              <div className="summary-content">
                <div className="summary-label">Total Amount</div>
                <div className="summary-value">{formatCurrency(totalWithdrawals)}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon pink">
                <i className="fa fa-file-invoice-dollar"></i>
              </div>
              <div className="summary-content">
                <div className="summary-label">This Page</div>
                <div className="summary-value">{paginatedWithdrawals.length}</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading withdrawals...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <i className="fa fa-exclamation-triangle"></i>
                <p>Error loading withdrawals. Please try again.</p>
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="empty-state">
                <i className="fa fa-inbox"></i>
                <p>No withdrawals found</p>
                {searchTerm || filterAccount !== 0 ? (
                  <button className="btn-secondary" onClick={() => { setSearchTerm(''); setFilterAccount(0); }}>
                    Clear Filters
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="withdrawals-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date & Time</th>
                        <th>Account</th>
                        <th>Currency</th>
                        <th>Remarks</th>
                        <th className="text-right">Amount</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedWithdrawals.map((withdrawal, index) => (
                        <tr key={withdrawal.withdrawal_ID}>
                          <td className="text-center">{startIndex + index + 1}</td>
                          <td>
                            <div className="date-cell">
                              <i className="fa fa-calendar-alt"></i>
                              {formatDateTime(withdrawal.datetime)}
                            </div>
                          </td>
                          <td>
                            <div className="account-cell">
                              <i className="fa fa-building"></i>
                              <span>{withdrawal.accountName || '-'}</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="currency-badge">{withdrawal.currencyName || '-'}</span>
                          </td>
                          <td>
                            <div className="remarks-cell" title={withdrawal.remarks || ''}>
                              {withdrawal.remarks || '-'}
                            </div>
                          </td>
                          <td className="text-right">
                            <span className="amount-badge withdrawal">
                              {formatCurrency(withdrawal.withdrawal_amount)}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="action-buttons">
                              <button
                                className="btn-icon btn-edit"
                                onClick={() => handleEdit(withdrawal.withdrawal_ID)}
                                title="Edit"
                              >
                                <i className="fa fa-edit"></i>
                              </button>
                              <button
                                className="btn-icon btn-delete"
                                onClick={() => handleDelete(withdrawal.withdrawal_ID, withdrawal.remarks || '')}
                                title="Delete"
                              >
                                <i className="fa fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {renderPagination()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Withdrawal Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fa fa-plus-circle"></i>
                Add New Withdrawal
              </h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Account <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={formData.accountID}
                      onChange={(e) => setFormData({ ...formData, accountID: Number(e.target.value) })}
                      required
                    >
                      <option value="0">--Select Account--</option>
                      {accounts.map((account) => (
                        <option key={account.account_ID} value={account.account_ID}>
                          {account.account_Name} {account.accountNum ? `(${account.accountNum})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Currency <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={formData.currencyID}
                      onChange={(e) => setFormData({ ...formData, currencyID: Number(e.target.value) })}
                      required
                    >
                      <option value="0">--Select Currency--</option>
                      {currencies.map((currency) => (
                        <option key={currency.currencyID} value={currency.currencyID}>
                          {currency.currencyName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Amount <span className="required">*</span></label>
                    <div className="input-with-icon">
                      <i className="fa fa-money-bill-wave"></i>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.withdrawal_amount}
                        onChange={(e) => setFormData({ ...formData, withdrawal_amount: Number(e.target.value) })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Date & Time <span className="required">*</span></label>
                    <div className="input-with-icon">
                      <i className="fa fa-calendar-alt"></i>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={formData.datetime}
                        onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Remarks</label>
                  <textarea
                    className="form-control"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Enter remarks or description..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={addMutation.isPending}>
                  {addMutation.isPending ? (
                    <>
                      <i className="fa fa-spinner fa-spin"></i> Saving...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-save"></i> Save Withdrawal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Withdrawal Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fa fa-edit"></i>
                Update Withdrawal
              </h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Account <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={editFormData.accountID}
                      onChange={(e) => setEditFormData({ ...editFormData, accountID: Number(e.target.value) })}
                      required
                    >
                      <option value="0">--Select Account--</option>
                      {accounts.map((account) => (
                        <option key={account.account_ID} value={account.account_ID}>
                          {account.account_Name} {account.accountNum ? `(${account.accountNum})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Currency <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={editFormData.currencyID}
                      onChange={(e) => setEditFormData({ ...editFormData, currencyID: Number(e.target.value) })}
                      required
                    >
                      <option value="0">--Select Currency--</option>
                      {currencies.map((currency) => (
                        <option key={currency.currencyID} value={currency.currencyID}>
                          {currency.currencyName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Amount <span className="required">*</span></label>
                    <div className="input-with-icon">
                      <i className="fa fa-money-bill-wave"></i>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={editFormData.withdrawal_amount}
                        onChange={(e) => setEditFormData({ ...editFormData, withdrawal_amount: Number(e.target.value) })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Date & Time <span className="required">*</span></label>
                    <div className="input-with-icon">
                      <i className="fa fa-calendar-alt"></i>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={editFormData.datetime}
                        onChange={(e) => setEditFormData({ ...editFormData, datetime: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Remarks</label>
                  <textarea
                    className="form-control"
                    value={editFormData.remarks}
                    onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                    placeholder="Enter remarks or description..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <i className="fa fa-spinner fa-spin"></i> Updating...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-save"></i> Update Withdrawal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

