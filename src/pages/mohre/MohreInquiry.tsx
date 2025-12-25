import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import SearchableSelect from '../../components/common/SearchableSelect';
import residenceService from '../../services/residenceService';
import './MohreInquiry.css';

interface WorkPermit {
  permit_number: string;
  permit_type: string;
  status: string;
  transaction_number: string;
}

interface CompanyInfo {
  company_name?: string;
  company_code?: string;
  category?: string;
  classification?: string;
}

interface PermitInfo {
  person_name?: string;
  designation?: string;
  expiry_date?: string;
  employee_classification?: string;
  permit_number?: string;
  permit_type?: string;
  permit_active?: string;
  payment_number?: string;
  paycard_number?: string;
  person_code?: string;
  transaction_number?: string;
}

interface ImmigrationStatus {
  card_number?: string;
  moi_company_code?: string;
  date_added?: string;
  send_date?: string;
  application_status?: string;
  file_number?: string;
  unified_number?: string;
}

interface EWPData {
  company_info: CompanyInfo;
  permit_info: PermitInfo;
  work_permits: WorkPermit[];
  total_permits: number;
}

interface ImmigrationData {
  immigration_status: ImmigrationStatus;
}

interface CompanyData {
  company_info: {
    company_name?: string;
    company_number?: string;
    category?: string;
    nationality?: string;
    class_desc?: string;
    company_type?: string;
    license_number?: string;
    license_type?: string;
    emirate?: string;
    labour_office?: string;
    mission_quota_available?: string;
    electronic_quota_available?: string;
    company_status?: string;
  };
}

