import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import depositService from '../../services/depositService';
import type {
  Deposit,
  Account,
  Currency,
  CreateDepositRequest,
  UpdateDepositRequest
} from '../../types/deposit';
import './Deposits.css';

const ITEMS_PER_PAGE = 15;

export default function Deposits() {
  const queryClient = useQueryClient();

  // State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Form states
  const [formData, setFormData] = useState<CreateDepositRequest>({
    accountID: 0,
    deposit_amount: 0,
    currencyID: 0,
    datetime: new Date().toISOString().slice(0, 16),
    remarks: ''
  });

  const [editFormData, setEditFormData] = useState<UpdateDepositRequest>({
    deposit_ID: 0,
    accountID: 0,
    deposit_amount: 0,
    currencyID: 0,
    datetime: new Date().toISOString().slice(0, 16),
    remarks: ''
  });

  // Fetch deposits
  const { data: deposits = [], isLoading, refetch, error } = useQuery<Deposit[]>({
    queryKey: ['deposits'],
    queryFn: async () => {
      try {
        const result = await depositService.getDeposits();
        return result;
      } catch (err: any) {
        console.error('Error fetching deposits:', err);
        throw err;
      }
    },
    retry: 1
  });

  // Fetch accounts
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['deposit-accounts'],
    queryFn: async () => {
      try {
        const result = await depositService.getAccounts();
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
    queryKey: ['deposit-currencies'],
    queryFn: async () => {
      try {
        const result = await depositService.getCurrencies();
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
      console.error('Error fetching deposits:', error);
    }
  }, [error]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterAccount]);

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (data: CreateDepositRequest) => depositService.addDeposit(data),
    onSuccess: (response) => {
      if (response === 'Success' || response.trim() === 'Success') {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Deposit added successfully',
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
      Swal.fire('Error', error.response?.data?.message || 'Failed to add deposit', 'error');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateDepositRequest) => depositService.updateDeposit(data),
    onSuccess: (response) => {
      if (response === 'Success' || response.trim() === 'Success') {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Deposit updated successfully',
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
      Swal.fire('Error', error.response?.data?.message || 'Failed to update deposit', 'error');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => depositService.deleteDeposit(id),
    onSuccess: (response) => {
      if (response === 'Success' || response.trim() === 'Success') {
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Deposit deleted successfully',
          timer: 2000,
          showConfirmButton: false
        });
        refetch();
      } else {
        Swal.fire('Error', response, 'error');
      }
    },
    onError: (error: any) => {
      Swal.fire('Error', error.response?.data?.message || 'Failed to delete deposit', 'error');
    }
  });

  const resetAddForm = () => {
    setFormData({
      accountID: accounts.length > 0 ? accounts[0].account_ID : 0,
      deposit_amount: 0,
      currencyID: currencies.length > 0 ? currencies[0].currencyID : 0,
      datetime: new Date().toISOString().slice(0, 16),
      remarks: ''
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      deposit_ID: 0,
      accountID: 0,
      deposit_amount: 0,
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
      const deposit = await depositService.getDeposit(id);
      setEditFormData({
        deposit_ID: deposit.deposit_ID,
        accountID: deposit.accountID,
        deposit_amount: deposit.deposit_amount,
        currencyID: deposit.currencyID,
        datetime: deposit.datetime.slice(0, 16),
        remarks: deposit.remarks || ''
      });
      setSelectedId(id);
      setShowEditModal(true);
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Failed to fetch deposit', 'error');
    }
  };

  const handleDelete = (id: number, remarks: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete deposit: ${remarks || '#' + id}`,
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
    if (!formData.deposit_amount || formData.deposit_amount <= 0) {
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
    if (!editFormData.deposit_amount || editFormData.deposit_amount <= 0) {
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

  // Filter deposits
  const filteredDeposits = deposits.filter((deposit) => {
    const matchesSearch = 
      deposit.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.deposit_amount.toString().includes(searchTerm);
    
    const matchesAccount = filterAccount === 0 || deposit.accountID === filterAccount;
    
    return matchesSearch && matchesAccount;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredDeposits.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDeposits = filteredDeposits.slice(startIndex, endIndex);

  // Calculate total deposits
  const totalDeposits = filteredDeposits.reduce((sum, deposit) => sum + deposit.deposit_amount, 0);

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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredDeposits.length)} of {filteredDeposits.length} deposits
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
    <div className="deposits-container">
      <div className="deposits-card">
        <div className="deposits-header">
          <div className="header-content">
            <div className="header-icon">
              <i className="fa fa-money-bill-wave"></i>
            </div>
            <div>
              <h1>Deposits Management</h1>
              <p className="header-subtitle">Manage and track all account deposits</p>
            </div>
          </div>
        </div>

        <div className="deposits-body">
          {/* Actions and Filters */}
          <div className="toolbar">
            <button className="btn-primary btn-add" onClick={handleAddNew}>
              <i className="fa fa-plus"></i>
              <span>Add Deposit</span>
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
              <div className="summary-icon blue">
                <i className="fa fa-list"></i>
              </div>
              <div className="summary-content">
                <div className="summary-label">Total Deposits</div>
                <div className="summary-value">{filteredDeposits.length}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon green">
                <i className="fa fa-coins"></i>
              </div>
              <div className="summary-content">
                <div className="summary-label">Total Amount</div>
                <div className="summary-value">{formatCurrency(totalDeposits)}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon purple">
                <i className="fa fa-file-invoice-dollar"></i>
              </div>
              <div className="summary-content">
                <div className="summary-label">This Page</div>
                <div className="summary-value">{paginatedDeposits.length}</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading deposits...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <i className="fa fa-exclamation-triangle"></i>
                <p>Error loading deposits. Please try again.</p>
              </div>
            ) : filteredDeposits.length === 0 ? (
              <div className="empty-state">
                <i className="fa fa-inbox"></i>
                <p>No deposits found</p>
                {searchTerm || filterAccount !== 0 ? (
                  <button className="btn-secondary" onClick={() => { setSearchTerm(''); setFilterAccount(0); }}>
                    Clear Filters
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="deposits-table">
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
                      {paginatedDeposits.map((deposit, index) => (
                        <tr key={deposit.deposit_ID}>
                          <td className="text-center">{startIndex + index + 1}</td>
                          <td>
                            <div className="date-cell">
                              <i className="fa fa-calendar-alt"></i>
                              {formatDateTime(deposit.datetime)}
                            </div>
                          </td>
                          <td>
                            <div className="account-cell">
                              <i className="fa fa-building"></i>
                              <span>{deposit.accountName || '-'}</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="currency-badge">{deposit.currencyName || '-'}</span>
                          </td>
                          <td>
                            <div className="remarks-cell" title={deposit.remarks || ''}>
                              {deposit.remarks || '-'}
                            </div>
                          </td>
                          <td className="text-right">
                            <span className="amount-badge">
                              {formatCurrency(deposit.deposit_amount)}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="action-buttons">
                              <button
                                className="btn-icon btn-edit"
                                onClick={() => handleEdit(deposit.deposit_ID)}
                                title="Edit"
                              >
                                <i className="fa fa-edit"></i>
                              </button>
                              <button
                                className="btn-icon btn-delete"
                                onClick={() => handleDelete(deposit.deposit_ID, deposit.remarks || '')}
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

      {/* Add Deposit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fa fa-plus-circle"></i>
                Add New Deposit
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
                        value={formData.deposit_amount}
                        onChange={(e) => setFormData({ ...formData, deposit_amount: Number(e.target.value) })}
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
                      <i className="fa fa-save"></i> Save Deposit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Deposit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fa fa-edit"></i>
                Update Deposit
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
                        value={editFormData.deposit_amount}
                        onChange={(e) => setEditFormData({ ...editFormData, deposit_amount: Number(e.target.value) })}
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
                      <i className="fa fa-save"></i> Update Deposit
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
