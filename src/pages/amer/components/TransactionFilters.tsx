import { useState } from 'react';
import SearchableSelect from '../../../components/form/SearchableSelect';
import type { AmerTransactionFilters, DropdownData } from '../../../types/amer';

interface TransactionFiltersProps {
  filters: AmerTransactionFilters;
  searchTerm: string;
  dropdowns?: DropdownData;
  onFiltersChange: (filters: AmerTransactionFilters) => void;
  onSearchTermChange: (term: string) => void;
  onSearch: () => void;
  onReset: () => void;
  onAddTransaction: () => void;
}

export default function TransactionFilters({
  filters,
  searchTerm,
  dropdowns,
  onFiltersChange,
  onSearchTermChange,
  onSearch,
  onReset,
  onAddTransaction
}: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="filters-card">
      <div className="filters-card-header">
        <div className="filters-header-left">
          <i className="fa fa-filter filters-icon"></i>
          <h3>Search Transactions</h3>
        </div>
        <div className="filters-header-right">
          <button
            type="button"
            className="btn btn-expand"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            <i className={`fa fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
          </button>
          <button className="btn btn-primary-action" onClick={onAddTransaction}>
            <i className="fa fa-plus"></i>
            <span>Add Transaction</span>
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="filters-card-body">
          <div className="filters-grid">
            <div className="filter-item">
              <label>
                <i className="fa fa-calendar"></i>
                From Date
              </label>
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => onFiltersChange({ ...filters, start_date: e.target.value })}
                className="form-input"
              />
            </div>
            
            <div className="filter-item">
              <label>
                <i className="fa fa-calendar"></i>
                To Date
              </label>
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => onFiltersChange({ ...filters, end_date: e.target.value })}
                className="form-input"
              />
            </div>
            
            <div className="filter-item">
              <label>
                <i className="fa fa-user"></i>
                Customer
              </label>
              <SearchableSelect
                options={[
                  { value: '', label: 'All Customers' },
                  ...(dropdowns?.customers?.map(c => ({
                    value: c.customer_id,
                    label: c.customer_name
                  })) || [])
                ]}
                value={filters.customer || ''}
                onChange={(value) => {
                  const numValue = typeof value === 'number' ? value : parseInt(String(value), 10);
                  onFiltersChange({ ...filters, customer: !isNaN(numValue) && value !== '' ? numValue : undefined });
                }}
                placeholder="All Customers"
              />
            </div>
            
            <div className="filter-item">
              <label>
                <i className="fa fa-tag"></i>
                Type
              </label>
              <SearchableSelect
                options={[
                  { value: '', label: 'All Types' },
                  ...(dropdowns?.types?.map(t => ({
                    value: t.id,
                    label: t.name
                  })) || [])
                ]}
                value={filters.type || ''}
                onChange={(value) => {
                  const numValue = typeof value === 'number' ? value : parseInt(String(value), 10);
                  onFiltersChange({ ...filters, type: !isNaN(numValue) && value !== '' ? numValue : undefined });
                }}
                placeholder="All Types"
              />
            </div>
            
            <div className="filter-item">
              <label>
                <i className="fa fa-building-columns"></i>
                Account
              </label>
              <SearchableSelect
                options={[
                  { value: '', label: 'All Accounts' },
                  ...(dropdowns?.accounts?.map(a => ({
                    value: a.account_ID,
                    label: a.account_Name
                  })) || [])
                ]}
                value={filters.account || ''}
                onChange={(value) => {
                  const numValue = typeof value === 'number' ? value : parseInt(String(value), 10);
                  onFiltersChange({ ...filters, account: !isNaN(numValue) && value !== '' ? numValue : undefined });
                }}
                placeholder="All Accounts"
              />
            </div>
            
            <div className="filter-item">
              <label>
                <i className="fa fa-circle-check"></i>
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => onFiltersChange({ ...filters, status: e.target.value || undefined })}
                className="form-input"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="refunded">Refunded</option>
                <option value="visit_required">Visit Required</option>
              </select>
            </div>
            
            <div className="filter-item">
              <label>
                <i className="fa fa-search"></i>
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                placeholder="Transaction #, App #, Name, IBAN..."
                className="form-input"
              />
            </div>
            
            <div className="filter-item filter-actions">
              <label>&nbsp;</label>
              <div className="action-buttons-row">
                <button className="btn btn-search" onClick={onSearch}>
                  <i className="fa fa-search"></i>
                  Search
                </button>
                <button className="btn btn-reset" onClick={onReset}>
                  <i className="fa fa-rotate-right"></i>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
