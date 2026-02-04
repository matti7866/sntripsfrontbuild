import { useState, useEffect, useRef } from 'react';
import residenceService from '../../services/residenceService';
import Swal from 'sweetalert2';
import config from '../../utils/config';
import '../modals/Modal.css';

interface FormData {
  // Step 1: Basic Information
  customer_id: number | null;
  ref: string;
  insideOutside: string;
  res_type: string;
  uid: string;
  salary_amount: number | null;
  position: number | null;
  sale_amount: number | null;
  sale_currency_type: number | null;
  tawjeeh_included: boolean;
  insurance_included: boolean;
  
  // Step 2: Passport Information
  passengerName: string;
  nationality: number | null;
  passportNumber: string;
  passportExpiryDate: string;
  gender: string;
  dob: string;
  
  // Files
  passportFile: File | null;
  photoFile: File | null;
  emiratesIdFrontFile: File | null;
  emiratesIdBackFile: File | null;
}

interface CreateResidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'create' | 'renew';
  oldResidenceId?: number | null;
  initialData?: Partial<FormData> | null;
  lookups: {
    customers: Array<{ customer_id: number; customer_name: string; customer_phone?: string; customer_email?: string }>;
    nationalities: Array<{ nationality_id: number; nationality_name: string }>;
    currencies: Array<{ currencyID: number; currencyName: string }>;
    positions: Array<{ position_id: number; position_name: string }>;
  };
}

const getDefaultFormData = (): FormData => ({
  customer_id: null,
  ref: '',
  insideOutside: '',
  res_type: 'mainland',
  uid: '',
  salary_amount: null,
  position: null,
  sale_amount: null,
  sale_currency_type: null,
  tawjeeh_included: true,
  insurance_included: true,
  passengerName: '',
  nationality: null,
  passportNumber: '',
  passportExpiryDate: '',
  gender: '',
  dob: '',
  passportFile: null,
  photoFile: null,
  emiratesIdFrontFile: null,
  emiratesIdBackFile: null,
});

