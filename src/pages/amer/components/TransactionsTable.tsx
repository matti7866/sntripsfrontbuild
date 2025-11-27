import type { AmerTransaction } from '../../../types/amer';

interface TransactionsTableProps {
  transactions: AmerTransaction[];
  isLoading: boolean;
  onEdit: (transaction: AmerTransaction) => void;
  onDelete: (id: number) => void;
  onChangeStatus: (transaction: AmerTransaction) => void;
  onViewAttachments: (transaction: AmerTransaction) => void;
}

export default function TransactionsTable({
  transactions,
  isLoading,
  onEdit,
  onDelete,
  onChangeStatus,
  onViewAttachments
}: TransactionsTableProps) {
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; icon: string }> = {
      pending: { class: 'status-pending', icon: 'fa-clock' },
      completed: { class: 'status-completed', icon: 'fa-check-circle' },
      rejected: { class: 'status-rejected', icon: 'fa-times-circle' },
      refunded: { class: 'status-refunded', icon: 'fa-rotate-left' },
      visit_required: { class: 'status-visit', icon: 'fa-user-clock' }
    };
    return badges[status] || { class: 'status-default', icon: 'fa-circle-question' };
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString || 'N/A';
      }
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString || 'N/A';
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-AE', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="table-card">
        <div className="table-card-header">
          <div className="table-header-left">
            <i className="fa fa-list table-icon"></i>
            <h3>Transactions</h3>
          </div>
        </div>
        <div className="table-card-body">
          <div className="loading-state">
            <div className="loading-spinner">
              <i className="fa fa-spinner fa-spin"></i>
            </div>
            <p>Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-card-header">
        <div className="table-header-left">
          <i className="fa fa-list table-icon"></i>
          <h3>Transactions</h3>
          <span className="record-count">{transactions.length} records</span>
        </div>
      </div>
      <div className="table-card-body">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fa fa-inbox"></i>
            </div>
            <h4>No transactions found</h4>
            <p>Try adjusting your filters or add a new transaction</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer / Passenger</th>
                  <th>Transaction Details</th>
                  <th>Account</th>
                  <th>Status</th>
                  <th>Net Cost</th>
                  <th>Sale Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={transaction.id} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                    <td className="cell-id">
                      <span className="id-badge">#{transaction.id}</span>
                    </td>
                    <td className="cell-customer">
                      <div className="customer-info">
                        <span className="customer-name">{transaction.customer_name || 'N/A'}</span>
                        <span className="passenger-name">
                          <i className="fa fa-user-circle"></i>
                          {transaction.passenger_name}
                        </span>
                      </div>
                    </td>
                    <td className="cell-details">
                      <div className="transaction-details">
                        <span className="detail-type">
                          <i className="fa fa-tag"></i>
                          {transaction.type_name}
                        </span>
                        <span className="detail-numbers">
                          <span className="number-item">
                            <strong>Trx#</strong> {transaction.transaction_number}
                          </span>
                          <span className="number-item">
                            <strong>App#</strong> {transaction.application_number}
                          </span>
                        </span>
                        <span className="detail-date">
                          <i className="fa fa-calendar"></i>
                          {formatDate(transaction.payment_date)}
                        </span>
                        {transaction.iban && (
                          <span className="detail-iban">
                            <i className="fa fa-credit-card"></i>
                            {transaction.iban}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="cell-account">
                      <span className="account-name">
                        {transaction.account_Name || 'No Account'}
                      </span>
                    </td>
                    <td className="cell-status">
                      <span className={`status-badge ${getStatusBadge(transaction.status).class}`}>
                        <i className={`fa ${getStatusBadge(transaction.status).icon}`}></i>
                        {formatStatus(transaction.status)}
                      </span>
                    </td>
                    <td className="cell-amount">
                      <span className="amount cost-amount">
                        {formatCurrency(transaction.cost_price)} AED
                      </span>
                    </td>
                    <td className="cell-amount">
                      <span className="amount sale-amount">
                        {formatCurrency(transaction.sale_price)} AED
                      </span>
                    </td>
                    <td className="cell-actions">
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-attachments"
                          onClick={() => onViewAttachments(transaction)}
                          title="View Attachments"
                        >
                          <i className="fa fa-paperclip"></i>
                        </button>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => onEdit(transaction)}
                          title="Edit Transaction"
                        >
                          <i className="fa fa-pen-to-square"></i>
                        </button>
                        <button
                          className="btn-action btn-status"
                          onClick={() => onChangeStatus(transaction)}
                          title="Change Status"
                        >
                          <i className="fa fa-rotate"></i>
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => onDelete(transaction.id)}
                          title="Delete Transaction"
                        >
                          <i className="fa fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
