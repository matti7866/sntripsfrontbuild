import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import assetService from '../../services/assetService';
import type { Asset, AssetLookups } from '../../types/asset';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Swal from 'sweetalert2';
import './AssetList.css';

export default function AssetList() {
  const navigate = useNavigate();
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [lookups, setLookups] = useState<AssetLookups | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadAssets();
  }, [page, statusFilter, typeFilter]);

  const loadLookups = async () => {
    try {
      const data = await assetService.getLookups();
      setLookups(data);
    } catch (error: any) {
      console.error('Error loading lookups:', error);
    }
  };

  const loadAssets = async () => {
    setLoading(true);
    try {
      const { assets: data, pagination } = await assetService.getAssets({
        search,
        status: statusFilter,
        asset_type_id: typeFilter,
        page,
        limit: 50
      });
      console.log('Assets loaded:', data);
      console.log('Pagination:', pagination);
      console.log('Total records:', pagination.total);
      setAssets(data);
      setTotalPages(pagination.totalPages);
      setTotalRecords(pagination.total);
    } catch (error: any) {
      console.error('Error loading assets:', error);
      console.error('Error response:', error.response);
      Swal.fire('Error', error.response?.data?.message || 'Failed to load assets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadAssets();
  };

  const handleDelete = async (asset: Asset) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${asset.asset_name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await assetService.deleteAsset(asset.asset_id);
        await Swal.fire('Deleted!', 'Asset has been deleted.', 'success');
        loadAssets();
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to delete asset', 'error');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      active: { class: 'bg-success', text: 'Active' },
      sold: { class: 'bg-info', text: 'Sold' },
      disposed: { class: 'bg-danger', text: 'Disposed' },
      under_maintenance: { class: 'bg-warning', text: 'Under Maintenance' },
      rented_out: { class: 'bg-primary', text: 'Rented Out' }
    };
    return badges[status] || { class: 'bg-secondary', text: status };
  };

  const getConditionBadge = (condition: string) => {
    const badges: Record<string, string> = {
      excellent: 'success',
      good: 'info',
      fair: 'warning',
      poor: 'danger'
    };
    return badges[condition] || 'secondary';
  };

  if (loading && assets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="asset-list-page">
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 
              className="page-title"
              style={{ 
                color: '#ffffff', 
                backgroundColor: 'transparent',
                marginBottom: '4px'
              }}
            >
              <i className="fa fa-cube me-2"></i>
              Assets Management
            </h1>
            <p 
              className="text-muted"
              style={{ 
                color: '#9ca3af', 
                backgroundColor: 'transparent',
                marginTop: '4px'
              }}
            >
              Track and manage all your assets
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/assets/create')}
          >
            <i className="fa fa-plus me-2"></i>
            Add New Asset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch} className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, brand, serial, or registration number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={0}>All Types</option>
                {lookups?.asset_types.map((type) => (
                  <option key={type.type_id} value={type.type_id}>
                    {type.type_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                {lookups?.statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100">
                <i className="fa fa-search me-2"></i>
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card stats-card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">{totalRecords}</h3>
                  <p className="mb-0">Total Assets</p>
                </div>
                <i className="fa fa-cube fa-3x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">{assets.filter(a => a.status === 'active').length}</h3>
                  <p className="mb-0">Active</p>
                </div>
                <i className="fa fa-check-circle fa-3x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">{assets.filter(a => a.status === 'under_maintenance').length}</h3>
                  <p className="mb-0">Under Maintenance</p>
                </div>
                <i className="fa fa-wrench fa-3x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">
                    {assets.reduce((sum, a) => sum + a.current_value, 0).toLocaleString()}
                  </h3>
                  <p className="mb-0">Total Value (AED)</p>
                </div>
                <i className="fa fa-money-bill fa-3x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <LoadingSpinner />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-cube fa-3x text-muted mb-3"></i>
              <p className="text-muted">No assets found</p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/assets/create')}
              >
                <i className="fa fa-plus me-2"></i>
                Add First Asset
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Asset Name</th>
                      <th>Type</th>
                      <th>Brand/Model</th>
                      <th>Purchase Price</th>
                      <th>Current Value</th>
                      <th>Condition</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => (
                      <tr key={asset.asset_id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className={`fa ${asset.type_icon} fa-2x me-3 text-primary`}></i>
                            <div>
                              <strong>{asset.asset_name}</strong>
                              {asset.registration_number && (
                                <div className="small text-muted">Reg: {asset.registration_number}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{asset.asset_type_name}</td>
                        <td>
                          {asset.brand && asset.model ? (
                            <div>
                              <div>{asset.brand}</div>
                              <div className="small text-muted">{asset.model} {asset.year && `(${asset.year})`}</div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {asset.purchase_currency_symbol} {asset.purchase_price.toLocaleString()}
                        </td>
                        <td>
                          {asset.purchase_currency_symbol} {asset.current_value.toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge bg-${getConditionBadge(asset.condition)}`}>
                            {asset.condition}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(asset.status).class}`}>
                            {getStatusBadge(asset.status).text}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => navigate(`/assets/${asset.asset_id}`)}
                              title="View Details"
                            >
                              <i className="fa fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => navigate(`/assets/edit/${asset.asset_id}`)}
                              title="Edit"
                            >
                              <i className="fa fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(asset)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Showing page {page} of {totalPages} ({totalRecords} total assets)
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          Previous
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, i) => (
                        <li key={i + 1} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => setPage(i + 1)}
                          >
                            {i + 1}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setPage(page + 1)}
                          disabled={page === totalPages}
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
        </div>
      </div>
    </div>
  );
}