export default function MohreInquiry() {
  const [permitNumber, setPermitNumber] = useState('');
  const [mbNumber, setMbNumber] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companies, setCompanies] = useState<Array<{ company_id: number; company_name: string; company_number: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EWPData | null>(null);
  const [immigrationData, setImmigrationData] = useState<ImmigrationData | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await residenceService.getCompanies();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  // Function to decode HTML entities
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Function to process paycard number with checkmark
  const processPaycardNumber = (html: string): string => {
    // Replace &#xFC; or ü with actual checkmark
    let processed = html.replace(/&#xFC;/gi, '✓');
    processed = processed.replace(/ü/g, '✓');
    // Remove font tags but keep the checkmark
    processed = processed.replace(/<font[^>]*>/gi, '<span style="color: #dc3545; font-size: 1.2em; margin-left: 4px;">');
    processed = processed.replace(/<\/font>/gi, '</span>');
    return processed;
  };

  // Helper function to decode and translate
  const decodeAndTranslate = (text: string, keepArabic: boolean = false): string => {
    const decoded = decodeHtmlEntities(text);
    if (keepArabic) return decoded;
    return translateArabicToEnglish(decoded);
  };

  // Function to translate Arabic to English
  const translateArabicToEnglish = (text: string): string => {
    const translations: { [key: string]: string } = {
      // Common Arabic terms from MOHRE
      'نشط': 'Active',
      'ملغي': 'Cancelled',
      'ملغى': 'Cancelled',
      'معلق': 'Suspended',
      'قيد المعالجة': 'In Progress',
      'مكتمل': 'Completed',
      'محدود المهارة': 'Limited Skilled',
      'ماهر': 'Skilled',
      'عالي المهارة': 'Highly Skilled',
      'كبيرة': 'Large',
      'متوسطة': 'Medium',
      'صغيرة': 'Small',
      'تصريح عمل الكتروني جديد': 'NEW ELECTRONIC WORK PERMIT',
      'اشعار الموافقة المبدئية لتصريح العمل': 'PRE APPROVAL FOR WORK PERMIT',
      'تجديد تصريح العمل الالكتروني': 'ELECTRONIC WORK PERMIT RENEWAL',
      'عامل النظافة في المستشفى': 'Hospital Cleaner',
      'عامل النظافة': 'Cleaner',
      'موظف مبيعات': 'Sales Officer',
      'مساعد مبيعات': 'Sales Assistant',
      'محاسب': 'Accountant',
      'مهندس': 'Engineer',
      'طباخ': 'Cook',
      'طباخ أجنبي': 'Foreign Cook',
      'نادل': 'Waiter',
      'سائق': 'Driver',
      'معلومات تصريح العمل قد تم إرسالها': 'Workpermit information already sent',
      'تم ارسال بيانات تصريح العمل لرقم الملف': 'Workpermit information has been sent with file number',
      'و الرقم الموحد': 'And Unified No',
      // Company related terms
      'الإمارات': 'EMIRATES',
      'ذات مسئولية محدودة': 'Limited Liability Company',
      'مفردة': 'Single',
      'سياحية': 'Tourism',
      'دبي': 'Dubai',
      'دبى': 'Dubai',
      'أبوظبي': 'Abu Dhabi',
      'الشارقة': 'Sharjah',
      'عجمان': 'Ajman',
      'أم القيوين': 'Umm Al Quwain',
      'رأس الخيمة': 'Ras Al Khaimah',
      'الفجيرة': 'Fujairah',
      'تجارية': 'Commercial',
      'صناعية': 'Industrial',
      'خدمية': 'Service',
      'مهنية': 'Professional',
      // Additional company terms
      'فردية': 'Single',
      'نيبال': 'Nepal',
      'الهند': 'India',
      'باكستان': 'Pakistan',
      'بنغلاديش': 'Bangladesh',
      'سريلانكا': 'Sri Lanka',
      'الفلبين': 'Philippines',
      'مصر': 'Egypt',
      'الأردن': 'Jordan',
      'سوريا': 'Syria',
      'لبنان': 'Lebanon',
      'عدم الالتزام بالنسبة المطلوبة لتحويل الأجور': 'Non-compliance with the required wage transfer percentage',
      'وقف التصاريح الجديدة': 'Stop new permits',
      'حماية الاجور': 'Wage protection'
    };

    let translated = text;
    
    // Replace each Arabic term with English
    Object.keys(translations).forEach(arabic => {
      const regex = new RegExp(arabic, 'gi');
      translated = translated.replace(regex, translations[arabic]);
    });

    return translated;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!permitNumber.trim()) {
      Swal.fire('Error', 'Please enter an electronic work permit number', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setImmigrationData(null);
    setCompanyData(null);

    try {
      const response = await fetch(`https://api.sntrips.com/trx/ewp.php?permitNumber=${permitNumber.trim()}`);
      const result = await response.json();

      if (result.status === 'success') {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch work permit information');
        Swal.fire('Error', result.message || 'Failed to fetch work permit information', 'error');
      }
    } catch (err: any) {
      console.error('Error fetching work permit info:', err);
      setError('Failed to connect to MOHRE. Please try again.');
      Swal.fire('Error', 'Failed to connect to MOHRE. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchMB = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mbNumber.trim()) {
      Swal.fire('Error', 'Please enter an MB/Transaction number', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setImmigrationData(null);
    setData(null);
    setCompanyData(null);

    try {
      const response = await fetch(`https://api.sntrips.com/trx/wpricp.php?mbNumber=${mbNumber.trim()}`);
      const result = await response.json();

      if (result.status === 'success') {
        setImmigrationData(result.data);
      } else {
        setError(result.message || 'Failed to fetch immigration status');
        Swal.fire('Error', result.message || 'Failed to fetch immigration status', 'error');
      }
    } catch (err: any) {
      console.error('Error fetching immigration status:', err);
      setError('Failed to connect to MOHRE. Please try again.');
      Swal.fire('Error', 'Failed to connect to MOHRE. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyNumber.trim()) {
      Swal.fire('Error', 'Please enter a company number', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setCompanyData(null);
    setData(null);
    setImmigrationData(null);

    try {
      const response = await fetch(`https://api.sntrips.com/trx/company-info.php?companyNumber=${companyNumber.trim()}`);
      const result = await response.json();

      if (result.status === 'success') {
        setCompanyData(result.data);
      } else {
        setError(result.message || 'Failed to fetch company information');
        Swal.fire('Error', result.message || 'Failed to fetch company information', 'error');
      }
    } catch (err: any) {
      console.error('Error fetching company info:', err);
      setError('Failed to connect to MOHRE. Please try again.');
      Swal.fire('Error', 'Failed to connect to MOHRE. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPermitNumber('');
    setMbNumber('');
    setCompanyNumber('');
    setSelectedCompany('');
    setData(null);
    setImmigrationData(null);
    setCompanyData(null);
    setError(null);
  };

  return (
    <div className="mohre-inquiry-page">
      <div className="page-header mb-4">
        <h1 className="page-title">
          <i className="fa fa-building me-2"></i>
          MOHRE Inquiry System
        </h1>
        <p className="text-muted">Check Electronic Work Permit Information</p>
      </div>

      {/* Search Cards Row */}
      <div className="row">
        {/* Electronic Work Permit Search */}
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="fa fa-id-card me-2"></i>
                Electronic Work Permit Information
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSearch}>
                <div className="mb-3">
                  <label htmlFor="permitNumber" className="form-label">
                    Electronic Work Permit Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="permitNumber"
                    className="form-control"
                    placeholder="Enter permit number (e.g., 123217758)"
                    value={permitNumber}
                    onChange={(e) => setPermitNumber(e.target.value)}
                    disabled={loading}
                  />
                  <small className="text-muted">
                    <i className="fa fa-info-circle me-1"></i>
                    Try example: <a href="#" onClick={(e) => { e.preventDefault(); setPermitNumber('123217758'); }} className="text-primary">123217758</a>
                  </small>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fa fa-spinner fa-spin me-2"></i>
                      Searching...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-search me-2"></i>
                      Search by Permit Number
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Immigration Status Search */}
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="fa fa-passport me-2"></i>
                Immigration Status
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSearchMB}>
                <div className="mb-3">
                  <label htmlFor="mbNumber" className="form-label">
                    MB/Transaction Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="mbNumber"
                    className="form-control"
                    placeholder="Enter MB number (e.g., MB295943148AE)"
                    value={mbNumber}
                    onChange={(e) => setMbNumber(e.target.value)}
                    disabled={loading}
                  />
                  <small className="text-muted">
                    <i className="fa fa-info-circle me-1"></i>
                    Try example: <a href="#" onClick={(e) => { e.preventDefault(); setMbNumber('MB295943148AE'); }} className="text-success">MB295943148AE</a>
                  </small>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-success w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fa fa-spinner fa-spin me-2"></i>
                      Searching...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-search me-2"></i>
                      Search by MB Number
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Company Information Search */}
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">
                <i className="fa fa-building me-2"></i>
                Company Information
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSearchCompany}>
                <div className="mb-3">
                  <label htmlFor="companyDropdown" className="form-label">
                    Select Company
                  </label>
                  <SearchableSelect
                    options={[
                      { value: '', label: 'Select from saved companies...' },
                      ...companies
                        .filter(company => company && company.company_id)
                        .map((company) => ({
                          value: String(company.company_number || ''),
                          label: `${company.company_name || 'Unknown'} - ${company.company_number || ''}`
                        }))
                    ]}
                    value={selectedCompany}
                    onChange={(value) => {
                      setSelectedCompany(String(value));
                      setCompanyNumber(String(value));
                    }}
                    placeholder="Select Company"
                  />
                  <small className="text-muted d-block mt-1">
                    <i className="fa fa-info-circle me-1"></i>
                    Or enter manually below
                  </small>
                </div>
                <div className="mb-3">
                  <label htmlFor="companyNumber" className="form-label">
                    Company Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="companyNumber"
                    className="form-control"
                    placeholder="Enter company number (e.g., 1206022)"
                    value={companyNumber}
                    onChange={(e) => {
                      setCompanyNumber(e.target.value);
                      setSelectedCompany(e.target.value);
                    }}
                    disabled={loading}
                  />
                  <small className="text-muted">
                    <i className="fa fa-info-circle me-1"></i>
                    Try example: <a href="#" onClick={(e) => { e.preventDefault(); setCompanyNumber('1206022'); setSelectedCompany('1206022'); }} className="text-warning">1206022</a>
                  </small>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-warning w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fa fa-spinner fa-spin me-2"></i>
                      Searching...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-search me-2"></i>
                      Search by Company Number
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      {(data || immigrationData || companyData) && (
        <div className="text-center mb-4">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={loading}
          >
            <i className="fa fa-refresh me-2"></i>
            Reset All
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-5">
          <i className="fa fa-spinner fa-spin fa-3x text-primary mb-3"></i>
          <p className="text-muted">Fetching data from MOHRE...</p>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="results-container">
          {/* Company Information */}
          {data.company_info && Object.keys(data.company_info).length > 0 && (
            <div className="card mb-4">
              <div className="card-body p-4" style={{ backgroundColor: '#f8f9fa' }}>
                <h4 className="text-center mb-4" style={{ fontSize: '1.5rem', fontWeight: '500' }}>
                  Company Information
                </h4>
                <div className="bg-white p-4 rounded">
                  <div className="row">
                    {data.company_info.company_name && (
                      <div className="col-md-6 mb-3">
                        <div><strong>Est Name:</strong> {translateArabicToEnglish(decodeHtmlEntities(data.company_info.company_name))}</div>
                      </div>
                    )}
                    {data.company_info.company_code && (
                      <div className="col-md-6 mb-3">
                        <div><strong>Company Code:</strong> {data.company_info.company_code}</div>
                      </div>
                    )}
                    {data.company_info.category && (
                      <div className="col-md-6 mb-3">
                        <div><strong>Category:</strong> {translateArabicToEnglish(decodeHtmlEntities(data.company_info.category))}</div>
                      </div>
                    )}
                    {data.company_info.classification && (
                      <div className="col-md-6 mb-3">
                        <div><strong>Classification:</strong> {translateArabicToEnglish(decodeHtmlEntities(data.company_info.classification))}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Permit Information */}
          {data.permit_info && Object.keys(data.permit_info).length > 0 && (
            <div className="card mb-4">
              <div className="card-body p-4" style={{ backgroundColor: '#f8f9fa' }}>
                <h4 className="text-center mb-4" style={{ fontSize: '1.5rem', fontWeight: '500' }}>
                  Electronic Work PermitIn formation
                </h4>
                <div className="bg-white p-4 rounded">
                  <div className="row">
                    {data.permit_info.person_name && (
                      <div className="col-md-6 mb-3">
                        <div><strong>Name:</strong> {translateArabicToEnglish(decodeHtmlEntities(data.permit_info.person_name))}</div>
                      </div>
                    )}
                    {data.permit_info.designation && (
                      <div className="col-md-6 mb-3">
                        <div><strong>Designation:</strong> {translateArabicToEnglish(decodeHtmlEntities(data.permit_info.designation))}</div>
                      </div>
                    )}
                    {data.permit_info.expiry_date && (
                      <div className="col-md-6 mb-3">
                        <div><strong>Expiry Date:</strong> {data.permit_info.expiry_date}</div>
                      </div>
                    )}
                    {data.permit_info.employee_classification && (
                      <div className="col-md-6 mb-3">
                        <div><strong>Employee Classification:</strong> {translateArabicToEnglish(decodeHtmlEntities(data.permit_info.employee_classification))}</div>
                      </div>
                    )}
                    {data.permit_info.permit_number && (
                      <div className="col-md-6 mb-3">
                        <div><strong>Electronic Work Permit Number:</strong> {data.permit_info.permit_number}</div>
                      </div>
                    )}
                    {data.permit_info.permit_type && (
                      <div className="col-md-6 mb-3">
                        <div><strong>Electronic Work Permit Type:</strong> {translateArabicToEnglish(decodeHtmlEntities(data.permit_info.permit_type))}</div>
                      </div>
                    )}
                    {data.permit_info.permit_active && (
                      <div className="col-md-6 mb-3">
                        <div><strong>Electronic Work Permit Active:</strong> {translateArabicToEnglish(decodeHtmlEntities(data.permit_info.permit_active))}</div>
                      </div>
                    )}
                    {data.permit_info.payment_number && (
                      <div className="col-md-6 mb-3">
                        <div><strong>Payment Number:</strong> {data.permit_info.payment_number}</div>
                      </div>
                    )}
                    {data.permit_info.paycard_number && (
                      <div className="col-md-6 mb-3">
                        <div>
                          <strong>Paycard Number:</strong>{' '}
                          <span 
                            dangerouslySetInnerHTML={{ 
                              __html: processPaycardNumber(data.permit_info.paycard_number)
                            }} 
                          />
                        </div>
                      </div>
                    )}
                    {data.permit_info.person_code && (
                      <div className="col-md-6 mb-3">
                        <div><strong>Person Code:</strong> {data.permit_info.person_code}</div>
                      </div>
                    )}
                    {data.permit_info.transaction_number && (
                      <div className="col-md-6 mb-3">
                        <div><strong>Transaction Number:</strong> {data.permit_info.transaction_number}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Work Permits List */}
          {data.work_permits && data.work_permits.length > 0 && (
            <div className="card mb-4">
              <div className="card-body p-4" style={{ backgroundColor: '#f8f9fa' }}>
                <h4 className="text-center mb-4" style={{ fontSize: '1.5rem', fontWeight: '500' }}>
                  Electronic Work Permits Information
                </h4>
                <div className="table-responsive">
                  <table className="table table-bordered" style={{ backgroundColor: 'white' }}>
                    <thead style={{ backgroundColor: '#6c757d', color: 'white' }}>
                      <tr>
                        <th>Electronic Work Permit Number</th>
                        <th>Electronic Work Permit Type</th>
                        <th>Status</th>
                        <th>Transaction Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.work_permits.map((permit, index) => {
                        const decodedPermitType = decodeHtmlEntities(permit.permit_type);
                        const decodedStatus = decodeHtmlEntities(permit.status);
                        
                        return (
                          <tr key={index}>
                            <td>{permit.permit_number}</td>
                            <td>{translateArabicToEnglish(decodedPermitType)}</td>
                            <td>{translateArabicToEnglish(decodedStatus)}</td>
                            <td>{permit.transaction_number}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="text-center mt-4">
                  <button 
                    className="btn btn-outline-secondary" 
                    onClick={() => window.print()}
                    style={{ 
                      borderRadius: '20px',
                      padding: '8px 30px',
                      backgroundColor: '#f5f5dc',
                      border: '1px solid #d4af37',
                      color: '#666'
                    }}
                  >
                    <i className="fa fa-print me-2"></i>
                    Print
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No Data Message */}
          {(!data.company_info || Object.keys(data.company_info).length === 0) &&
           (!data.permit_info || Object.keys(data.permit_info).length === 0) &&
           (!data.work_permits || data.work_permits.length === 0) && (
            <div className="alert alert-danger text-center">
              <i className="fa fa-times-circle fa-3x mb-3"></i>
              <h5>No Information Found</h5>
              <p className="mb-0">
                No work permit information found for permit number: <strong>{permitNumber}</strong>
              </p>
              <p className="mb-0 mt-2">
                <small>
                  • Please verify the permit number is correct<br/>
                  • The permit may not exist in the MOHRE system<br/>
                  • Try searching with a different permit number
                </small>
              </p>
              <button className="btn btn-primary btn-sm mt-3" onClick={handleReset}>
                <i className="fa fa-search me-2"></i>
                Try Another Search
              </button>
            </div>
          )}
        </div>
      )}

      {/* Immigration Status Results */}
      {immigrationData && !loading && (
        <div className="results-container">
          <div className="card mb-4">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="fa fa-passport me-2"></i>
                Transaction Status in Immigration
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {immigrationData.immigration_status.card_number && (
                  <div className="col-md-6 mb-3">
                    <strong className="text-muted">Card Number:</strong>
                    <p className="mb-0 fw-bold text-primary">{immigrationData.immigration_status.card_number}</p>
                  </div>
                )}
                {immigrationData.immigration_status.moi_company_code && (
                  <div className="col-md-6 mb-3">
                    <strong className="text-muted">MOI Company Code:</strong>
                    <p className="mb-0">{immigrationData.immigration_status.moi_company_code}</p>
                  </div>
                )}
                {immigrationData.immigration_status.date_added && (
                  <div className="col-md-6 mb-3">
                    <strong className="text-muted">Date Added:</strong>
                    <p className="mb-0">{immigrationData.immigration_status.date_added}</p>
                  </div>
                )}
                {immigrationData.immigration_status.send_date && (
                  <div className="col-md-6 mb-3">
                    <strong className="text-muted">Send Date:</strong>
                    <p className="mb-0">{immigrationData.immigration_status.send_date}</p>
                  </div>
                )}
                {immigrationData.immigration_status.file_number && (
                  <div className="col-md-6 mb-3">
                    <strong className="text-muted">File Number:</strong>
                    <p className="mb-0 text-info fw-bold">{immigrationData.immigration_status.file_number}</p>
                  </div>
                )}
                {immigrationData.immigration_status.unified_number && (
                  <div className="col-md-6 mb-3">
                    <strong className="text-muted">Unified Number:</strong>
                    <p className="mb-0 text-info fw-bold">{immigrationData.immigration_status.unified_number}</p>
                  </div>
                )}
                {immigrationData.immigration_status.application_status && (
                  <div className="col-12 mb-3">
                    <strong className="text-muted">Application Status:</strong>
                    <div className="alert alert-success mt-2 mb-0">
                      <i className="fa fa-check-circle me-2"></i>
                      {translateArabicToEnglish(immigrationData.immigration_status.application_status)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Information Results */}
      {companyData && !loading && (
        <div className="results-container">
          <div className="card mb-4">
            <div className="card-body p-4" style={{ backgroundColor: '#f8f9fa' }}>
              <h4 className="text-center mb-4" style={{ fontSize: '1.5rem', fontWeight: '500' }}>
                Company Information
              </h4>
              <div className="bg-white p-4 rounded" style={{ backgroundColor: '#f5f5f5' }}>
                <div className="row">
                  {companyData.company_info.company_name && (
                    <div className="col-12 mb-3">
                      <div><strong>Company Name:</strong> {decodeHtmlEntities(companyData.company_info.company_name)}</div>
                    </div>
                  )}
                  {companyData.company_info.company_number && (
                    <div className="col-md-6 mb-3">
                      <div><strong>Company Number:</strong> {companyData.company_info.company_number}</div>
                    </div>
                  )}
                  {companyData.company_info.category && (
                    <div className="col-md-6 mb-3">
                      <div><strong>Category:</strong> {companyData.company_info.category}</div>
                    </div>
                  )}
                  {companyData.company_info.nationality && (
                    <div className="col-md-6 mb-3">
                      <div><strong>Nationality:</strong> {decodeAndTranslate(companyData.company_info.nationality)}</div>
                    </div>
                  )}
                  {companyData.company_info.class_desc && (
                    <div className="col-md-6 mb-3">
                      <div><strong>Class Desc:</strong> {decodeAndTranslate(companyData.company_info.class_desc)}</div>
                    </div>
                  )}
                  {companyData.company_info.company_type && (
                    <div className="col-md-6 mb-3">
                      <div><strong>Company Type:</strong> {decodeAndTranslate(companyData.company_info.company_type)}</div>
                    </div>
                  )}
                  {companyData.company_info.license_number && (
                    <div className="col-md-6 mb-3">
                      <div><strong>License Number:</strong> {companyData.company_info.license_number}</div>
                    </div>
                  )}
                  {companyData.company_info.license_type && (
                    <div className="col-md-6 mb-3">
                      <div><strong>License Type:</strong> {decodeAndTranslate(companyData.company_info.license_type)}</div>
                    </div>
                  )}
                  {companyData.company_info.emirate && (
                    <div className="col-md-6 mb-3">
                      <div><strong>Emirate:</strong> {decodeAndTranslate(companyData.company_info.emirate)}</div>
                    </div>
                  )}
                  {companyData.company_info.labour_office && (
                    <div className="col-md-6 mb-3">
                      <div><strong>Labour Office:</strong> {decodeAndTranslate(companyData.company_info.labour_office)}</div>
                    </div>
                  )}
                  {companyData.company_info.mission_quota_available !== undefined && (
                    <div className="col-md-6 mb-3">
                      <div><strong>Mission Work Permit Quota Available:</strong> {companyData.company_info.mission_quota_available}</div>
                    </div>
                  )}
                  {companyData.company_info.electronic_quota_available !== undefined && (
                    <div className="col-md-6 mb-3">
                      <div><strong>Electronic Work Permit Quota Available:</strong> {companyData.company_info.electronic_quota_available}</div>
                    </div>
                  )}
                  {companyData.company_info.company_status && (
                    <div className="col-12 mb-3">
                      <div>
                        <strong>Company Status:</strong>
                        <div style={{ marginTop: '8px' }}>
                          {decodeAndTranslate(companyData.company_info.company_status).split(/[\r\n,]+/).filter(line => line.trim()).map((line, i) => (
                            <div key={i} style={{ marginBottom: '4px' }}>
                              {line.trim().startsWith('*') ? (
                                <span className="text-danger">• {line.trim().substring(1)}</span>
                              ) : (
                                <span>{line.trim()}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center mt-4">
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={() => window.print()}
                  style={{ 
                    borderRadius: '20px',
                    padding: '8px 30px',
                    backgroundColor: '#f5f5dc',
                    border: '1px solid #d4af37',
                    color: '#666'
                  }}
                >
                  <i className="fa fa-print me-2"></i>
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && !data && !immigrationData && !companyData && (
        <div className="alert alert-danger">
          <i className="fa fa-exclamation-circle me-2"></i>
          {error}
        </div>
      )}
    </div>
  );
}

