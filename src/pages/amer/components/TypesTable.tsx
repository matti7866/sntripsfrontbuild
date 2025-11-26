import type { AmerType } from '../../../types/amer';

interface TypesTableProps {
  types: AmerType[];
  isLoading: boolean;
  onEdit: (type: AmerType) => void;
  onDelete: (id: number) => void;
  onAddType: () => void;
}

export default function TypesTable({
  types,
  isLoading,
  onEdit,
  onDelete,
  onAddType
}: TypesTableProps) {
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
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
            <i className="fa fa-tags table-icon"></i>
            <h3>Transaction Types</h3>
          </div>
        </div>
        <div className="table-card-body">
          <div className="loading-state">
            <div className="loading-spinner">
              <i className="fa fa-spinner fa-spin"></i>
            </div>
            <p>Loading types...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-card-header">
        <div className="table-header-left">
          <i className="fa fa-tags table-icon"></i>
          <h3>Transaction Types</h3>
          <span className="record-count">{types.length} types</span>
        </div>
        <div className="table-header-right">
          <button className="btn btn-primary-action" onClick={onAddType}>
            <i className="fa fa-plus"></i>
            <span>Add Type</span>
          </button>
        </div>
      </div>
      <div className="table-card-body">
        {types.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fa fa-folder-open"></i>
            </div>
            <h4>No transaction types found</h4>
            <p>Create a new type to get started</p>
            <button className="btn btn-primary-action mt-3" onClick={onAddType}>
              <i className="fa fa-plus"></i>
              Add Your First Type
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table types-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type Name</th>
                  <th>Cost Price</th>
                  <th>Sale Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {types.map((type, index) => (
                  <tr key={type.id} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                    <td className="cell-id">
                      <span className="id-badge">#{type.id}</span>
                    </td>
                    <td className="cell-name">
                      <span className="type-name">
                        <i className="fa fa-tag"></i>
                        {type.name}
                      </span>
                    </td>
                    <td className="cell-amount">
                      <span className="amount cost-amount">
                        {formatCurrency(type.cost_price)} AED
                      </span>
                    </td>
                    <td className="cell-amount">
                      <span className="amount sale-amount">
                        {formatCurrency(type.sale_price)} AED
                      </span>
                    </td>
                    <td className="cell-actions">
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => onEdit(type)}
                          title="Edit Type"
                        >
                          <i className="fa fa-pen-to-square"></i>
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => onDelete(type.id)}
                          title="Delete Type"
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