export default function CreateResidenceModal({
  isOpen,
  onClose,
  onSuccess,
  lookups,
  mode = 'create',
  oldResidenceId = null,
  initialData = null
}: CreateResidenceModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());

  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setCurrentStep(1);
      setFormData({
        ...getDefaultFormData(),
        ...(initialData || {}),
      });
      setCustomerSearch('');
      setOcrStatus('');
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, initialData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };

    if (showCustomerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomerDropdown]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (field: 'passportFile' | 'photoFile' | 'emiratesIdFrontFile' | 'emiratesIdBackFile', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    
    // Trigger OCR for passport
    if (field === 'passportFile' && file) {
      await processPassportOCR(file);
    }
  };

  const processPassportOCR = async (passportFile: File) => {
    setOcrProcessing(true);
    setOcrStatus('Extracting data from passport...');
    
    try {
      const formDataOCR = new FormData();
      formDataOCR.append('passport', passportFile);
      
      const response = await fetch(`${config.apiBaseUrl}/api-ocr-passport.php`, {
        method: 'POST',
        body: formDataOCR
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        const errorMsg = result.message || 'OCR request failed';
        console.error('OCR Error Response:', result);
        throw new Error(errorMsg);
      }
      
      if (result.success && result.data) {
        setOcrStatus('✅ Passport data extracted! Fields auto-filled.');
        
        // Auto-fill form with extracted data
        setFormData(prev => ({
          ...prev,
          ...(result.data.full_name && { passengerName: result.data.full_name }),
          ...(result.data.passport_number && { passportNumber: result.data.passport_number }),
          ...(result.data.gender && { gender: result.data.gender }),
          ...(result.data.dob && { dob: result.data.dob }),
          ...(result.data.expiry_date && { passportExpiryDate: result.data.expiry_date }),
        }));
        
        // Try to match nationality
        if (result.data.nationality && lookups?.nationalities) {
          const extractedNat = (result.data.nationality || '').toLowerCase().trim();
          
          const matchingNationality = lookups.nationalities.find((n: any) => {
            const nName = (n.nationality_name || n.nationality || '').toLowerCase().trim();
            if (!nName) return false;
            
            if (nName === extractedNat) return true;
            if (nName.startsWith(extractedNat) || extractedNat.startsWith(nName)) return true;
            if (nName.includes(extractedNat) || extractedNat.includes(nName)) return true;
            
            const variations: any = {
              'afghan': 'afghanistan',
              'british': 'united kingdom',
              'american': 'united states',
              'indian': 'india',
              'pakistani': 'pakistan',
              'bangladeshi': 'bangladesh',
              'egyptian': 'egypt',
              'filipino': 'philippines',
              'chinese': 'china',
              'japanese': 'japan'
            };
            
            if (variations[extractedNat] && nName.includes(variations[extractedNat])) return true;
            
            return false;
          });
          
          if (matchingNationality) {
            const natId = matchingNationality.nationality_id || matchingNationality.nationalityID;
            setFormData(prev => ({ ...prev, nationality: natId }));
          }
        }
        
        setTimeout(() => setOcrStatus(''), 5000);
      } else {
        throw new Error(result.message || 'OCR failed');
      }
    } catch (error: any) {
      console.error('Passport OCR Error:', error);
      const errorMsg = error.message || 'Auto-extraction failed';
      setOcrStatus(`❌ ${errorMsg}`);
      
      Swal.fire({
        icon: 'warning',
        title: 'Auto-extraction Failed',
        text: errorMsg + '. Please enter passport details manually.',
        timer: 4000,
        showConfirmButton: false
      });
      
      setTimeout(() => setOcrStatus(''), 8000);
    } finally {
      setOcrProcessing(false);
    }
  };

  const validateStep1 = (): boolean => {
    if (!formData.customer_id) {
      Swal.fire('Validation Error', 'Please select a customer', 'error');
      return false;
    }
    if (!formData.ref || !formData.ref.trim()) {
      Swal.fire('Validation Error', 'Reference is required', 'error');
      return false;
    }
    if (!formData.insideOutside) {
      Swal.fire('Validation Error', 'Please select Inside/Outside', 'error');
      return false;
    }
    if (formData.insideOutside === 'Inside' && !formData.uid.trim()) {
      Swal.fire('Validation Error', 'UID is required for Inside passengers', 'error');
      return false;
    }
    if (!formData.salary_amount || formData.salary_amount <= 0) {
      Swal.fire('Validation Error', 'Please enter a valid salary amount', 'error');
      return false;
    }
    if (!formData.sale_amount || formData.sale_amount <= 0) {
      Swal.fire('Validation Error', 'Please enter a valid sale amount', 'error');
      return false;
    }
    if (!formData.sale_currency_type) {
      Swal.fire('Validation Error', 'Please select currency', 'error');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.passportFile) {
      Swal.fire('Validation Error', 'Please upload passport document', 'error');
      return false;
    }
    if (!formData.photoFile) {
      Swal.fire('Validation Error', 'Please upload passport photo', 'error');
      return false;
    }
    if (!formData.passengerName.trim()) {
      Swal.fire('Validation Error', 'Passenger name is required', 'error');
      return false;
    }
    if (!formData.nationality) {
      Swal.fire('Validation Error', 'Please select nationality', 'error');
      return false;
    }
    if (!formData.passportNumber.trim()) {
      Swal.fire('Validation Error', 'Passport number is required', 'error');
      return false;
    }
    if (!formData.passportExpiryDate) {
      Swal.fire('Validation Error', 'Passport expiry date is required', 'error');
      return false;
    }
    if (!formData.gender) {
      Swal.fire('Validation Error', 'Please select gender', 'error');
      return false;
    }
    if (!formData.dob) {
      Swal.fire('Validation Error', 'Date of birth is required', 'error');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const previousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setSaving(true);

    try {
      const submitData: any = {
        customer_id: formData.customer_id,
        ref: formData.ref,
        passengerName: formData.passengerName,
        nationality: formData.nationality,
        passportNumber: formData.passportNumber,
        passportExpiryDate: formData.passportExpiryDate,
        gender: formData.gender,
        dob: formData.dob,
        visaType: 17,
        sale_amount: formData.sale_amount,
        sale_currency_type: formData.sale_currency_type,
        insideOutside: formData.insideOutside,
        uid: formData.uid || null,
        salary_amount: formData.salary_amount,
        position: formData.position || 0,
        res_type: formData.res_type,
        tawjeeh_included: formData.tawjeeh_included ? 1 : 0,
        insurance_included: formData.insurance_included ? 1 : 0,
        passportFile: formData.passportFile,
        photoFile: formData.photoFile,
        emiratesIdFrontFile: formData.emiratesIdFrontFile,
        emiratesIdBackFile: formData.emiratesIdBackFile,
      };

      if (mode === 'renew' && oldResidenceId) {
        submitData.renewType = 'renew';
        submitData.oldResidenceID = oldResidenceId;
      }

      const response = await residenceService.createResidence(submitData);
      
      await Swal.fire({
        title: 'Success!',
        html: `<strong>Residence Created!</strong><br>Residence ID: ${response.data?.residenceID}`,
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'An error occurred while creating residence';
      
      if (errorMsg.includes('DUPLICATE_ACTIVE')) {
        const parts = errorMsg.split('|');
        const existingId = parts[1];
        const existingName = parts[2];
        Swal.fire({
          title: 'Duplicate Record',
          html: `A residence record already exists for this passport:<br><strong>${existingName}</strong> (ID: ${existingId})`,
          icon: 'warning',
          confirmButtonText: 'OK'
        });
      } else {
        Swal.fire('Error', errorMsg, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customerSearch
    ? (lookups?.customers && Array.isArray(lookups.customers) ? lookups.customers.filter((c: any) => 
        c.customer_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.customer_phone?.includes(customerSearch) ||
        c.customer_email?.toLowerCase().includes(customerSearch.toLowerCase())
      ) : [])
    : (lookups?.customers && Array.isArray(lookups.customers) ? lookups.customers : []);

  const getSelectedCustomer = () => {
    if (!formData.customer_id) return null;
    return filteredCustomers && Array.isArray(filteredCustomers)
      ? filteredCustomers.find((c: any) => c.customer_id === formData.customer_id)
      : null;
  };

  const getSelectedCustomerDisplay = () => {
    const customer = getSelectedCustomer();
    if (!customer) return 'Select Customer';
    return customer.customer_phone 
      ? `${customer.customer_name} - ${customer.customer_phone}`
      : customer.customer_name;
  };

  const getSelectedNationality = () => {
    return lookups?.nationalities && Array.isArray(lookups.nationalities)
      ? lookups.nationalities.find((n: any) => n.nationality_id === formData.nationality)
      : null;
  };

  const getSelectedCurrency = () => {
    return lookups?.currencies && Array.isArray(lookups.currencies)
      ? lookups.currencies.find((c: any) => c.currencyID === formData.sale_currency_type)
      : null;
  };

  const getSelectedPosition = () => {
    return lookups?.positions && Array.isArray(lookups.positions)
      ? lookups.positions.find((p: any) => p.position_id === formData.position)
      : null;
  };

  if (!isOpen) return null;

  const progressWidth = (currentStep / 3) * 100;
  const isRenewMode = mode === 'renew';
  const stepTitles = {
    1: 'Step 1: Basic Information',
    2: 'Step 2: Documents & Passport',
    3: 'Step 3: Confirmation'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container" 
        style={{ maxWidth: '1800px', width: '95vw', maxHeight: '95vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ backgroundColor: '#2563eb', borderBottom: '2px solid #1e40af' }}>
          <h3 style={{ color: '#ffffff' }}>
            <i className={`fa ${isRenewMode ? 'fa-refresh' : 'fa-plus-circle'}`}></i>
            {isRenewMode ? 'Renew Residence' : 'Add New Residence'} - {stepTitles[currentStep as keyof typeof stepTitles]}
          </h3>
          <button className="modal-close" onClick={onClose} style={{ color: '#ffffff' }}>
            <i className="fa fa-times"></i>
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '4px', backgroundColor: '#e5e7eb' }}>
          <div
            style={{
              height: '100%',
              width: `${progressWidth}%`,
              backgroundColor: '#2563eb',
              transition: 'width 0.3s ease'
            }}
          ></div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto', padding: '20px' }}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div>
              <div className="alert alert-info mb-3" style={{ fontSize: '13px', padding: '10px 14px' }}>
                <i className="fa fa-info-circle me-2"></i>
                <strong>Step 1:</strong> Fill in the basic customer and financial information.
              </div>

              {/* Customer Selection */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    Customer <span className="text-danger">*</span>
                  </label>
                  <div className="position-relative" ref={customerDropdownRef}>
                    <div
                      className="form-select"
                      onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                      style={{ 
                        cursor: 'pointer', 
                        userSelect: 'none',
                        fontSize: '14px',
                        padding: '10px 14px',
                        height: '42px',
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        lineHeight: '22px'
                      }}
                    >
                      {getSelectedCustomerDisplay()}
                    </div>
                    {showCustomerDropdown && (
                      <div 
                        className="position-absolute w-100 bg-white border rounded mt-1 shadow-lg"
                        style={{ 
                          zIndex: 10010,
                          maxHeight: '300px', 
                          overflow: 'hidden',
                          borderColor: '#d1d5db',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                          top: '100%',
                          left: 0,
                          marginTop: '4px'
                        }}
                      >
                        <div className="p-2 border-bottom" style={{ borderColor: '#e5e7eb' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search customer..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            autoFocus
                            style={{ 
                              backgroundColor: '#ffffff', 
                              color: '#000000',
                              fontSize: '14px',
                              padding: '8px 12px',
                              height: '38px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px'
                            }}
                          />
                        </div>
                        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                          {filteredCustomers && Array.isArray(filteredCustomers) && filteredCustomers.length > 0 ? (
                            filteredCustomers.map((c: any) => (
                              <div
                                key={c.customer_id}
                                className="px-3 py-2 cursor-pointer"
                                style={{
                                  cursor: 'pointer',
                                  backgroundColor: formData.customer_id === c.customer_id ? '#e3f2fd' : 'transparent'
                                }}
                                onClick={() => {
                                  handleChange('customer_id', c.customer_id);
                                  setShowCustomerDropdown(false);
                                  setCustomerSearch('');
                                }}
                                onMouseEnter={(e) => {
                                  if (formData.customer_id !== c.customer_id) {
                                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (formData.customer_id !== c.customer_id) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                <div className="fw-semibold" style={{ color: '#000000' }}>{c.customer_name}</div>
                                {c.customer_phone && (
                                  <div className="text-muted small" style={{ fontSize: '11px' }}>{c.customer_phone}</div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-muted text-center">No customers found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    Reference <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.ref}
                    onChange={(e) => handleChange('ref', e.target.value)}
                    placeholder="Enter Reference"
                    required
                    style={{ fontSize: '14px', padding: '10px 14px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    Inside/Outside <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.insideOutside}
                    onChange={(e) => {
                      handleChange('insideOutside', e.target.value);
                      if (e.target.value !== 'Inside') {
                        handleChange('uid', '');
                      }
                    }}
                    required
                    style={{ fontSize: '14px', padding: '10px 14px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', lineHeight: '22px' }}
                  >
                    <option value="">Choose</option>
                    <option value="Inside">Inside</option>
                    <option value="Outside">Outside</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    Residence Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.res_type}
                    onChange={(e) => handleChange('res_type', e.target.value)}
                    required
                    style={{ fontSize: '14px', padding: '10px 14px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', lineHeight: '22px' }}
                  >
                    <option value="mainland">Mainland</option>
                    <option value="freezone">Freezone</option>
                  </select>
                </div>
              </div>

              {/* Basic Details */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    UID {formData.insideOutside === 'Inside' && <span className="text-danger">*</span>}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.uid}
                    onChange={(e) => handleChange('uid', e.target.value)}
                    placeholder={formData.insideOutside === 'Inside' ? 'Enter UID (Required)' : 'UID (Optional)'}
                    required={formData.insideOutside === 'Inside'}
                    style={{ fontSize: '14px', padding: '10px 14px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    Salary Amount <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.salary_amount || ''}
                    onChange={(e) => handleChange('salary_amount', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="Enter Salary Amount"
                    required
                    min="1"
                    style={{ fontSize: '14px', padding: '10px 14px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>Position</label>
                  <select
                    className="form-select"
                    value={formData.position || ''}
                    onChange={(e) => handleChange('position', e.target.value ? parseInt(e.target.value) : null)}
                    style={{ fontSize: '14px', padding: '10px 14px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', lineHeight: '22px' }}
                  >
                    <option value="">Select Position</option>
                    {lookups?.positions && Array.isArray(lookups.positions) && lookups.positions.map((p: any) => (
                      <option key={p.position_id} value={p.position_id}>
                        {p.position_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    Sale Price <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.sale_amount || ''}
                    onChange={(e) => handleChange('sale_amount', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="Enter Sale Amount"
                    required
                    min="0"
                    step="0.01"
                    style={{ fontSize: '14px', padding: '10px 14px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                </div>
              </div>

              {/* Currency */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    Currency <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.sale_currency_type || ''}
                    onChange={(e) => handleChange('sale_currency_type', e.target.value ? parseInt(e.target.value) : null)}
                    required
                    style={{ fontSize: '14px', padding: '10px 14px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', lineHeight: '22px' }}
                  >
                    <option value="">Select Currency</option>
                    {lookups?.currencies && Array.isArray(lookups.currencies) && lookups.currencies.map((c: any) => (
                      <option key={c.currencyID} value={c.currencyID}>
                        {c.currencyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-8">
                  <div className="alert alert-info mb-0" style={{ fontSize: '12px', padding: '8px 12px' }}>
                    <i className="fa fa-info-circle me-2"></i>
                    <strong>Note:</strong> TAWJEEH Service (150 AED) and ILOE Insurance (126 AED) are automatically included in all residence sale prices.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Documents & Passport Information */}
          {currentStep === 2 && (
            <div>
              <div className="alert alert-info mb-3" style={{ fontSize: '13px', padding: '10px 14px' }}>
                <i className="fa fa-passport me-2"></i>
                <strong>Step 2:</strong> Upload passport document for automatic data extraction, plus photo and Emirates ID.
              </div>
              {isRenewMode && (
                <div className="alert alert-warning mb-3" style={{ fontSize: '13px', padding: '10px 14px' }}>
                  <i className="fa fa-info-circle me-2"></i>
                  Renewal mode: old data is prefilled. Passport and photo are still required before continuing.
                </div>
              )}

              {/* OCR Status Banner */}
              {(ocrProcessing || ocrStatus) && (
                <div className={`alert mb-3 ${ocrProcessing ? 'alert-info' : ocrStatus.includes('✅') ? 'alert-success' : 'alert-warning'}`} style={{ fontSize: '13px', padding: '10px 14px' }}>
                  {ocrProcessing ? (
                    <><i className="fa fa-spinner fa-spin me-2"></i>{ocrStatus}</>
                  ) : (
                    <>{ocrStatus}</>
                  )}
                </div>
              )}

              {/* Passport Information */}
              <div className="row mb-3">
                <div className="col-12 mb-2">
                  <h6 className="text-primary mb-2" style={{ fontSize: '14px' }}>
                    <i className="fa fa-passport"></i> Passport Information
                    <small className="text-muted ms-2" style={{ fontSize: '11px' }}>(Auto-filled from document or enter manually)</small>
                  </h6>
                </div>
                <div className="col-lg-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    Passenger Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    value={formData.passengerName}
                    onChange={(e) => handleChange('passengerName', e.target.value)}
                    placeholder="Enter or auto-filled from passport"
                    required
                    style={{ fontSize: '14px', padding: '10px 14px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                </div>
                <div className="col-lg-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    Nationality <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.nationality || ''}
                    onChange={(e) => handleChange('nationality', e.target.value ? parseInt(e.target.value) : null)}
                    required
                    style={{ fontSize: '14px', padding: '10px 14px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', lineHeight: '22px' }}
                  >
                    <option value="">Select Nationality</option>
                    {lookups?.nationalities && Array.isArray(lookups.nationalities) && lookups.nationalities.map((n: any) => (
                      <option key={n.nationality_id} value={n.nationality_id}>
                        {n.nationality_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    Passport # <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.passportNumber}
                    onChange={(e) => handleChange('passportNumber', e.target.value)}
                    placeholder="Enter passport number"
                    required
                    style={{ fontSize: '14px', padding: '10px 14px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    Passport Expiry <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.passportExpiryDate}
                    onChange={(e) => handleChange('passportExpiryDate', e.target.value)}
                    required
                    style={{ fontSize: '14px', padding: '10px 14px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    Gender <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    required
                    style={{ fontSize: '14px', padding: '10px 14px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', lineHeight: '22px' }}
                  >
                    <option value="">Choose gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    Date of Birth <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.dob}
                    onChange={(e) => handleChange('dob', e.target.value)}
                    required
                    style={{ fontSize: '14px', padding: '10px 14px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div className="row mb-3">
                <div className="col-lg-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    <i className="fa fa-passport me-2"></i>
                    Passport <span className="text-danger">*</span>
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={(e) => handleFileChange('passportFile', e.target.files?.[0] || null)}
                    required
                    disabled={ocrProcessing}
                    style={{ fontSize: '14px', padding: '8px 12px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                  <small className="text-muted" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    {ocrProcessing ? (
                      <><i className="fa fa-spinner fa-spin me-1"></i>Processing...</>
                    ) : (
                      <>JPG, PNG, or PDF - Auto-extracts data</>
                    )}
                  </small>
                </div>

                <div className="col-lg-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>
                    Photo <span className="text-danger">*</span>
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png"
                    onChange={(e) => handleFileChange('photoFile', e.target.files?.[0] || null)}
                    required
                    style={{ fontSize: '14px', padding: '8px 12px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                  <small className="text-muted" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>Upload passport photo</small>
                </div>

                <div className="col-lg-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>Emirates ID Front</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => handleFileChange('emiratesIdFrontFile', e.target.files?.[0] || null)}
                    style={{ fontSize: '14px', padding: '8px 12px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                  <small className="text-muted" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>Optional</small>
                </div>

                <div className="col-lg-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#000000', display: 'block' }}>Emirates ID Back</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => handleFileChange('emiratesIdBackFile', e.target.files?.[0] || null)}
                    style={{ fontSize: '14px', padding: '8px 12px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                  <small className="text-muted" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>Optional</small>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div>
              <div className="alert alert-success mb-3" style={{ fontSize: '13px' }}>
                <i className="fa fa-check-circle me-2"></i>
                <strong>Step 3:</strong> Review all information before {isRenewMode ? 'renewing' : 'creating'} the residence.
              </div>

              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-primary mb-2" style={{ fontSize: '14px' }}>Basic Information</h6>
                  <div className="card mb-3">
                    <div className="card-body" style={{ padding: '12px', fontSize: '13px' }}>
                      <p className="mb-1"><strong>Customer:</strong> {getSelectedCustomer()?.customer_name || 'N/A'}</p>
                      <p className="mb-1"><strong>Reference:</strong> {formData.ref}</p>
                      <p className="mb-1"><strong>Inside/Outside:</strong> {formData.insideOutside}</p>
                      <p className="mb-1"><strong>Residence Type:</strong> {formData.res_type}</p>
                      <p className="mb-1"><strong>UID:</strong> {formData.uid || 'N/A'}</p>
                      <p className="mb-1"><strong>Salary Amount:</strong> {formData.salary_amount?.toLocaleString() || 'N/A'}</p>
                      <p className="mb-1"><strong>Position:</strong> {getSelectedPosition()?.position_name || 'N/A'}</p>
                      <p className="mb-0"><strong>Sale Price:</strong> {formData.sale_amount?.toLocaleString() || 'N/A'} {getSelectedCurrency()?.currencyName || ''}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="text-primary mb-2" style={{ fontSize: '14px' }}>Passport Information</h6>
                  <div className="card mb-3">
                    <div className="card-body" style={{ padding: '12px', fontSize: '13px' }}>
                      <p className="mb-1"><strong>Passenger Name:</strong> {formData.passengerName || 'N/A'}</p>
                      <p className="mb-1"><strong>Nationality:</strong> {getSelectedNationality()?.nationality_name || 'N/A'}</p>
                      <p className="mb-1"><strong>Passport Number:</strong> {formData.passportNumber || 'N/A'}</p>
                      <p className="mb-1"><strong>Passport Expiry:</strong> {formData.passportExpiryDate || 'N/A'}</p>
                      <p className="mb-1"><strong>Gender:</strong> {formData.gender || 'N/A'}</p>
                      <p className="mb-0"><strong>Date of Birth:</strong> {formData.dob || 'N/A'}</p>
                    </div>
                  </div>
                  <h6 className="text-primary mb-2" style={{ fontSize: '14px' }}>Uploaded Documents</h6>
                  <div className="card">
                    <div className="card-body" style={{ padding: '12px', fontSize: '13px' }}>
                      <p className="mb-1"><strong>Passport:</strong> {formData.passportFile?.name || 'Not uploaded'}</p>
                      <p className="mb-1"><strong>Photo:</strong> {formData.photoFile?.name || 'Not uploaded'}</p>
                      <p className="mb-1"><strong>Emirates ID Front:</strong> {formData.emiratesIdFrontFile?.name || 'Not uploaded'}</p>
                      <p className="mb-0"><strong>Emirates ID Back:</strong> {formData.emiratesIdBackFile?.name || 'Not uploaded'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '12px 20px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          {currentStep > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={previousStep}
              disabled={saving}
            >
              <i className="fa fa-arrow-left me-2"></i>Previous
            </button>
          )}
          {currentStep < 3 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={nextStep}
            >
              Next <i className="fa fa-arrow-right ms-2"></i>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  {isRenewMode ? 'Renewing...' : 'Creating...'}
                </>
              ) : (
                <>
                  <i className={`fa ${isRenewMode ? 'fa-refresh' : 'fa-save'} me-2`}></i>
                  {isRenewMode ? 'Renew Residence' : 'Create Residence'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
