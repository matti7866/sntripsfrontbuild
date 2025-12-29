import { useState, useEffect } from 'react';
import type { Residence } from '../../types/residence';
import residenceService from '../../services/residenceService';
import { customerService } from '../../services/customerService';
import SearchableSelect from '../form/SearchableSelect';
import Swal from 'sweetalert2';
import '../modals/Modal.css';

interface EditResidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  residence: Residence | null;
  onSuccess: () => void;
}

export default function EditResidenceModal({ 
  isOpen, 
  onClose, 
  residence, 
  onSuccess 
}: EditResidenceModalProps) {
  const [editData, setEditData] = useState({
    customer_id: null as number | null,
    passenger_name: '',
    passportNumber: '',
    passportExpiryDate: '',
    gender: '',
    dob: '',
    uid: '',
    sale_price: 0,
    tawjeehIncluded: 0,
    tawjeeh_amount: 150,
    insuranceIncluded: 0,
    insuranceAmount: 126,
    remarks: '',
    salary_amount: 0,
  });
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Initialize editData when residence changes
  useEffect(() => {
    if (residence && isOpen) {
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
    }
  }, [residence, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      let allCustomers: any[] = [];
      let currentPage = 1;
      let hasMore = true;
      const perPage = 100;
      
      while (hasMore) {
        const response = await customerService.getCustomers({ page: currentPage, per_page: perPage });
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          allCustomers = [...allCustomers, ...response.data];
          
          if (response.data.length < perPage) {
            hasMore = false;
          } else {
            currentPage++;
          }
          
          if (currentPage > 10) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      
      setCustomers(allCustomers);
    } catch (error: any) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const handleSave = async () => {
    if (!residence) return;
    
    setSaving(true);
    try {
      console.log('💾 EditResidenceModal - Starting save...');
      console.log('📋 Original residence customer_id:', residence.customer_id);
      console.log('📋 Edit data customer_id:', editData.customer_id);
      console.log('📋 Customer changed:', residence.customer_id !== editData.customer_id);
      
      const dataToSend: any = {};
      
      // CRITICAL: Always send customer_id if it's defined, even if it's the same
      // This ensures the backend knows we want to update/reassign the customer
      if (editData.customer_id !== undefined) {
        const customerIdValue = editData.customer_id === null || editData.customer_id === 0 || editData.customer_id === '' 
          ? null 
          : Number(editData.customer_id);
        dataToSend.customer_id = customerIdValue;
        console.log('✅ customer_id will be sent:', customerIdValue, 'Type:', typeof customerIdValue);
      } else {
        console.warn('⚠️ customer_id is undefined in editData!');
      }
      
      // Include all other fields
      if (editData.passenger_name !== undefined) dataToSend.passenger_name = editData.passenger_name;
      if (editData.passportNumber !== undefined) dataToSend.passportNumber = editData.passportNumber;
      if (editData.passportExpiryDate !== undefined) dataToSend.passportExpiryDate = editData.passportExpiryDate;
      if (editData.gender !== undefined) dataToSend.gender = editData.gender;
      if (editData.dob !== undefined) dataToSend.dob = editData.dob;
      if (editData.uid !== undefined) dataToSend.uid = editData.uid;
      if (editData.sale_price !== undefined) dataToSend.sale_price = editData.sale_price;
      if (editData.tawjeehIncluded !== undefined) dataToSend.tawjeehIncluded = editData.tawjeehIncluded;
      if (editData.tawjeeh_amount !== undefined) dataToSend.tawjeeh_amount = editData.tawjeeh_amount;
      if (editData.insuranceIncluded !== undefined) dataToSend.insuranceIncluded = editData.insuranceIncluded;
      if (editData.insuranceAmount !== undefined) dataToSend.insuranceAmount = editData.insuranceAmount;
      if (editData.remarks !== undefined) dataToSend.remarks = editData.remarks;
      if (editData.salary_amount !== undefined) dataToSend.salary_amount = editData.salary_amount;
      
      console.log('📤 Complete data being sent to API:', JSON.stringify(dataToSend, null, 2));
      console.log('📤 Customer ID in payload:', dataToSend.customer_id);
      
      const response = await residenceService.updateResidence(residence.residenceID, dataToSend);
      
      console.log('✅ Save response:', response);
      console.log('✅ Response success:', response?.success);
      console.log('✅ Response message:', response?.message);
      
      // Verify the response indicates success
      if (!response?.success && response?.success !== undefined) {
        console.error('❌ API returned success: false');
        throw new Error(response?.message || 'Update failed');
      }
      
      // Wait longer to ensure backend has processed the update
      console.log('🔄 Waiting for backend to process update...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify the update was saved by fetching the residence again
      if (dataToSend.customer_id !== undefined) {
        console.log('🔍 Verifying customer_id was saved...');
        try {
          const verifyResidence = await residenceService.getResidence(residence.residenceID, true);
          console.log('🔍 Verified residence customer_id:', verifyResidence.customer_id);
          console.log('🔍 Expected customer_id:', dataToSend.customer_id);
          console.log('🔍 Match:', verifyResidence.customer_id === dataToSend.customer_id);
          
          if (verifyResidence.customer_id !== dataToSend.customer_id) {
            console.error('❌ WARNING: Customer ID mismatch! Backend did not save the change.');
            console.error('Expected:', dataToSend.customer_id, 'Got:', verifyResidence.customer_id);
          } else {
            console.log('✅ Customer ID verified - change was saved correctly');
          }
        } catch (verifyError) {
          console.error('❌ Error verifying residence update:', verifyError);
        }
      }
      
      // Call onSuccess to refresh the data
      console.log('🔄 Calling onSuccess to refresh data...');
      onSuccess();
      
      // Wait a bit more to ensure refresh completed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Residence information updated successfully',
        timer: 2000,
        showConfirmButton: false,
      });
      
      onClose();
    } catch (error: any) {
      console.error('❌ Save failed:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message || 'Failed to update residence information',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (residence) {
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
    }
    onClose();
  };

  if (!isOpen || !residence) return null;

  const customerOptions = [
    { value: '', label: loadingCustomers ? 'Loading customers...' : '-- Select Customer --' },
    ...customers.map(c => ({
      value: String(c.customer_id || c.id || ''),
      label: `${c.customer_name || c.name || 'Unknown'} - ${c.customer_phone || c.phone || 'No phone'}`
    }))
  ];

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Modal Header */}
        <div className="modal-header" style={{ backgroundColor: '#2d353c', color: 'white', borderBottom: '1px solid #495057' }}>
          <h2 className="modal-title">
            <i className="fa fa-edit me-2"></i>
            Edit Residence Information - #{residence.residenceID}
          </h2>
          <button className="modal-close" onClick={handleCancel}>
            <i className="fa fa-times"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ backgroundColor: '#1e2329', padding: '20px', maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
          <div className="space-y-4">
            {/* Customer Information */}
            <div className="card p-4" style={{ backgroundColor: '#2d353c', border: '1px solid #495057', overflow: 'visible', position: 'relative', zIndex: 10 }}>
              <h3 className="text-lg font-bold text-white mb-3 border-b border-gray-700 pb-2">
                <i className="fa fa-user mr-2"></i>
                Customer Information
              </h3>
              <div className="space-y-3" style={{ overflow: 'visible' }}>
                <div style={{ overflow: 'visible', position: 'relative', zIndex: 100001 }}>
                  <label className="text-gray-400 text-sm block mb-1">
                    Select Customer:
                    {loadingCustomers && (
                      <span className="ms-2">
                        <i className="fa fa-spinner fa-spin"></i> Loading...
                      </span>
                    )}
                  </label>
                  <SearchableSelect
                    options={customerOptions}
                    value={editData.customer_id ? String(editData.customer_id) : ''}
                    onChange={(value) => {
                      const customerId = (value && value !== '' && value !== '0') 
                        ? Number(value) 
                        : null;
                      setEditData({ ...editData, customer_id: customerId });
                    }}
                    placeholder="Search customer..."
                    disabled={loadingCustomers}
                  />
                </div>
              </div>
            </div>

            {/* Passenger Information */}
            <div className="card p-4" style={{ backgroundColor: '#2d353c', border: '1px solid #495057' }}>
              <h3 className="text-lg font-bold text-white mb-3 border-b border-gray-700 pb-2">
                <i className="fa fa-passport mr-2"></i>
                Passenger Information
              </h3>
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
                    value={formatDateForInput(editData.passportExpiryDate)}
                    onChange={(e) => setEditData({ ...editData, passportExpiryDate: e.target.value || '' })}
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
                    value={formatDateForInput(editData.dob)}
                    onChange={(e) => setEditData({ ...editData, dob: e.target.value || '' })}
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
            </div>

            {/* Financial Summary */}
            <div className="card p-4" style={{ backgroundColor: '#2d353c', border: '1px solid #495057' }}>
              <h3 className="text-lg font-bold text-white mb-3 border-b border-gray-700 pb-2">
                <i className="fa fa-money-bill mr-2"></i>
                Financial Summary
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Sale Price:</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editData.sale_price}
                    onChange={(e) => setEditData({ ...editData, sale_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Salary Amount:</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editData.salary_amount}
                    onChange={(e) => setEditData({ ...editData, salary_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">TAWJEEH Included:</label>
                  <select
                    className="form-control"
                    value={editData.tawjeehIncluded}
                    onChange={(e) => setEditData({ ...editData, tawjeehIncluded: parseInt(e.target.value) })}
                  >
                    <option value={1}>Yes (Included)</option>
                    <option value={0}>No (Separate charge)</option>
                  </select>
                </div>
                {editData.tawjeehIncluded === 0 && (
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">TAWJEEH Amount:</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editData.tawjeeh_amount}
                      onChange={(e) => setEditData({ ...editData, tawjeeh_amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Insurance Included:</label>
                  <select
                    className="form-control"
                    value={editData.insuranceIncluded}
                    onChange={(e) => setEditData({ ...editData, insuranceIncluded: parseInt(e.target.value) })}
                  >
                    <option value={1}>Yes (Included)</option>
                    <option value={0}>No (Separate charge)</option>
                  </select>
                </div>
                {editData.insuranceIncluded === 0 && (
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Insurance Amount:</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editData.insuranceAmount}
                      onChange={(e) => setEditData({ ...editData, insuranceAmount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Remarks:</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editData.remarks}
                    onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
                    placeholder="Add remarks..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ backgroundColor: '#2d353c', borderTop: '1px solid #495057', padding: '15px 20px' }}>
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              <i className="fa fa-times me-2"></i> Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'linear-gradient(to right, #16a34a, #15803d)',
                border: 'none',
              }}
            >
              <i className="fa fa-save me-2"></i> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

