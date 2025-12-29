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
  onResidenceUpdate?: (updatedResidence: Partial<Residence>) => void;
}

export default function ResidenceInfo({ residence, onUpdate, onResidenceUpdate }: ResidenceInfoProps) {
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
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Sync editData when residence prop changes (only when not editing)
  useEffect(() => {
    if (!isEditing) {
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
  }, [residence, isEditing]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      console.log('Loading ALL customers for dropdown (fetching multiple pages)...');
      
      let allCustomers: any[] = [];
      let currentPage = 1;
      let hasMore = true;
      const perPage = 100; // Backend limit
      
      // Fetch all pages
      while (hasMore) {
        console.log(`Fetching page ${currentPage}...`);
        const response = await customerService.getCustomers({ page: currentPage, per_page: perPage });
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          allCustomers = [...allCustomers, ...response.data];
          console.log(`Page ${currentPage}: Got ${response.data.length} customers. Total so far: ${allCustomers.length}`);
          
          // Check if there are more pages
          if (response.data.length < perPage) {
            // Last page - got fewer than requested
            hasMore = false;
          } else {
            currentPage++;
          }
          
          // Safety limit to prevent infinite loop
          if (currentPage > 10) {
            console.warn('Reached safety limit of 10 pages (1000 customers max)');
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      
      console.log('✓ Successfully loaded ALL customers:', allCustomers.length);
      console.log('Sample customer fields:', allCustomers[0] ? Object.keys(allCustomers[0]) : 'No customers');
      setCustomers(allCustomers);
      
      if (allCustomers.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Customers Found',
          text: 'The system returned 0 customers. This might be a database or API issue.',
          confirmButtonText: 'OK'
        });
      }
    } catch (error: any) {
      console.error('❌ Error loading customers:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      console.error('Error data:', error.response?.data);
      setCustomers([]);
      
      // Show user-friendly error
      await Swal.fire({
        icon: 'error',
        title: 'Customer Dropdown Failed',
        text: error.response?.data?.message || error.message || 'Failed to load customers. Please refresh the page.',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoadingCustomers(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB');
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

  const formatCurrency = (amount?: number, symbol: string = 'AED') => {
    if (!amount) return '-';
    return `${symbol} ${amount.toLocaleString()}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('💾 Saving residence information...');
      console.log('Residence ID:', residence.residenceID);
      console.log('Current residence customer_id:', residence.customer_id);
      console.log('Edit data:', editData);
      console.log('Customer ID change:', { 
        old: residence.customer_id, 
        new: editData.customer_id,
        changed: residence.customer_id !== editData.customer_id,
        oldType: typeof residence.customer_id,
        newType: typeof editData.customer_id
      });
      
      // Prepare data for API - ALWAYS include customer_id if it's defined (even if null)
      const dataToSend: any = {};
      
      // CRITICAL: Always send customer_id if it's defined, even if null
      // This ensures the backend knows we want to update/reassign the customer
      if (editData.customer_id !== undefined) {
        // Convert to proper number or null
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
      console.log('📤 Customer ID type:', typeof dataToSend.customer_id);
      
      // If customer_id changed, get the customer name from the customers list for reference
      let selectedCustomer = null;
      if (editData.customer_id && editData.customer_id !== residence.customer_id) {
        selectedCustomer = customers.find(c => 
          (c.customer_id || c.id) === editData.customer_id
        );
        console.log('👤 Selected customer for update:', selectedCustomer);
        console.log('👤 Expected customer name:', selectedCustomer?.customer_name || selectedCustomer?.name);
        console.log('👤 Expected customer phone:', selectedCustomer?.customer_phone || selectedCustomer?.phone);
      }
      
      const response = await residenceService.updateResidence(residence.residenceID, dataToSend);
      console.log('✅ Save response:', response);
      console.log('✅ Response success:', response?.success);
      console.log('✅ Response message:', response?.message);
      console.log('✅ Response data:', response?.data);
      
      // Verify the response indicates success
      if (!response?.success && response?.success !== undefined) {
        console.error('❌ API returned success: false');
        throw new Error(response?.message || 'Update failed');
      }
      
      // Call onUpdate to refresh the data from server
      if (onUpdate) {
        console.log('🔄 Calling onUpdate to refresh data...');
        // Add a longer delay to ensure backend has processed the update and database is consistent
        await new Promise(resolve => setTimeout(resolve, 1000));
        await onUpdate();
        console.log('✅ onUpdate completed');
        
        // Wait a bit more and verify the update
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('🔍 Verification: Checking if customer was updated...');
        
        // Fallback: If customer_id changed but customer_name is still missing, enrich from local customers list
        if (editData.customer_id && editData.customer_id !== residence.customer_id && selectedCustomer) {
          console.log('🔧 Fallback: Enriching residence data with customer info from local list...');
          if (onResidenceUpdate && selectedCustomer) {
            onResidenceUpdate({
              customer_id: editData.customer_id,
              customer_name: selectedCustomer.customer_name || selectedCustomer.name || '',
              customer_phone: selectedCustomer.customer_phone || selectedCustomer.phone || '',
              customer_email: selectedCustomer.customer_email || selectedCustomer.email || '',
            });
            console.log('✅ Residence data enriched with customer info:', {
              customer_id: editData.customer_id,
              customer_name: selectedCustomer.customer_name || selectedCustomer.name,
            });
          }
        }
      } else {
        console.warn('⚠️ onUpdate callback is not defined!');
      }
      
      setIsEditing(false);
      
      // Show success message AFTER data is refreshed
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Residence information updated successfully',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error('❌ Save failed:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
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
    <div className="space-y-4" style={{ overflow: 'visible' }}>
      {/* Header with Edit/Save/Cancel buttons */}
      <div className="card p-4" style={{ backgroundColor: '#2d353c', border: '1px solid #495057' }}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            <i className="fa fa-info-circle mr-2"></i>
            Basic Information
          </h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm rounded font-semibold"
              style={{
                background: 'linear-gradient(to right, #dc2626, #991b1b)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              <i className="fa fa-edit mr-2"></i> Edit All Information
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm rounded font-semibold"
                style={{
                  background: 'linear-gradient(to right, #16a34a, #15803d)',
                  color: 'white',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => !saving && (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => !saving && (e.currentTarget.style.opacity = '1')}
              >
                <i className="fa fa-save mr-2"></i> {saving ? 'Saving...' : 'Save All Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 text-sm rounded font-semibold"
                style={{
                  background: 'linear-gradient(to right, #6b7280, #4b5563)',
                  color: 'white',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => !saving && (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => !saving && (e.currentTarget.style.opacity = '1')}
              >
                <i className="fa fa-times mr-2"></i> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customer Information */}
      <div className="card p-4" style={{ backgroundColor: '#2d353c', border: '1px solid #495057', overflow: 'visible', position: 'relative', zIndex: 10 }}>
        <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
          <h3 className="text-lg font-bold text-white">
            <i className="fa fa-user mr-2"></i>
            Customer Information
          </h3>
        </div>
        {isEditing ? (
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
              {(() => {
                const customerOptions = [
                  { value: '', label: loadingCustomers ? 'Loading customers...' : '-- Select Customer --' },
                  ...(Array.isArray(customers) ? customers : []).map(c => ({
                    value: String(c.customer_id || c.id || ''),
                    label: `${c.customer_name || c.name || 'Unknown'} - ${c.customer_phone || c.phone || 'No phone'}`
                  }))
                ];
                console.log('SearchableSelect options count:', customerOptions.length);
                console.log('First 3 options:', customerOptions.slice(0, 3));
                console.log('Current value:', editData.customer_id);
                
                return (
                  <SearchableSelect
                    options={customerOptions}
                    value={editData.customer_id ? String(editData.customer_id) : ''}
                    onChange={(value) => {
                      console.log('Customer selected:', value, 'Type:', typeof value);
                      // Handle empty string or falsy values as null
                      const customerId = (value && value !== '' && value !== '0') 
                        ? Number(value) 
                        : null;
                      console.log('Setting customer_id to:', customerId);
                      setEditData({ ...editData, customer_id: customerId });
                    }}
                    placeholder="Search customer..."
                    disabled={loadingCustomers}
                  />
                );
              })()}
              <small className="text-muted d-block mt-1">
                <i className="fa fa-info-circle me-1"></i>
                {loadingCustomers ? (
                  'Loading customer list...'
                ) : customers.length === 0 ? (
                  <span className="text-warning">No customers loaded. Please refresh or contact support.</span>
                ) : (
                  `${customers.length} customers available. Select to reassign this residence.`
                )}
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






