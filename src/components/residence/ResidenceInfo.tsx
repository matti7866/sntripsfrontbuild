import { useState, useEffect } from 'react';
import type { Residence } from '../../types/residence';
import residenceService from '../../services/residenceService';
import { customerService } from '../../services/customerService';
import Button from '../common/Button';
import SearchableSelect from '../form/SearchableSelect';
import Swal from 'sweetalert2';

interface ResidenceInfoProps {
  residence: Residence;
  onUpdate?: () => void;
}

export default function ResidenceInfo({ residence, onUpdate }: ResidenceInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    customer_id: residence.customer_id || null,
    passenger_name: residence.passenger_name || '',
    passportNumber: residence.passportNumber || '',
    passportExpiryDate: residence.passportExpiryDate || '',
    gender: residence.gender || '',
    dob: residence.dob || '',
    uid: residence.uid || '',
    sale_price: residence.sale_price || 0,
    tawjeehIncluded: residence.tawjeehIncluded || 0,
    tawjeeh_amount: residence.tawjeeh_amount || 150,
    insuranceIncluded: residence.insuranceIncluded || 0,
    insuranceAmount: residence.insuranceAmount || 126,
    remarks: residence.remarks || '',
    salary_amount: residence.salary_amount || 0,
  });
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getCustomers({ page: 1, per_page: 1000 });
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount?: number, symbol: string = 'AED') => {
    if (!amount) return '-';
    return `${symbol} ${amount.toLocaleString()}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await residenceService.updateResidence(residence.residenceID, editData);
      setIsEditing(false);
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Residence information updated successfully',
        timer: 2000,
        showConfirmButton: false,
      });
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update residence information',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      customer_id: residence.customer_id || null,
      passenger_name: residence.passenger_name || '',
      passportNumber: residence.passportNumber || '',
      passportExpiryDate: residence.passportExpiryDate || '',
      gender: residence.gender || '',
      dob: residence.dob || '',
      uid: residence.uid || '',
      sale_price: residence.sale_price || 0,
      tawjeehIncluded: residence.tawjeehIncluded || 0,
      tawjeeh_amount: residence.tawjeeh_amount || 150,
      insuranceIncluded: residence.insuranceIncluded || 0,
      insuranceAmount: residence.insuranceAmount || 126,
      remarks: residence.remarks || '',
      salary_amount: residence.salary_amount || 0,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Customer Information */}
      <div className="card p-4" style={{ backgroundColor: '#2d353c', border: '1px solid #495057' }}>
        <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
          <h3 className="text-lg font-bold text-white">
            <i className="fa fa-user mr-2"></i>
            Customer Information
          </h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-xs rounded"
              style={{
                background: 'linear-gradient(to right, #dc2626, #991b1b)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <i className="fa fa-edit mr-1"></i> Edit
            </button>
          )}
        </div>
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-sm block mb-1">Select Customer:</label>
              <SearchableSelect
                options={[
                  { value: '', label: '-- Select Customer --' },
                  ...customers.map(c => ({
                    value: String(c.customer_id),
                    label: `${c.customer_name} - ${c.customer_phone || 'No phone'}`
                  }))
                ]}
                value={editData.customer_id ? String(editData.customer_id) : ''}
                onChange={(value) => setEditData({ ...editData, customer_id: value ? Number(value) : null })}
                placeholder="Search customer..."
              />
              <small className="text-muted d-block mt-1">
                <i className="fa fa-info-circle me-1"></i>
                Select a different customer to reassign this residence
              </small>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Customer:</span>
              <span className="text-white font-medium">{residence.customer_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Phone:</span>
              <span className="text-white">{residence.customer_phone || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email:</span>
              <span className="text-white text-xs">{residence.customer_email || '-'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Passenger Information */}
      <div className="card p-4" style={{ backgroundColor: '#2d353c', border: '1px solid #495057' }}>
        <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
          <h3 className="text-lg font-bold text-white">
            <i className="fa fa-passport mr-2"></i>
            Passenger Information
          </h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-xs rounded"
              style={{
                background: 'linear-gradient(to right, #dc2626, #991b1b)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <i className="fa fa-edit mr-1"></i> Edit
            </button>
          )}
        </div>
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-sm block mb-1">Passenger Name:</label>
              <input
                type="text"
                className="form-control"
                value={editData.passenger_name}
                onChange={(e) => setEditData({ ...editData, passenger_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Passport Number:</label>
              <input
                type="text"
                className="form-control"
                value={editData.passportNumber}
                onChange={(e) => setEditData({ ...editData, passportNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Passport Expiry Date:</label>
              <input
                type="date"
                className="form-control"
                value={editData.passportExpiryDate}
                onChange={(e) => setEditData({ ...editData, passportExpiryDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Gender:</label>
              <select
                className="form-control"
                value={editData.gender}
                onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Date of Birth:</label>
              <input
                type="date"
                className="form-control"
                value={editData.dob}
                onChange={(e) => setEditData({ ...editData, dob: e.target.value })}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">UID Number:</label>
              <input
                type="text"
                className="form-control"
                value={editData.uid}
                onChange={(e) => setEditData({ ...editData, uid: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="text-white font-medium">{residence.passenger_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Nationality:</span>
              <span className="text-white">{residence.nationality_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">DOB:</span>
              <span className="text-white">{formatDate(residence.dob)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Gender:</span>
              <span className="text-white">{residence.gender || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Passport:</span>
              <span className="text-white">{residence.passportNumber || '-'}</span>
            </div>
            {residence.passportExpiryDate && (
              <div className="flex justify-between">
                <span className="text-gray-400">Passport Expiry:</span>
                <span className="text-white">{formatDate(residence.passportExpiryDate)}</span>
              </div>
            )}
            {residence.uid && (
              <div className="flex justify-between">
                <span className="text-gray-400">UID:</span>
                <span className="text-white">{residence.uid}</span>
            </div>
          )}
          {residence.EmiratesIDNumber && (
            <div className="flex justify-between">
              <span className="text-gray-400">Emirates ID:</span>
              <span className="text-white">{residence.EmiratesIDNumber}</span>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Visa & Employment */}
      <div className="card p-4" style={{ backgroundColor: '#2d353c', border: '1px solid #495057' }}>
        <h3 className="text-lg font-bold text-white mb-3 border-b border-gray-700 pb-2">
          <i className="fa fa-briefcase mr-2"></i>
          Visa & Employment
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Visa Type:</span>
            <span className="text-white">{residence.visa_type_name || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Company:</span>
            <span className="text-white">{residence.company_name || 'Individual'}</span>
          </div>
          {residence.position_name && (
            <div className="flex justify-between">
              <span className="text-gray-400">Position:</span>
              <span className="text-white">{residence.position_name}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Salary:</span>
            {isEditing ? (
              <input
                type="number"
                value={editData.salary_amount}
                onChange={(e) => setEditData({ ...editData, salary_amount: parseFloat(e.target.value) || 0 })}
                className="form-control text-right"
                style={{
                  width: '150px',
                  backgroundColor: '#fff',
                  color: '#2d353c',
                  border: '1px solid #495057',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                }}
              />
            ) : (
              <span className="text-white">{formatCurrency(residence.salary_amount || editData.salary_amount)}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Type:</span>
            <span className="text-white">{residence.InsideOutside || '-'}</span>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="card p-4" style={{ backgroundColor: '#2d353c', border: '1px solid #495057' }}>
        <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
          <h3 className="text-lg font-bold text-white">
            <i className="fa fa-money-bill mr-2"></i>
            Financial Summary
          </h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-xs rounded"
              style={{
                background: 'linear-gradient(to right, #dc2626, #991b1b)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <i className="fa fa-edit mr-1"></i> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1 text-xs rounded"
                style={{
                  background: 'linear-gradient(to right, #16a34a, #15803d)',
                  color: 'white',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <i className="fa fa-save mr-1"></i> {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-3 py-1 text-xs rounded"
                style={{
                  background: 'linear-gradient(to right, #6b7280, #4b5563)',
                  color: 'white',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                <i className="fa fa-times mr-1"></i> Cancel
              </button>
            </div>
          )}
        </div>
        <div className="space-y-2 text-sm">
          {/* Sale Price */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Sale Price:</span>
            {isEditing ? (
              <input
                type="number"
                value={editData.sale_price}
                onChange={(e) => setEditData({ ...editData, sale_price: parseFloat(e.target.value) || 0 })}
                className="form-control text-right"
                style={{
                  width: '150px',
                  backgroundColor: '#fff',
                  color: '#2d353c',
                  border: '1px solid #495057',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                }}
              />
            ) : (
              <span className="text-green-400 font-bold">
                {formatCurrency(residence.sale_price, residence.sale_currency_symbol)}
              </span>
            )}
          </div>

          {/* TAWJEEH */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">TAWJEEH Included:</span>
              {isEditing ? (
                <select
                  value={editData.tawjeehIncluded}
                  onChange={(e) => setEditData({ ...editData, tawjeehIncluded: parseInt(e.target.value) })}
                  className="form-control"
                  style={{
                    width: '150px',
                    backgroundColor: '#fff',
                    color: '#2d353c',
                    border: '1px solid #495057',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                  }}
                >
                  <option value={1}>Yes (Included)</option>
                  <option value={0}>No (Separate charge)</option>
                </select>
              ) : (
                <span className={residence.tawjeehIncluded ? 'text-green-400' : 'text-yellow-400'}>
                  {residence.tawjeehIncluded ? 'Yes' : 'No'}
                </span>
              )}
            </div>
            {(isEditing ? editData.tawjeehIncluded === 0 : residence.tawjeehIncluded === 0) && (
              <div className="flex justify-between items-center ml-4">
                <span className="text-gray-400 text-xs">TAWJEEH Amount:</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.tawjeeh_amount}
                    onChange={(e) => setEditData({ ...editData, tawjeeh_amount: parseFloat(e.target.value) || 0 })}
                    className="form-control text-right"
                    style={{
                      width: '150px',
                      backgroundColor: '#fff',
                      color: '#2d353c',
                      border: '1px solid #495057',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                    }}
                  />
                ) : (
                  <span className="text-yellow-400 text-xs">
                    AED {(residence.tawjeeh_amount || 150).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Insurance */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Insurance Included:</span>
              {isEditing ? (
                <select
                  value={editData.insuranceIncluded}
                  onChange={(e) => setEditData({ ...editData, insuranceIncluded: parseInt(e.target.value) })}
                  className="form-control"
                  style={{
                    width: '150px',
                    backgroundColor: '#fff',
                    color: '#2d353c',
                    border: '1px solid #495057',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                  }}
                >
                  <option value={1}>Yes (Included)</option>
                  <option value={0}>No (Separate charge)</option>
                </select>
              ) : (
                <span className={residence.insuranceIncluded ? 'text-green-400' : 'text-yellow-400'}>
                  {residence.insuranceIncluded ? 'Yes' : 'No'}
                </span>
              )}
            </div>
            {(isEditing ? editData.insuranceIncluded === 0 : residence.insuranceIncluded === 0) && (
              <div className="flex justify-between items-center ml-4">
                <span className="text-gray-400 text-xs">Insurance Amount:</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.insuranceAmount}
                    onChange={(e) => setEditData({ ...editData, insuranceAmount: parseFloat(e.target.value) || 0 })}
                    className="form-control text-right"
                    style={{
                      width: '150px',
                      backgroundColor: '#fff',
                      color: '#2d353c',
                      border: '1px solid #495057',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                    }}
                  />
                ) : (
                  <span className="text-yellow-400 text-xs">
                    AED {(residence.insuranceAmount || 126).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Calculate total costs */}
          {(() => {
            const customChargesTotal = parseFloat((residence as any).custom_charges_total as any) || 0;
            const totalCost = (residence.offerLetterCost || 0) +
                             (residence.insuranceCost || 0) +
                             (residence.laborCardFee || 0) +
                             (residence.eVisaCost || 0) +
                             (residence.changeStatusCost || 0) +
                             (residence.medicalTCost || 0) +
                             (residence.emiratesIDCost || 0) +
                             (residence.visaStampingCost || 0) +
                             (residence.iloe_cost || 0) +
                             (residence.tawjeeh_cost || 0) +
                             customChargesTotal;
            
            const profit = residence.sale_price - totalCost;
            
            return (
              <>
                <div className="flex justify-between pt-2 border-t border-gray-700">
                  <span className="text-gray-400">Total Costs:</span>
                  <span className="text-red-400 font-bold">
                    AED {totalCost.toLocaleString()}
                  </span>
                </div>
                {customChargesTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Custom Charges:</span>
                    <span className="text-yellow-400 font-bold">
                      AED {customChargesTotal.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-700">
                  <span className="text-gray-400">Profit:</span>
                  <span className={`font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    AED {profit.toLocaleString()}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Timestamps */}
      <div className="card p-4" style={{ backgroundColor: '#2d353c', border: '1px solid #495057' }}>
        <h3 className="text-lg font-bold text-white mb-3 border-b border-gray-700 pb-2">
          <i className="fa fa-clock mr-2"></i>
          Important Dates
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Created:</span>
            <span className="text-white">{formatDate(residence.datetime)}</span>
          </div>
          {residence.expiry_date && (
            <div className="flex justify-between">
              <span className="text-gray-400">Visa Expiry:</span>
              <span className="text-white">{formatDate(residence.expiry_date)}</span>
            </div>
          )}
          {residence.eid_expiry && (
            <div className="flex justify-between">
              <span className="text-gray-400">EID Expiry:</span>
              <span className="text-white">{formatDate(residence.eid_expiry)}</span>
            </div>
          )}
          {residence.cancelDate && (
            <div className="flex justify-between">
              <span className="text-red-400">Cancelled:</span>
              <span className="text-red-300">{formatDate(residence.cancelDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Remarks */}
      {(residence.remarks || isEditing) && (
        <div className="card p-4" style={{ backgroundColor: '#2d353c', border: '1px solid #495057' }}>
          <h3 className="text-lg font-bold text-white mb-3 border-b border-gray-700 pb-2">
            <i className="fa fa-comment mr-2"></i>
            Remarks
          </h3>
          {isEditing ? (
            <textarea
              value={editData.remarks}
              onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
              className="form-control"
              rows={3}
              style={{
                backgroundColor: '#fff',
                color: '#2d353c',
                border: '1px solid #495057',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '12px',
                width: '100%',
              }}
              placeholder="Add remarks..."
            />
          ) : (
            <p className="text-sm text-gray-300">{residence.remarks}</p>
          )}
        </div>
      )}
    </div>
  );
}






