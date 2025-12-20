import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import creditCardService from '../../services/creditCardService';
import type {
  CreditCard,
  CreateCreditCardRequest,
  UpdateCreditCardRequest,
  CreditCardTransaction
} from '../../types/creditCard';
import type { Currency } from '../../types/accountManagement';
import './CreditCards.css';

export default function CreditCards() {
  const queryClient = useQueryClient();

  // State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showTransactionsListModal, setShowTransactionsListModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionType, setTransactionType] = useState<'debit' | 'credit'>('debit');

  // Form states
  const [formData, setFormData] = useState<CreateCreditCardRequest>({
    account_name: '',
    account_number: '',
    card_holder_name: '',
    card_type: 'Visa',
    bank_name: '',
    credit_limit: 0,
    billing_cycle_day: 1,
    payment_due_day: 21,
    interest_rate: 0,
    currency_type: 0,
    expiry_date: '',
    notes: ''
  });

  const [editFormData, setEditFormData] = useState<UpdateCreditCardRequest>({
    accountID: 0,
    updaccount_name: '',
    updaccount_number: '',
    card_holder_name: '',
    card_type: 'Visa',
    bank_name: '',
    credit_limit: 0,
    billing_cycle_day: 1,
    payment_due_day: 21,
    interest_rate: 0,
    updcurrency_type: 0,
    expiry_date: '',
    is_active: true,
    notes: ''
  });

  const [transactionFormData, setTransactionFormData] = useState({
    amount: 0,
    category: '',
    merchant: '',
    description: '',
    reference: '',
    notes: '',
    transaction_date: new Date().toISOString().slice(0, 16)
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});

  // Fetch credit cards
  const { data: creditCards = [], isLoading, refetch, error } = useQuery<CreditCard[]>({
    queryKey: ['credit-cards'],
    queryFn: () => creditCardService.getCreditCards(),
    retry: 1,
    staleTime: 30000
  });

  // Fetch currencies
  const { data: currencies = [], error: currenciesError } = useQuery<Currency[]>({
    queryKey: ['credit-card-currencies'],
    queryFn: () => creditCardService.getCurrencies(),
    staleTime: 300000,
    retry: 1
  });

  // Initialize currency when currencies load
  useEffect(() => {
    if (currencies.length > 0 && formData.currency_type === 0) {
      setFormData(prev => ({ ...prev, currency_type: currencies[0].currencyID }));
    }
  }, [currencies]);

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (data: CreateCreditCardRequest) => creditCardService.addCreditCard(data),
    onSuccess: (response) => {
      if (response === 'Success' || response.trim() === 'Success') {
        Swal.fire('Success', 'Credit card added successfully', 'success');
        setShowAddModal(false);
        resetAddForm();
        refetch();
      } else {
        Swal.fire('Error', response, 'error');
      }
    },
    onError: (error: any) => {
      Swal.fire('Error', error.response?.data?.message || 'Failed to add credit card', 'error');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateCreditCardRequest) => creditCardService.updateCreditCard(data),
    onSuccess: (response) => {
      if (response === 'Success' || response.trim() === 'Success') {
        Swal.fire('Success', 'Credit card updated successfully', 'success');
        setShowEditModal(false);
        resetEditForm();
        refetch();
      } else {
        Swal.fire('Error', response, 'error');
      }
    },
    onError: (error: any) => {
      Swal.fire('Error', error.response?.data?.message || 'Failed to update credit card', 'error');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => creditCardService.deleteCreditCard(id),
    onSuccess: (response) => {
      if (response === 'Success' || response.trim() === 'Success') {
        Swal.fire('Success', 'Credit card deleted successfully', 'success');
        refetch();
      } else {
        Swal.fire('Error', response, 'error');
      }
    },
    onError: (error: any) => {
      Swal.fire('Error', error.response?.data?.message || 'Failed to delete credit card', 'error');
    }
  });

  const resetAddForm = () => {
    setFormData({
      account_name: '',
      account_number: '',
      card_holder_name: '',
      card_type: 'Visa',
      bank_name: '',
      credit_limit: 0,
      billing_cycle_day: 1,
      payment_due_day: 21,
      interest_rate: 0,
      currency_type: currencies.length > 0 ? currencies[0].currencyID : 0,
      expiry_date: '',
      notes: ''
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      accountID: 0,
      updaccount_name: '',
      updaccount_number: '',
      card_holder_name: '',
      card_type: 'Visa',
      bank_name: '',
      credit_limit: 0,
      billing_cycle_day: 1,
      payment_due_day: 21,
      interest_rate: 0,
      updcurrency_type: 0,
      expiry_date: '',
      is_active: true,
      notes: ''
    });
    setSelectedCard(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  const handleEditClick = (card: CreditCard) => {
    setSelectedCard(card);
    setEditFormData({
      accountID: card.account_ID,
      updaccount_name: card.account_Name,
      updaccount_number: card.accountNum || '',
      card_holder_name: card.card_holder_name || '',
      card_type: card.card_type || 'Visa',
      bank_name: card.bank_name || '',
      credit_limit: card.credit_limit || 0,
      billing_cycle_day: card.billing_cycle_day || 1,
      payment_due_day: card.payment_due_day || 21,
      interest_rate: card.interest_rate || 0,
      updcurrency_type: card.curID,
      expiry_date: card.expiry_date || '',
      is_active: card.is_active !== false,
      notes: card.notes || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(editFormData);
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the credit card permanently!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
      }
    });
  };

  const handleAddTransaction = async (type: 'debit' | 'credit') => {
    if (!selectedCard) return;
    
    try {
      await creditCardService.addTransaction({
        account_id: selectedCard.account_ID,
        transaction_type: type,
        amount: transactionFormData.amount,
        currency_id: selectedCard.curID,
        category: transactionFormData.category || undefined,
        merchant: transactionFormData.merchant || undefined,
        description: transactionFormData.description || undefined,
        reference: transactionFormData.reference || undefined,
        notes: transactionFormData.notes || undefined,
        transaction_date: transactionFormData.transaction_date || undefined
      });
      
      Swal.fire('Success', `${type === 'debit' ? 'Expense' : 'Payment'} added successfully`, 'success');
      setShowTransactionModal(false);
      resetTransactionForm();
      refetch(); // Refresh cards to update balance
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to add transaction', 'error');
    }
  };

  const handleViewTransactions = async (card: CreditCard) => {
    setSelectedCard(card);
    try {
      const txns = await creditCardService.getCreditCardTransactions(card.account_ID, undefined, undefined, 50);
      setTransactions(txns);
      setShowTransactionsListModal(true);
    } catch (error) {
      Swal.fire('Error', 'Failed to load transactions', 'error');
    }
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    try {
      await creditCardService.deleteTransaction(transactionId);
      Swal.fire('Success', 'Transaction deleted successfully', 'success');
      if (selectedCard) {
        const txns = await creditCardService.getCreditCardTransactions(selectedCard.account_ID);
        setTransactions(txns);
      }
      refetch();
    } catch (error: any) {
      Swal.fire('Error', 'Failed to delete transaction', 'error');
    }
  };

  const resetTransactionForm = () => {
    setTransactionFormData({
      amount: 0,
      category: '',
      merchant: '',
      description: '',
      reference: '',
      notes: '',
      transaction_date: new Date().toISOString().slice(0, 16)
    });
  };

  const openTransactionModal = (card: CreditCard, type: 'debit' | 'credit') => {
    setSelectedCard(card);
    setTransactionType(type);
    resetTransactionForm();
    setShowTransactionModal(true);
  };

  // Load categories on mount
  useEffect(() => {
    creditCardService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const getCardTypeIcon = (cardType?: string) => {
    switch (cardType) {
      case 'Visa':
        return '💳';
      case 'Mastercard':
        return '💳';
      case 'American Express':
        return '💳';
      default:
        return '💳';
    }
  };

  const getUtilizationPercentage = (card: CreditCard) => {
    if (!card.credit_limit || card.credit_limit === 0) return 0;
    const balance = card.current_balance || 0;
    return Math.min((balance / card.credit_limit) * 100, 100);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage < 30) return 'success';
    if (percentage < 60) return 'warning';
    return 'danger';
  };

  // Filter credit cards - memoized to prevent recalculation on every render
  const filteredCards = useMemo(() => {
    if (!searchTerm) return creditCards;
    const lowerSearch = searchTerm.toLowerCase();
    return creditCards.filter(card =>
      card.account_Name.toLowerCase().includes(lowerSearch) ||
      card.bank_name?.toLowerCase().includes(lowerSearch) ||
      card.card_holder_name?.toLowerCase().includes(lowerSearch)
    );
  }, [creditCards, searchTerm]);

  // Calculate totals - memoized to prevent recalculation on every render
  const { totalCreditLimit, totalBalance, totalAvailable } = useMemo(() => {
    const limit = creditCards.reduce((sum, card) => sum + (card.credit_limit || 0), 0);
    const balance = creditCards.reduce((sum, card) => sum + (card.current_balance || 0), 0);
    const available = limit - balance;
    return { totalCreditLimit: limit, totalBalance: balance, totalAvailable: available };
  }, [creditCards]);

  return (
    <div className="credit-cards-container">
      <div className="page-header">
        <h1>
          <i className="fa fa-credit-card me-2"></i>
          Credit Cards Management
        </h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <i className="fa fa-plus me-2"></i>
          Add New Credit Card
        </button>
      </div>

      {/* Summary Cards */}
      <div className="credit-summary-cards">
        <div className="summary-card">
          <div className="summary-icon">
            <i className="fa fa-credit-card"></i>
          </div>
          <div className="summary-content">
            <h3>{creditCards.length}</h3>
            <p>Total Cards</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon success">
            <i className="fa fa-chart-line"></i>
          </div>
          <div className="summary-content">
            <h3>{totalCreditLimit.toLocaleString()}</h3>
            <p>Total Credit Limit</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon warning">
            <i className="fa fa-money-bill-wave"></i>
          </div>
          <div className="summary-content">
            <h3>{totalBalance.toLocaleString()}</h3>
            <p>Total Balance</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon info">
            <i className="fa fa-wallet"></i>
          </div>
          <div className="summary-content">
            <h3>{totalAvailable.toLocaleString()}</h3>
            <p>Available Credit</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-box">
        <i className="fa fa-search"></i>
        <input
          type="text"
          placeholder="Search credit cards by name, bank, or cardholder..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '20px', padding: '20px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '10px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
            <i className="fa fa-exclamation-triangle me-2"></i>
            Backend Not Connected
          </h4>
          <p style={{ margin: '0', color: '#856404' }}>
            The credit cards API is not available yet. Please implement the backend endpoints following the guide in <code>CREDIT_CARDS_BACKEND_GUIDE.md</code>
          </p>
          <button 
            className="btn btn-warning mt-3" 
            onClick={() => refetch()}
            style={{ background: '#ffc107', border: 'none', color: '#000' }}
          >
            <i className="fa fa-sync me-2"></i>
            Retry Connection
          </button>
        </div>
      )}

      {/* Credit Cards Grid */}
      {isLoading ? (
        <div className="loading-state">
          <i className="fa fa-spinner fa-spin"></i> Loading credit cards...
        </div>
      ) : filteredCards.length === 0 && !error ? (
        <div className="empty-state">
          <i className="fa fa-credit-card fa-3x mb-3"></i>
          <p>No credit cards found</p>
          <button className="btn btn-primary mt-3" onClick={() => setShowAddModal(true)}>
            <i className="fa fa-plus me-2"></i>
            Add Your First Credit Card
          </button>
        </div>
      ) : (
        <div className="credit-cards-grid">
          {filteredCards.map((card) => {
            const utilization = getUtilizationPercentage(card);
            const utilizationColor = getUtilizationColor(utilization);

            return (
              <div 
                key={card.account_ID} 
                className={`credit-card-item landscape ${!card.is_active ? 'inactive' : ''}`}
                data-card-type={card.card_type || 'Default'}
              >
                <div className="card-left-section">
                  <div className="card-header-landscape">
                    <div className="card-type">
                      <span className="card-icon">{getCardTypeIcon(card.card_type)}</span>
                      <span className="card-type-name">{card.card_type || 'Credit Card'}</span>
                    </div>
                    {!card.is_active && <span className="badge badge-secondary">Inactive</span>}
                  </div>
                  
                  <div className="card-main-info">
                    <h3 className="card-name">{card.account_Name}</h3>
                    <p className="bank-name">
                      <i className="fa fa-university me-2"></i>
                      {card.bank_name || 'N/A'}
                    </p>
                    
                    <div className="card-number">
                      <span>•••• •••• •••• {card.accountNum || '****'}</span>
                    </div>

                    <div className="card-details-row">
                      <div className="card-holder">
                        <i className="fa fa-user me-2"></i>
                        {card.card_holder_name || 'N/A'}
                      </div>
                      {card.expiry_date && (
                        <div className="card-expiry">
                          <i className="fa fa-calendar me-2"></i>
                          {card.expiry_date}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card-right-section">
                  <div className="card-financials-landscape">
                    <div className="financial-item">
                      <span className="financial-label">Credit Limit</span>
                      <strong className="financial-value">{card.credit_limit?.toLocaleString() || 0} {card.currencyName || ''}</strong>
                    </div>
                    <div className="financial-item">
                      <span className="financial-label">Balance</span>
                      <strong className="financial-value text-danger">{card.current_balance?.toLocaleString() || 0} {card.currencyName || ''}</strong>
                    </div>
                    <div className="financial-item">
                      <span className="financial-label">Available</span>
                      <strong className="financial-value text-success">{card.available_credit?.toLocaleString() || card.credit_limit || 0} {card.currencyName || ''}</strong>
                    </div>
                  </div>

                  {/* Utilization Bar */}
                  {card.credit_limit && card.credit_limit > 0 && (
                    <div className="utilization-section-landscape">
                      <div className="utilization-label">
                        <span>Utilization</span>
                        <span className={`text-${utilizationColor}`}>{utilization.toFixed(1)}%</span>
                      </div>
                      <div className="progress">
                        <div 
                          className={`progress-bar bg-${utilizationColor}`}
                          style={{ width: `${utilization}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Billing Info */}
                  {(card.billing_cycle_day || card.payment_due_day) && (
                    <div className="billing-info-landscape">
                      {card.billing_cycle_day && (
                        <span className="info-badge">
                          <i className="fa fa-calendar-alt me-1"></i>
                          Billing: Day {card.billing_cycle_day}
                        </span>
                      )}
                      {card.payment_due_day && (
                        <span className="info-badge">
                          <i className="fa fa-clock me-1"></i>
                          Due: Day {card.payment_due_day}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="card-footer-landscape">
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => openTransactionModal(card, 'debit')}
                      title="Add Expense"
                    >
                      <i className="fa fa-minus-circle"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => openTransactionModal(card, 'credit')}
                      title="Add Payment"
                    >
                      <i className="fa fa-plus-circle"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleViewTransactions(card)}
                      title="View Transactions"
                    >
                      <i className="fa fa-list"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleEditClick(card)}
                      title="Edit"
                    >
                      <i className="fa fa-edit"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(card.account_ID)}
                      title="Delete"
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fa fa-credit-card me-2"></i>
                Add New Credit Card
              </h5>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="account_name">Card Name / Nickname *</label>
                    <input
                      type="text"
                      id="account_name"
                      className="form-control"
                      value={formData.account_name}
                      onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                      placeholder="e.g., Emirates NBD Visa Platinum"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bank_name">Bank Name</label>
                    <input
                      type="text"
                      id="bank_name"
                      className="form-control"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      placeholder="e.g., Emirates NBD"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="card_holder_name">Card Holder Name *</label>
                    <input
                      type="text"
                      id="card_holder_name"
                      className="form-control"
                      value={formData.card_holder_name}
                      onChange={(e) => setFormData({ ...formData, card_holder_name: e.target.value })}
                      placeholder="Name on card"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="card_type">Card Type</label>
                    <select
                      id="card_type"
                      className="form-control"
                      value={formData.card_type}
                      onChange={(e) => setFormData({ ...formData, card_type: e.target.value })}
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="American Express">American Express</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="account_number">Last 4 Digits</label>
                    <input
                      type="text"
                      id="account_number"
                      className="form-control"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      placeholder="1234"
                      maxLength={4}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="expiry_date">Expiry Date</label>
                    <input
                      type="text"
                      id="expiry_date"
                      className="form-control"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="credit_limit">Credit Limit *</label>
                    <input
                      type="number"
                      id="credit_limit"
                      className="form-control"
                      value={formData.credit_limit || ''}
                      onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="currency_type">Currency *</label>
                    <select
                      id="currency_type"
                      className="form-control"
                      value={formData.currency_type}
                      onChange={(e) => setFormData({ ...formData, currency_type: parseInt(e.target.value) })}
                      required
                    >
                      {currencies.map(currency => (
                        <option key={currency.currencyID} value={currency.currencyID}>
                          {currency.currencyName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="billing_cycle_day">Billing Cycle Day</label>
                    <input
                      type="number"
                      id="billing_cycle_day"
                      className="form-control"
                      value={formData.billing_cycle_day || ''}
                      onChange={(e) => setFormData({ ...formData, billing_cycle_day: parseInt(e.target.value) || 1 })}
                      placeholder="1-31"
                      min="1"
                      max="31"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="payment_due_day">Payment Due (Days After Billing)</label>
                    <input
                      type="number"
                      id="payment_due_day"
                      className="form-control"
                      value={formData.payment_due_day || ''}
                      onChange={(e) => setFormData({ ...formData, payment_due_day: parseInt(e.target.value) || 21 })}
                      placeholder="21"
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="interest_rate">Interest Rate (%)</label>
                    <input
                      type="number"
                      id="interest_rate"
                      className="form-control"
                      value={formData.interest_rate || ''}
                      onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    className="form-control"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Adding...' : 'Add Credit Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCard && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fa fa-edit me-2"></i>
                Edit Credit Card
              </h5>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit_account_name">Card Name / Nickname *</label>
                    <input
                      type="text"
                      id="edit_account_name"
                      className="form-control"
                      value={editFormData.updaccount_name}
                      onChange={(e) => setEditFormData({ ...editFormData, updaccount_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit_bank_name">Bank Name</label>
                    <input
                      type="text"
                      id="edit_bank_name"
                      className="form-control"
                      value={editFormData.bank_name}
                      onChange={(e) => setEditFormData({ ...editFormData, bank_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit_card_holder_name">Card Holder Name *</label>
                    <input
                      type="text"
                      id="edit_card_holder_name"
                      className="form-control"
                      value={editFormData.card_holder_name}
                      onChange={(e) => setEditFormData({ ...editFormData, card_holder_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit_card_type">Card Type</label>
                    <select
                      id="edit_card_type"
                      className="form-control"
                      value={editFormData.card_type}
                      onChange={(e) => setEditFormData({ ...editFormData, card_type: e.target.value })}
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="American Express">American Express</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit_account_number">Last 4 Digits</label>
                    <input
                      type="text"
                      id="edit_account_number"
                      className="form-control"
                      value={editFormData.updaccount_number}
                      onChange={(e) => setEditFormData({ ...editFormData, updaccount_number: e.target.value })}
                      maxLength={4}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit_expiry_date">Expiry Date</label>
                    <input
                      type="text"
                      id="edit_expiry_date"
                      className="form-control"
                      value={editFormData.expiry_date}
                      onChange={(e) => setEditFormData({ ...editFormData, expiry_date: e.target.value })}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit_credit_limit">Credit Limit *</label>
                    <input
                      type="number"
                      id="edit_credit_limit"
                      className="form-control"
                      value={editFormData.credit_limit || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, credit_limit: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit_currency_type">Currency *</label>
                    <select
                      id="edit_currency_type"
                      className="form-control"
                      value={editFormData.updcurrency_type}
                      onChange={(e) => setEditFormData({ ...editFormData, updcurrency_type: parseInt(e.target.value) })}
                      required
                    >
                      {currencies.map(currency => (
                        <option key={currency.currencyID} value={currency.currencyID}>
                          {currency.currencyName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit_billing_cycle_day">Billing Cycle Day</label>
                    <input
                      type="number"
                      id="edit_billing_cycle_day"
                      className="form-control"
                      value={editFormData.billing_cycle_day || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, billing_cycle_day: parseInt(e.target.value) || 1 })}
                      min="1"
                      max="31"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit_payment_due_day">Payment Due (Days After Billing)</label>
                    <input
                      type="number"
                      id="edit_payment_due_day"
                      className="form-control"
                      value={editFormData.payment_due_day || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, payment_due_day: parseInt(e.target.value) || 21 })}
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit_interest_rate">Interest Rate (%)</label>
                    <input
                      type="number"
                      id="edit_interest_rate"
                      className="form-control"
                      value={editFormData.interest_rate || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, interest_rate: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit_is_active">Status</label>
                    <select
                      id="edit_is_active"
                      className="form-control"
                      value={editFormData.is_active ? '1' : '0'}
                      onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value === '1' })}
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="edit_notes">Notes</label>
                  <textarea
                    id="edit_notes"
                    className="form-control"
                    rows={3}
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Updating...' : 'Update Credit Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showTransactionModal && selectedCard && (
        <div className="modal-overlay" onClick={() => setShowTransactionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className={`fa fa-${transactionType === 'debit' ? 'minus' : 'plus'}-circle me-2`}></i>
                {transactionType === 'debit' ? 'Add Expense (Debit)' : 'Add Payment (Credit)'}
              </h5>
              <button className="btn-close" onClick={() => setShowTransactionModal(false)}>×</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAddTransaction(transactionType); }}>
              <div className="modal-body">
                <div className="alert alert-info" style={{ padding: '15px', marginBottom: '20px', background: '#e3f2fd', borderRadius: '8px' }}>
                  <strong>Card:</strong> {selectedCard.account_Name}<br />
                  <strong>Type:</strong> {transactionType === 'debit' ? 'Expense (increases balance)' : 'Payment (decreases balance)'}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="txn_amount">Amount * ({selectedCard.currencyName})</label>
                    <input
                      type="number"
                      id="txn_amount"
                      className="form-control"
                      value={transactionFormData.amount || ''}
                      onChange={(e) => setTransactionFormData({ ...transactionFormData, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="txn_date">Transaction Date *</label>
                    <input
                      type="datetime-local"
                      id="txn_date"
                      className="form-control"
                      value={transactionFormData.transaction_date}
                      onChange={(e) => setTransactionFormData({ ...transactionFormData, transaction_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="txn_category">Category</label>
                    <select
                      id="txn_category"
                      className="form-control"
                      value={transactionFormData.category}
                      onChange={(e) => setTransactionFormData({ ...transactionFormData, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {Object.entries(categories).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="txn_merchant">Merchant/Vendor</label>
                    <input
                      type="text"
                      id="txn_merchant"
                      className="form-control"
                      value={transactionFormData.merchant}
                      onChange={(e) => setTransactionFormData({ ...transactionFormData, merchant: e.target.value })}
                      placeholder="e.g., Carrefour, Emirates Airlines"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="txn_description">Description</label>
                  <input
                    type="text"
                    id="txn_description"
                    className="form-control"
                    value={transactionFormData.description}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, description: e.target.value })}
                    placeholder="Brief description of transaction"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="txn_reference">Reference/Receipt #</label>
                    <input
                      type="text"
                      id="txn_reference"
                      className="form-control"
                      value={transactionFormData.reference}
                      onChange={(e) => setTransactionFormData({ ...transactionFormData, reference: e.target.value })}
                      placeholder="Invoice or receipt number"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="txn_notes">Notes</label>
                  <textarea
                    id="txn_notes"
                    className="form-control"
                    rows={2}
                    value={transactionFormData.notes}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransactionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={`btn btn-${transactionType === 'debit' ? 'danger' : 'success'}`}>
                  <i className={`fa fa-${transactionType === 'debit' ? 'minus' : 'plus'}-circle me-2`}></i>
                  {transactionType === 'debit' ? 'Add Expense' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transactions List Modal */}
      {showTransactionsListModal && selectedCard && (
        <div className="modal-overlay" onClick={() => setShowTransactionsListModal(false)}>
          <div className="modal-content" style={{ maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fa fa-list me-2"></i>
                Transactions - {selectedCard.account_Name}
              </h5>
              <button className="btn-close" onClick={() => setShowTransactionsListModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                  <i className="fa fa-receipt fa-3x mb-3"></i>
                  <p>No transactions found</p>
                </div>
              ) : (
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <table className="table table-striped" style={{ width: '100%' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Merchant</th>
                        <th>Description</th>
                        <th className="text-end">Amount</th>
                        <th className="text-end">Balance</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => (
                        <tr key={txn.transaction_id}>
                          <td style={{ fontSize: '13px' }}>
                            {new Date(txn.transaction_date).toLocaleDateString()}<br />
                            <small style={{ color: '#7f8c8d' }}>{new Date(txn.transaction_date).toLocaleTimeString()}</small>
                          </td>
                          <td>
                            <span className={`badge badge-${
                              txn.transaction_type === 'debit' || txn.transaction_type === 'fee' ? 'danger' : 'success'
                            }`} style={{ padding: '5px 10px', borderRadius: '12px', fontSize: '11px' }}>
                              {txn.transaction_type}
                            </span>
                          </td>
                          <td style={{ fontSize: '13px' }}>{categories[txn.category] || txn.category || '-'}</td>
                          <td style={{ fontSize: '13px' }}>{txn.merchant || '-'}</td>
                          <td style={{ fontSize: '13px' }}>{txn.description || '-'}</td>
                          <td className={`text-end ${txn.transaction_type === 'debit' || txn.transaction_type === 'fee' ? 'text-danger' : 'text-success'}`} style={{ fontWeight: '600', fontSize: '14px' }}>
                            {txn.transaction_type === 'debit' || txn.transaction_type === 'fee' ? '+' : '-'}
                            {parseFloat(txn.amount).toFixed(2)}
                          </td>
                          <td className="text-end" style={{ fontWeight: '600', fontSize: '14px' }}>
                            {parseFloat(txn.running_balance || 0).toFixed(2)}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                Swal.fire({
                                  title: 'Delete Transaction?',
                                  text: 'This action cannot be undone',
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonColor: '#d33',
                                  cancelButtonColor: '#3085d6',
                                  confirmButtonText: 'Yes, delete it!'
                                }).then((result) => {
                                  if (result.isConfirmed) {
                                    handleDeleteTransaction(txn.transaction_id);
                                  }
                                });
                              }}
                              title="Delete"
                            >
                              <i className="fa fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowTransactionsListModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

