import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import residenceService from '../../../services/residenceService';
import SearchableSelect from '../../common/SearchableSelect';
import '../../modals/Modal.css';

// Declare pdfjs as global (loaded from CDN in index.html)
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface OfferLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  residenceId: number | null;
  onSuccess: () => void;
  companies: Array<{ company_id: number; company_name: string; starting_quota: number; totalEmployees: number }>;
  currencies: Array<{ currencyID: number; currencyName: string }>;
  accounts: Array<{ account_ID: number; account_Name: string }>;
  creditCards: Array<{ account_ID: number; account_Name: string; card_holder_name?: string; bank_name?: string; accountNum?: string; display_name?: string }>;
  suppliers: Array<{ supp_id: number; supp_name: string }>;
}

export default function OfferLetterModal({
  isOpen,
  onClose,
  residenceId,
  onSuccess,
  companies,
  currencies,
  accounts,
  creditCards,
  suppliers
}: OfferLetterModalProps) {
  const [formData, setFormData] = useState({
    company_id: '',
    mbNumber: '',
    offerLetterCost: '50',
    offerLetterCurrency: '',
    offerLetterChargeOn: '1',
    offerLetterChargeAccount: '',
    offerLetterChargeSupplier: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && residenceId) {
      // Reset form
      setFormData({
        company_id: '',
        mbNumber: '',
        offerLetterCost: '50',
        offerLetterCurrency: currencies.length > 0 ? currencies[0].currencyID.toString() : '',
        offerLetterChargeOn: '1',
        offerLetterChargeAccount: '',
        offerLetterChargeSupplier: ''
      });
      setSelectedFile(null);
      setErrors({});
    }
  }, [isOpen, residenceId, currencies]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      console.log('File selected:', file.name, file.type);
      
      // Parse PDF to extract MB number and company name
      if (file.type === 'application/pdf') {
        try {
          console.log('Starting PDF parsing...');
          
          const pdfText = await extractTextFromPDF(file);
          console.log('Extracted PDF text length:', pdfText.length);
          console.log('First 500 chars:', pdfText.substring(0, 500));
          
          await autoFillFromPDF(pdfText);
          
        } catch (error: any) {
          console.error('Error parsing PDF - FULL ERROR:', error);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
          Swal.fire('Error', `PDF parsing failed: ${error.message}. Please enter manually.`, 'error');
        }
      }
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // Use global pdfjsLib from CDN (loaded in index.html)
    if (!window.pdfjsLib) {
      throw new Error('PDF.js library not loaded');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => item.str).join(' ');
    
    console.log('Extracted text:', text);
    return text;
  };

  const autoFillFromPDF = async (pdfText: string) => {
    console.log('PDF Text extracted:', pdfText.substring(0, 500));
    
    // Extract Transaction Number for MB Number (exact match from working PHP code)
    const transactionNumberMatch = pdfText.match(/Transaction Number\s*[:\-]?\s*([A-Za-z0-9]+)/i);
    if (transactionNumberMatch && transactionNumberMatch[1]) {
      const mbNumber = transactionNumberMatch[1];
      console.log('MB Number found:', mbNumber);
      setFormData(prev => ({ ...prev, mbNumber }));
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `✓ MB Number: ${mbNumber}`,
        showConfirmButton: false,
        timer: 2000
      });
    } else {
      console.log('Transaction Number not found in PDF');
    }

    // Extract Establishment Name (include & and stop before "Establishment No")
    const establishmentMatch = pdfText.match(/Establishment Name\s*([A-Za-z\s&]+)/i);
    if (establishmentMatch && establishmentMatch[1]) {
      let establishmentName = establishmentMatch[1].trim();
      
      // Remove "Establishment No" and anything following it
      const noIndex = establishmentName.toLowerCase().indexOf('establishment no');
      if (noIndex !== -1) {
        establishmentName = establishmentName.substring(0, noIndex).trim();
      }
      
      const normalizedName = establishmentName.toUpperCase();
      console.log('Extracted Establishment Name:', normalizedName);
      
      // Find matching company in the list (exact match on normalized name)
      const matchedCompany = companies.find(company => {
        const companyNameOnly = company.company_name.split(' (')[0].toUpperCase();
        return companyNameOnly === normalizedName;
      });
      
      if (matchedCompany) {
        console.log('Matched company:', matchedCompany.company_name);
        setFormData(prev => ({ ...prev, company_id: String(matchedCompany.company_id) }));
        
        setTimeout(() => {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `✓ Company: ${matchedCompany.company_name}`,
            showConfirmButton: false,
            timer: 2000
          });
        }, 500);
      } else {
        console.log('Establishment not found in options:', normalizedName);
        console.log('Available companies:', companies.map(c => c.company_name.split(' (')[0].toUpperCase()));
      }
    } else {
      console.log('Establishment Name not found in PDF');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residenceId) return;

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.company_id) newErrors.company_id = 'Establishment is required';
    if (!formData.mbNumber) newErrors.mbNumber = 'MB Number is required';
    if (!formData.offerLetterCost) newErrors.offerLetterCost = 'Offer Letter Cost is required';
    if (!formData.offerLetterCurrency) newErrors.offerLetterCurrency = 'Currency is required';
    if (!formData.offerLetterChargeOn) newErrors.offerLetterChargeOn = 'Charge On is required';
    if (formData.offerLetterChargeOn === '1' && !formData.offerLetterChargeAccount) {
      newErrors.offerLetterChargeAccount = 'Charge Account is required';
    }
    if (formData.offerLetterChargeOn === '2' && !formData.offerLetterChargeSupplier) {
      newErrors.offerLetterChargeSupplier = 'Charge Supplier is required';
    }
    if (formData.offerLetterChargeOn === '3' && !formData.offerLetterChargeAccount) {
      newErrors.offerLetterChargeAccount = 'Credit Card is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await residenceService.updateStep(residenceId, {
        step: 1,
        markComplete: true,
        company: formData.company_id,
        mb_number: formData.mbNumber,
        offerLetterCost: formData.offerLetterCost,
        offerLetterCostCur: formData.offerLetterCurrency,
        offerLChargOpt: formData.offerLetterChargeOn,
        offerLChargedEntity: (formData.offerLetterChargeOn === '1' || formData.offerLetterChargeOn === '3') ? formData.offerLetterChargeAccount : formData.offerLetterChargeSupplier,
        files: selectedFile ? { offerLetterFile: selectedFile } : {}
      });

      Swal.fire('Success', 'Offer letter set successfully', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to set offer letter';
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', background: '#fff', color: '#222' }}>
        <div className="modal-header">
          <h3><i className="fa fa-envelope"></i> Offer Letter</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fa fa-times"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ background: '#fff', padding: '2rem', border: '2px solid #d32f2f', borderRadius: '8px' }}>
            <div className="row">
              <div className="col-md-12 mb-3">
                <label className="form-label">Establishment <span className="text-danger">*</span></label>
                <SearchableSelect
                  options={[
                    { value: '', label: 'Select Establishment' },
                    ...companies.map((company) => ({
                      value: String(company.company_id),
                      label: `${company.company_name} (${(company.starting_quota || 0) - (company.totalEmployees || 0)})`
                    }))
                  ]}
                  value={formData.company_id}
                  onChange={(value) => handleChange({ target: { name: 'company_id', value: String(value) } } as any)}
                  placeholder="Select Establishment"
                  className={errors.company_id ? 'is-invalid' : ''}
                />
                {errors.company_id && <div className="invalid-feedback d-block">{errors.company_id}</div>}
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">MB Number <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="mbNumber"
                  className={`form-control ${errors.mbNumber ? 'is-invalid' : ''}`}
                  value={formData.mbNumber}
                  onChange={handleChange}
                  placeholder="MBXXXXXXAE"
                />
                {errors.mbNumber && <div className="invalid-feedback">{errors.mbNumber}</div>}
              </div>
              <div className="col-md-8 mb-3">
                <label className="form-label">Offer Letter File</label>
                <input
                  type="file"
                  name="offerLetterFile"
                  className="form-control"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Offer Letter Cost <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="offerLetterCost"
                  className={`form-control ${errors.offerLetterCost ? 'is-invalid' : ''}`}
                  value={formData.offerLetterCost}
                  onChange={handleChange}
                />
                {errors.offerLetterCost && <div className="invalid-feedback">{errors.offerLetterCost}</div>}
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Currency <span className="text-danger">*</span></label>
                <select
                  name="offerLetterCurrency"
                  className={`form-select ${errors.offerLetterCurrency ? 'is-invalid' : ''}`}
                  value={formData.offerLetterCurrency}
                  onChange={handleChange}
                >
                  <option value="">Select Currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.currencyID} value={currency.currencyID}>
                      {currency.currencyName}
                    </option>
                  ))}
                </select>
                {errors.offerLetterCurrency && <div className="invalid-feedback">{errors.offerLetterCurrency}</div>}
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Charge On <span className="text-danger">*</span></label>
                <select
                  name="offerLetterChargeOn"
                  className={`form-select ${errors.offerLetterChargeOn ? 'is-invalid' : ''}`}
                  value={formData.offerLetterChargeOn}
                  onChange={handleChange}
                >
                  <option value="1">Account</option>
                  <option value="2">Supplier</option>
                  <option value="3">Credit Card</option>
                </select>
                {errors.offerLetterChargeOn && <div className="invalid-feedback">{errors.offerLetterChargeOn}</div>}
              </div>
              {formData.offerLetterChargeOn === '1' && (
                <div className="col-md-12 mb-3">
                  <label className="form-label">Select Account <span className="text-danger">*</span></label>
                  <select
                    name="offerLetterChargeAccount"
                    className={`form-select ${errors.offerLetterChargeAccount ? 'is-invalid' : ''}`}
                    value={formData.offerLetterChargeAccount}
                    onChange={handleChange}
                  >
                    <option value="">Select Account</option>
                    {accounts.map((account) => (
                      <option key={account.account_ID} value={account.account_ID}>
                        {account.account_Name}
                      </option>
                    ))}
                  </select>
                  {errors.offerLetterChargeAccount && <div className="invalid-feedback">{errors.offerLetterChargeAccount}</div>}
                </div>
              )}
              {formData.offerLetterChargeOn === '2' && (
                <div className="col-md-12 mb-3">
                  <label className="form-label">Select Supplier <span className="text-danger">*</span></label>
                  <select
                    name="offerLetterChargeSupplier"
                    className={`form-select ${errors.offerLetterChargeSupplier ? 'is-invalid' : ''}`}
                    value={formData.offerLetterChargeSupplier}
                    onChange={handleChange}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.supp_id} value={supplier.supp_id}>
                        {supplier.supp_name}
                      </option>
                    ))}
                  </select>
                  {errors.offerLetterChargeSupplier && <div className="invalid-feedback">{errors.offerLetterChargeSupplier}</div>}
                </div>
              )}
              {formData.offerLetterChargeOn === '3' && (
                <div className="col-md-12 mb-3">
                  <label className="form-label">💳 Select Credit Card <span className="text-danger">*</span></label>
                  <select
                    name="offerLetterChargeAccount"
                    className={`form-select ${errors.offerLetterChargeAccount ? 'is-invalid' : ''}`}
                    value={formData.offerLetterChargeAccount}
                    onChange={handleChange}
                  >
                    <option value="">Select Credit Card</option>
                    {creditCards.map((card) => (
                      <option key={card.account_ID} value={card.account_ID}>
                        {card.display_name || `💳 ${card.account_Name}`}
                      </option>
                    ))}
                  </select>
                  {errors.offerLetterChargeAccount && <div className="invalid-feedback">{errors.offerLetterChargeAccount}</div>}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Close
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <i className="fa fa-spinner fa-spin me-2"></i> : null}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

