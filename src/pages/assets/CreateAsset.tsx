import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import assetService from '../../services/assetService';
import type { Asset, AssetLookups } from '../../types/asset';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Swal from 'sweetalert2';
import './CreateAsset.css';

export default function CreateAsset() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [lookups, setLookups] = useState<AssetLookups | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Asset>>({
    asset_name: '',
    asset_type_id: 0,
    purchase_date: '',
    purchase_price: 0,
    purchase_currency_id: 1,
    current_value: 0,
    depreciation_rate: 0,
    description: '',
    location: '',
    serial_number: '',
    registration_number: '',
    brand: '',
    model: '',
    year: undefined,
    condition: 'good',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    loadLookups();
    if (isEditMode && id) {
      loadAsset(parseInt(id));
    }
  }, [id]);

  const loadLookups = async () => {
    try {
      const data = await assetService.getLookups();
      setLookups(data);
      if (!isEditMode && data.asset_types.length > 0) {
        setFormData(prev => ({ ...prev, asset_type_id: data.asset_types[0].type_id }));
      }
    } catch (error: any) {
      Swal.fire('Error', 'Failed to load form data', 'error');
    }
  };

  const loadAsset = async (assetId: number) => {
    setLoading(true);
    try {
      const data = await assetService.getAsset(assetId);
      setFormData(data);
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to load asset', 'error');
      navigate('/assets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.asset_name || !formData.asset_type_id) {
      Swal.fire('Error', 'Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      if (isEditMode && id) {
        await assetService.updateAsset(parseInt(id), formData);
        await Swal.fire('Success', 'Asset updated successfully', 'success');
      } else {
        await assetService.createAsset(formData);
        await Swal.fire('Success', 'Asset created successfully', 'success');
      }
      navigate('/assets');
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to save asset', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Asset, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="create-asset-page">
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
              <i className={`fa fa-${isEditMode ? 'edit' : 'plus'} me-2`}></i>
              {isEditMode ? 'Edit Asset' : 'Add New Asset'}
            </h1>
            <p 
              className="text-muted"
              style={{ 
                color: '#9ca3af', 
                backgroundColor: 'transparent',
                marginTop: '4px'
              }}
            >
              {isEditMode ? 'Update asset information' : 'Add a new asset to your inventory'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/assets')}
          >
            <i className="fa fa-arrow-left me-2"></i>
            Back to List
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Main Information */}
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fa fa-info-circle me-2"></i>
                  Basic Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Asset Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.asset_name}
                      onChange={(e) => handleChange('asset_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Asset Type <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={formData.asset_type_id}
                      onChange={(e) => handleChange('asset_type_id', Number(e.target.value))}
                      required
                    >
                      <option value={0}>Select Type</option>
                      {lookups?.asset_types.map((type) => (
                        <option key={type.type_id} value={type.type_id}>
                          {type.type_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.brand || ''}
                      onChange={(e) => handleChange('brand', e.target.value)}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Model</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.model || ''}
                      onChange={(e) => handleChange('model', e.target.value)}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Year</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.year || ''}
                      onChange={(e) => handleChange('year', e.target.value ? Number(e.target.value) : undefined)}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Serial Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.serial_number || ''}
                      onChange={(e) => handleChange('serial_number', e.target.value)}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Registration Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.registration_number || ''}
                      onChange={(e) => handleChange('registration_number', e.target.value)}
                      placeholder="For vehicles or registered items"
                    />
                  </div>

                  <div className="col-md-12 mb-3">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.location || ''}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="Where is this asset located?"
                    />
                  </div>

                  <div className="col-md-12 mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => handleChange('description', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fa fa-money-bill me-2"></i>
                  Financial Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Purchase Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.purchase_date || ''}
                      onChange={(e) => handleChange('purchase_date', e.target.value)}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Purchase Price</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.purchase_price || 0}
                      onChange={(e) => handleChange('purchase_price', Number(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Currency</label>
                    <select
                      className="form-select"
                      value={formData.purchase_currency_id}
                      onChange={(e) => handleChange('purchase_currency_id', Number(e.target.value))}
                    >
                      {lookups?.currencies.map((currency) => (
                        <option key={currency.currency_id} value={currency.currency_id}>
                          {currency.short_name} ({currency.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Current Value</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.current_value || 0}
                      onChange={(e) => handleChange('current_value', Number(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Annual Depreciation Rate (%)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.depreciation_rate || 0}
                      onChange={(e) => handleChange('depreciation_rate', Number(e.target.value))}
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fa fa-sticky-note me-2"></i>
                  Additional Notes
                </h5>
              </div>
              <div className="card-body">
                <textarea
                  className="form-control"
                  rows={4}
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Any additional information about this asset..."
                />
              </div>
            </div>
          </div>

          {/* Status & Condition Sidebar */}
          <div className="col-lg-4">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fa fa-cog me-2"></i>
                  Status & Condition
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    {lookups?.statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Condition</label>
                  <select
                    className="form-select"
                    value={formData.condition}
                    onChange={(e) => handleChange('condition', e.target.value)}
                  >
                    {lookups?.conditions.map((condition) => (
                      <option key={condition.value} value={condition.value}>
                        {condition.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.status === 'sold' && (
                  <>
                    <hr />
                    <h6 className="mb-3">Sale Information</h6>
                    <div className="mb-3">
                      <label className="form-label">Sold Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.sold_date || ''}
                        onChange={(e) => handleChange('sold_date', e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Sold Price</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.sold_price || 0}
                        onChange={(e) => handleChange('sold_price', Number(e.target.value))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Sold To</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.sold_to || ''}
                        onChange={(e) => handleChange('sold_to', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="card">
              <div className="card-body">
                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fa fa-spinner fa-spin me-2"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-save me-2"></i>
                      {isEditMode ? 'Update Asset' : 'Create Asset'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary w-100"
                  onClick={() => navigate('/assets')}
                  disabled={saving}
                >
                  <i className="fa fa-times me-2"></i>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

