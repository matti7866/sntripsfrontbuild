import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import recurringExpenseService from '../../services/recurringExpenseService';
import { FormSection, FormField } from '../../components/form';
import type { RecurringExpense, RecurringExpenseFilters, RecurringExpenseSummary, Currency } from '../../types/recurringExpense';
import currencyService from '../../services/currencyService';
import './RecurringExpenses.css';

const categoryLabels: { [key: string]: string } = {
  office_rent: 'Office Rent',
  shop_rent: 'Shop Rent',
  sim_card: 'SIM Cards',
  utilities: 'Utilities',
  subscription: 'Subscriptions',
  other: 'Other'
};

export default function RecurringExpenses() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [summary, setSummary] = useState<RecurringExpenseSummary>({
    yearly_totals_by_category: {},
    grand_total_yearly: 0,
    year: new Date().getFullYear()
  });
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RecurringExpenseFilters>({
    category: '',
    is_active: 1
  });
  
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [formData, setFormData] = useState({
    expense_name: '',
    category: 'office_rent',
    amount: '',
    currency_id: 1,
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    description: '',
    is_active: 1
  });

  useEffect(() => {
    loadCurrencies();
    loadExpenses();
  }, []);

  const loadCurrencies = async () => {
    try {
      const data = await currencyService.getCurrencies();
      setCurrencies(data);
    } catch (error) {
      console.error('Failed to load currencies:', error);
    }
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const response = await recurringExpenseService.getRecurringExpenses(filters);
      setExpenses(response.data);
      setSummary(response.summary);
    } catch (error: any) {
      console.error('Failed to load recurring expenses:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load recurring expenses';
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof RecurringExpenseFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    loadExpenses();
  };

  const handleReset = () => {
    setFilters({
      category: '',
      is_active: 1
    });
    setTimeout(() => loadExpenses(), 100);
  };

  const handleAdd = () => {
    setEditingExpense(null);
    setFormData({
      expense_name: '',
      category: 'office_rent',
      amount: '',
      currency_id: 1,
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      description: '',
      is_active: 1
    });
    setShowModal(true);
  };

  const handleEdit = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setFormData({
      expense_name: expense.expense_name,
      category: expense.category,
      amount: expense.amount.toString(),
      currency_id: expense.currency_id,
      frequency: expense.frequency,
      start_date: expense.start_date,
      end_date: expense.end_date || '',
      description: expense.description || '',
      is_active: expense.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (expense: RecurringExpense) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete "${expense.expense_name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await recurringExpenseService.deleteRecurringExpense(expense.id);
        Swal.fire('Deleted!', 'Recurring expense has been deleted.', 'success');
        loadExpenses();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete recurring expense', 'error');
      }
    }
  };

  const handleToggleActive = async (expense: RecurringExpense) => {
    try {
      await recurringExpenseService.updateRecurringExpense(expense.id, {
        expense_name: expense.expense_name,
        category: expense.category,
        amount: expense.amount,
        currency_id: expense.currency_id,
        frequency: expense.frequency,
        start_date: expense.start_date,
        end_date: expense.end_date,
        description: expense.description,
        is_active: expense.is_active === 1 ? 0 : 1
      });
      Swal.fire('Success!', `Expense ${expense.is_active === 1 ? 'deactivated' : 'activated'}`, 'success');
      loadExpenses();
    } catch (error) {
      Swal.fire('Error', 'Failed to update status', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.expense_name.trim()) {
      Swal.fire('Error', 'Expense name is required', 'error');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Swal.fire('Error', 'Please enter a valid amount', 'error');
      return;
    }

    try {
      const data = {
        expense_name: formData.expense_name,
        category: formData.category,
        amount: parseFloat(formData.amount),
        currency_id: formData.currency_id,
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        description: formData.description || null,
        is_active: formData.is_active
      };

      if (editingExpense) {
        await recurringExpenseService.updateRecurringExpense(editingExpense.id, data);
        Swal.fire('Success!', 'Recurring expense updated successfully', 'success');
      } else {
        await recurringExpenseService.createRecurringExpense(data);
        Swal.fire('Success!', 'Recurring expense created successfully', 'success');
      }

      setShowModal(false);
      loadExpenses();
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to save recurring expense', 'error');
    }
  };

  const formatCurrency = (amount: number, currencyName?: string) => {
    // Use currency name if available, otherwise default to AED
    const symbol = currencyName || 'AED';
    return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="recurring-expenses-container">
      <div className="recurring-expenses-header">
        <h1><i className="fa fa-repeat me-2"></i>Recurring Expenses</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          <i className="fa fa-plus me-2"></i>Add Recurring Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        {Object.entries(summary.yearly_totals_by_category).map(([category, total]) => (
          <div key={category} className={`summary-card ${category}`}>
            <div className="summary-card-label">{categoryLabels[category] || category}</div>
            <div className="summary-card-amount">AED {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="summary-card-subtitle">Yearly Total</div>
          </div>
        ))}
        <div className="summary-card grand-total">
          <div className="summary-card-label">Total Recurring Expenses ({summary.year})</div>
          <div className="summary-card-amount">AED {summary.grand_total_yearly.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="summary-card-subtitle">Projected Annual Total from Active Expenses</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <FormField
            label="Category"
            name="category"
            type="select"
            value={filters.category || ''}
            onChange={(value) => handleFilterChange('category', value)}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'office_rent', label: 'Office Rent' },
              { value: 'shop_rent', label: 'Shop Rent' },
              { value: 'sim_card', label: 'SIM Cards' },
              { value: 'utilities', label: 'Utilities' },
              { value: 'subscription', label: 'Subscriptions' },
              { value: 'other', label: 'Other' }
            ]}
          />
          <FormField
            label="Status"
            name="is_active"
            type="select"
            value={filters.is_active?.toString() || ''}
            onChange={(value) => handleFilterChange('is_active', value ? parseInt(value) : undefined)}
            options={[
              { value: '', label: 'All Status' },
              { value: '1', label: 'Active' },
              { value: '0', label: 'Inactive' }
            ]}
          />
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSearch}>
              <i className="fa fa-search me-2"></i>Search
            </button>
            <button className="btn btn-secondary" onClick={handleReset}>
              <i className="fa fa-refresh me-2"></i>Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="recurring-expenses-table">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <i className="fa fa-spinner fa-spin fa-3x"></i>
          </div>
        ) : expenses.length === 0 ? (
          <div className="no-data-message">
            <i className="fa fa-inbox"></i>
            <p>No recurring expenses found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Expense Name</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Frequency</th>
                <th>Yearly Total</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    <strong>{expense.expense_name}</strong>
                    {expense.description && (
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                        {expense.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`category-badge ${expense.category}`}>
                      {categoryLabels[expense.category] || expense.category}
                    </span>
                  </td>
                  <td>{formatCurrency(expense.amount, expense.currencyName)}</td>
                  <td>
                    <span className="frequency-badge">{expense.frequency}</span>
                  </td>
                  <td>
                    <strong>{formatCurrency(expense.yearly_amount || 0, expense.currencyName)}</strong>
                  </td>
                  <td>{new Date(expense.start_date).toLocaleDateString()}</td>
                  <td>{expense.end_date ? new Date(expense.end_date).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`status-badge ${expense.is_active ? 'active' : 'inactive'}`}>
                      {expense.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(expense)}
                        title="Edit"
                      >
                        <i className="fa fa-edit"></i>
                      </button>
                      <button
                        className="btn-toggle"
                        onClick={() => handleToggleActive(expense)}
                        title={expense.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <i className={`fa fa-${expense.is_active ? 'pause' : 'play'}`}></i>
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(expense)}
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
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="expense-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="expense-modal" onClick={(e) => e.stopPropagation()}>
            <div className="expense-modal-header">
              <h3>
                <i className="fa fa-repeat me-2"></i>
                {editingExpense ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
              </h3>
              <button className="expense-modal-close" onClick={() => setShowModal(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="expense-modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <FormField
                      label="Expense Name"
                      name="expense_name"
                      type="text"
                      value={formData.expense_name}
                      onChange={(value) => setFormData({ ...formData, expense_name: value })}
                      placeholder="e.g., Main Office Rent"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <FormField
                      label="Category"
                      name="category"
                      type="select"
                      value={formData.category}
                      onChange={(value) => setFormData({ ...formData, category: value })}
                      options={[
                        { value: 'office_rent', label: 'Office Rent' },
                        { value: 'shop_rent', label: 'Shop Rent' },
                        { value: 'sim_card', label: 'SIM Cards' },
                        { value: 'utilities', label: 'Utilities' },
                        { value: 'subscription', label: 'Subscriptions' },
                        { value: 'other', label: 'Other' }
                      ]}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <FormField
                      label="Frequency"
                      name="frequency"
                      type="select"
                      value={formData.frequency}
                      onChange={(value) => setFormData({ ...formData, frequency: value })}
                      options={[
                        { value: 'monthly', label: 'Monthly' },
                        { value: 'quarterly', label: 'Quarterly' },
                        { value: 'yearly', label: 'Yearly' }
                      ]}
                      required
                    />
                  </div>

                  <div className="col-md-8">
                    <FormField
                      label="Amount"
                      name="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(value) => setFormData({ ...formData, amount: value })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <FormField
                      label="Currency"
                      name="currency_id"
                      type="select"
                      value={formData.currency_id}
                      onChange={(value) => setFormData({ ...formData, currency_id: parseInt(value) })}
                      options={currencies.map(c => ({
                        value: c.currencyID,
                        label: c.currencyName
                      }))}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <FormField
                      label="Start Date"
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(value) => setFormData({ ...formData, start_date: value })}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <FormField
                      label="End Date (Optional)"
                      name="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(value) => setFormData({ ...formData, end_date: value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Additional notes about this recurring expense..."
                    />
                  </div>

                  <div className="col-12">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active === 1}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                      />
                      <label className="form-check-label" htmlFor="is_active">
                        Active (Include in yearly calculations)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="expense-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fa fa-save me-2"></i>
                  {editingExpense ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

