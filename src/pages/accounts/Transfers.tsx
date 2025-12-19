import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import transferService from '../../services/transferService';
import type {
  Transfer,
  Account,
  CreateTransferRequest,
  UpdateTransferRequest
} from '../../types/transfer';
import './Transfers.css';

const ITEMS_PER_PAGE = 15;

export default function Transfers() {
  const queryClient = useQueryClient();

  // State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Form states
  const [formData, setFormData] = useState<CreateTransferRequest>({
    from_account: 0,
    to_account: 0,
    amount: 0,
    charges: 0,
    exchange_rate: 1,
    datetime: new Date().toISOString().slice(0, 16),
    remarks: '',
    trx: ''
  });

  const [editFormData, setEditFormData] = useState<UpdateTransferRequest>({
    id: 0,
    from_account: 0,
    to_account: 0,
    amount: 0,
    charges: 0,
    exchange_rate: 1,
    datetime: new Date().toISOString().slice(0, 16),
    remarks: '',
    trx: ''
  });

  // Fetch transfers
  const { data: transfers = [], isLoading, refetch, error } = useQuery<Transfer[]>({
    queryKey: ['transfers'],
    queryFn: async () => {
      try {
        const result = await transferService.getTransfers();
        return result;
      } catch (err: any) {
        console.error('Error fetching transfers:', err);
        throw err;
      }
    },
    retry: 1
  });

  // Fetch accounts
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['transfer-accounts'],
    queryFn: async () => {
      try {
        const result = await transferService.getAccounts();
        return result;
      } catch (err: any) {
        console.error('Error fetching accounts:', err);
        return [];
      }
    },
    staleTime: 300000
  });

  // Show error if query fails
  useEffect(() => {
    if (error) {
      console.error('Error fetching transfers:', error);
    }
  }, [error]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterAccount]);

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (data: CreateTransferRequest) => transferService.addTransfer(data),
    onSuccess: (response) => {
      if (response === 'Success' || response.trim() === 'Success') {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Transfer added successfully',
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
      Swal.fire('Error', error.response?.data?.message || 'Failed to add transfer', 'error');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateTransferRequest) => transferService.updateTransfer(data),
    onSuccess: (response) => {
      if (response === 'Success' || response.trim() === 'Success') {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Transfer updated successfully',
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
      Swal.fire('Error', error.response?.data?.message || 'Failed to update transfer', 'error');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => transferService.deleteTransfer(id),
    onSuccess: (response) => {
      if (response === 'Success' || response.trim() === 'Success') {
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Transfer deleted successfully',
          timer: 2000,
          showConfirmButton: false
        });
        refetch();
      } else {
        Swal.fire('Error', response, 'error');
      }
    },
    onError: (error: any) => {
      Swal.fire('Error', error.response?.data?.message || 'Failed to delete transfer', 'error');
    }
  });

  const resetAddForm = () => {
    setFormData({
      from_account: accounts.length > 0 ? accounts[0].account_ID : 0,
      to_account: accounts.length > 1 ? accounts[1].account_ID : 0,
      amount: 0,
      charges: 0,
      exchange_rate: 1,
      datetime: new Date().toISOString().slice(0, 16),
      remarks: '',
      trx: ''
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      id: 0,
      from_account: 0,
      to_account: 0,
      amount: 0,
      charges: 0,
      exchange_rate: 1,
      datetime: new Date().toISOString().slice(0, 16),
      remarks: '',
      trx: ''
    });
  };

  const handleAddNew = () => {
    resetAddForm();
    setShowAddModal(true);
  };

  const handleEdit = async (id: number) => {
    try {
      const transfer = await transferService.getTransfer(id);
      setEditFormData({
        id: transfer.id,
        from_account: transfer.from_account,
        to_account: transfer.to_account,
        amount: transfer.amount,
        charges: transfer.charges,
        exchange_rate: transfer.exchange_rate,
        datetime: transfer.datetime.slice(0, 16),
        remarks: transfer.remarks || '',
        trx: transfer.trx || ''
      });
      setSelectedId(id);
      setShowEditModal(true);
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Failed to fetch transfer', 'error');
    }
  };

  const handleDelete = (id: number, trx: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete transfer: ${trx || '#' + id}`,
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
    
    if (!formData.from_account || formData.from_account === 0) {
      Swal.fire('Validation Error', 'From Account is required', 'error');
      return;
    }
    if (!formData.to_account || formData.to_account === 0) {
      Swal.fire('Validation Error', 'To Account is required', 'error');
      return;
    }
    if (formData.from_account === formData.to_account) {
      Swal.fire('Validation Error', 'From and To accounts must be different', 'error');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      Swal.fire('Validation Error', 'Amount must be greater than 0', 'error');
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
    
    if (!editFormData.from_account || editFormData.from_account === 0) {
      Swal.fire('Validation Error', 'From Account is required', 'error');
      return;
    }
    if (!editFormData.to_account || editFormData.to_account === 0) {
      Swal.fire('Validation Error', 'To Account is required', 'error');
      return;
    }
    if (editFormData.from_account === editFormData.to_account) {
      Swal.fire('Validation Error', 'From and To accounts must be different', 'error');
      return;
    }
    if (!editFormData.amount || editFormData.amount <= 0) {
      Swal.fire('Validation Error', 'Amount must be greater than 0', 'error');
      return;
    }
    if (!editFormData.datetime) {
      Swal.fire('Validation Error', 'Date and time is required', 'error');
      return;
    }

    updateMutation.mutate(editFormData);
  };

  // Filter transfers
  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch = 
      transfer.fromAccountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.toAccountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.trx?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.amount.toString().includes(searchTerm);
    
    const matchesAccount = filterAccount === 0 || 
      transfer.from_account === filterAccount || 
      transfer.to_account === filterAccount;
    
    return matchesSearch && matchesAccount;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransfers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTransfers = filteredTransfers.slice(startIndex, endIndex);

  // Calculate totals
  const totalAmount = filteredTransfers.reduce((sum, transfer) => sum + transfer.amount, 0);
  const totalCharges = filteredTransfers.reduce((sum, transfer) => sum + transfer.charges, 0);

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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredTransfers.length)} of {filteredTransfers.length} transfers
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
    <div className="transfers-container">
      <div className="transfers-card">
        <div className="transfers-header">
          <div className="header-content">
            <div className="header-icon">
              <i className="fa fa-exchange-alt"></i>
            </div>
            <div>
              <h1>Transfers Management</h1>
              <p className="header-subtitle">Manage and track all account transfers</p>
            </div>
          </div>
        </div>

        <div className="transfers-body">
          {/* Actions and Filters */}
          <div className="toolbar">
            <button className="btn-primary btn-add" onClick={handleAddNew}>
              <i className="fa fa-plus"></i>
              <span>Add Transfer</span>
            </button>
            
            <div className="filters">
              <div className="search-wrapper">
                <i className="fa fa-search search-icon"></i>
                <input
                  type="text"
                  placeholder="Search by accounts, remarks, transaction ref, or amount..."
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
              <div className="summary-icon teal">
                <i className="fa fa-list"></i>
              </div>
              <div className="summary-content">
                <div className="summary-label">Total Transfers</div>
                <div className="summary-value">{filteredTransfers.length}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon blue">
                <i className="fa fa-coins"></i>
              </div>
              <div className="summary-content">
                <div className="summary-label">Total Amount</div>
                <div className="summary-value">{formatCurrency(totalAmount)}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon cyan">
                <i className="fa fa-percent"></i>
              </div>
              <div className="summary-content">
                <div className="summary-label">Total Charges</div>
                <div className="summary-value">{formatCurrency(totalCharges)}</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading transfers...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <i className="fa fa-exclamation-triangle"></i>
                <p>Error loading transfers: {(error as any)?.response?.data?.message || (error as any)?.message || 'Please try again.'}</p>
                <button className="btn-secondary mt-3" onClick={() => refetch()}>
                  <i className="fa fa-refresh"></i> Retry
                </button>
              </div>
            ) : filteredTransfers.length === 0 ? (
              <div className="empty-state">
                <i className="fa fa-inbox"></i>
                <p>No transfers found</p>
                {searchTerm || filterAccount !== 0 ? (
                  <button className="btn-secondary" onClick={() => { setSearchTerm(''); setFilterAccount(0); }}>
                    Clear Filters
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="transfers-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date & Time</th>
                        <th>From Account</th>
                        <th>To Account</th>
                        <th>Amount</th>
                        <th>Charges</th>
                        <th>Exchange Rate</th>
                        <th>Transaction Ref</th>
                        <th>Remarks</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransfers.map((transfer, index) => (
                        <tr key={transfer.id}>
                          <td className="text-center">{startIndex + index + 1}</td>
                          <td>
                            <div className="date-cell">
                              <i className="fa fa-calendar-alt"></i>
                              {formatDateTime(transfer.datetime)}
                            </div>
                          </td>
                          <td>
                            <div className="account-cell from">
                              <i className="fa fa-arrow-up"></i>
                              <span>{transfer.fromAccountName || '-'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="account-cell to">
                              <i className="fa fa-arrow-down"></i>
                              <span>{transfer.toAccountName || '-'}</span>
                            </div>
                          </td>
                          <td className="text-right">
                            <span className="amount-badge">{formatCurrency(transfer.amount)}</span>
                          </td>
                          <td className="text-right">
                            {transfer.charges > 0 ? (
                              <span className="charges-badge">{formatCurrency(transfer.charges)}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-center">
                            {transfer.exchange_rate !== 1 ? (
                              <span className="rate-badge">{transfer.exchange_rate}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <span className="trx-badge">{transfer.trx || '-'}</span>
                          </td>
                          <td>
                            <div className="remarks-cell" title={transfer.remarks || ''}>
                              {transfer.remarks || '-'}
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="action-buttons">
                              <button
                                className="btn-icon btn-edit"
                                onClick={() => handleEdit(transfer.id)}
                                title="Edit"
                              >
                                <i className="fa fa-edit"></i>
                              </button>
                              <button
                                className="btn-icon btn-delete"
                                onClick={() => handleDelete(transfer.id, transfer.trx || '')}
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

      {/* Add Transfer Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fa fa-plus-circle"></i>
                Add New Transfer
              </h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>From Account <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={formData.from_account}
                      onChange={(e) => setFormData({ ...formData, from_account: Number(e.target.value) })}
                      required
                    >
                      <option value="0">--Select From Account--</option>
                      {accounts.map((account) => (
                        <option key={account.account_ID} value={account.account_ID}>
                          {account.account_Name} {account.accountNum ? `(${account.accountNum})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>To Account <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={formData.to_account}
                      onChange={(e) => setFormData({ ...formData, to_account: Number(e.target.value) })}
                      required
                    >
                      <option value="0">--Select To Account--</option>
                      {accounts.map((account) => (
                        <option key={account.account_ID} value={account.account_ID}>
                          {account.account_Name} {account.accountNum ? `(${account.accountNum})` : ''}
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
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
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

                <div className="form-row">
                  <div className="form-group">
                    <label>Charges</label>
                    <div className="input-with-icon">
                      <i className="fa fa-percent"></i>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.charges}
                        onChange={(e) => setFormData({ ...formData, charges: Number(e.target.value) })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Exchange Rate</label>
                    <div className="input-with-icon">
                      <i className="fa fa-exchange-alt"></i>
                      <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        value={formData.exchange_rate}
                        onChange={(e) => setFormData({ ...formData, exchange_rate: Number(e.target.value) })}
                        placeholder="1.0000"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Transaction Reference</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.trx}
                    onChange={(e) => setFormData({ ...formData, trx: e.target.value })}
                    placeholder="Transaction reference number..."
                  />
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
                      <i className="fa fa-save"></i> Save Transfer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transfer Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fa fa-edit"></i>
                Update Transfer
              </h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>From Account <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={editFormData.from_account}
                      onChange={(e) => setEditFormData({ ...editFormData, from_account: Number(e.target.value) })}
                      required
                    >
                      <option value="0">--Select From Account--</option>
                      {accounts.map((account) => (
                        <option key={account.account_ID} value={account.account_ID}>
                          {account.account_Name} {account.accountNum ? `(${account.accountNum})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>To Account <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={editFormData.to_account}
                      onChange={(e) => setEditFormData({ ...editFormData, to_account: Number(e.target.value) })}
                      required
                    >
                      <option value="0">--Select To Account--</option>
                      {accounts.map((account) => (
                        <option key={account.account_ID} value={account.account_ID}>
                          {account.account_Name} {account.accountNum ? `(${account.accountNum})` : ''}
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
                        value={editFormData.amount}
                        onChange={(e) => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
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

                <div className="form-row">
                  <div className="form-group">
                    <label>Charges</label>
                    <div className="input-with-icon">
                      <i className="fa fa-percent"></i>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={editFormData.charges}
                        onChange={(e) => setEditFormData({ ...editFormData, charges: Number(e.target.value) })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Exchange Rate</label>
                    <div className="input-with-icon">
                      <i className="fa fa-exchange-alt"></i>
                      <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        value={editFormData.exchange_rate}
                        onChange={(e) => setEditFormData({ ...editFormData, exchange_rate: Number(e.target.value) })}
                        placeholder="1.0000"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Transaction Reference</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.trx}
                    onChange={(e) => setEditFormData({ ...editFormData, trx: e.target.value })}
                    placeholder="Transaction reference number..."
                  />
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
                      <i className="fa fa-save"></i> Update Transfer
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

