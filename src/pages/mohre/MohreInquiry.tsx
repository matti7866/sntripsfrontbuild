import { useState } from 'react';
import Swal from 'sweetalert2';
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

export default function MohreInquiry() {
  const [permitNumber, setPermitNumber] = useState('');
  const [mbNumber, setMbNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EWPData | null>(null);
  const [immigrationData, setImmigrationData] = useState<ImmigrationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to decode HTML entities
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
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

  const handleReset = () => {
    setPermitNumber('');
    setMbNumber('');
    setData(null);
    setImmigrationData(null);
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
        <div className="col-md-6 mb-4">
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
        <div className="col-md-6 mb-4">
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
                    Try example: <a href="#" onClick={(e) => { e.preventDefault(); setMbNumber('MB295943148AE'); }} className="text-primary">MB295943148AE</a>
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
      </div>

      {/* Reset Button */}
      {(data || immigrationData) && (
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
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="fa fa-building me-2"></i>
                  Company Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {data.company_info.company_name && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Company Name:</strong>
                      <p className="mb-0">{decodeHtmlEntities(data.company_info.company_name)}</p>
                    </div>
                  )}
                  {data.company_info.company_code && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Company Code:</strong>
                      <p className="mb-0">{data.company_info.company_code}</p>
                    </div>
                  )}
                  {data.company_info.category && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Category:</strong>
                      <p className="mb-0">{decodeHtmlEntities(data.company_info.category)}</p>
                    </div>
                  )}
                  {data.company_info.classification && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Classification:</strong>
                      <p className="mb-0">{decodeHtmlEntities(data.company_info.classification)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Permit Information */}
          {data.permit_info && Object.keys(data.permit_info).length > 0 && (
            <div className="card mb-4">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="fa fa-id-badge me-2"></i>
                  Electronic Work Permit Details
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {data.permit_info.person_name && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Name:</strong>
                      <p className="mb-0">{decodeHtmlEntities(data.permit_info.person_name)}</p>
                    </div>
                  )}
                  {data.permit_info.designation && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Designation:</strong>
                      <p className="mb-0">{decodeHtmlEntities(data.permit_info.designation)}</p>
                    </div>
                  )}
                  {data.permit_info.permit_number && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Permit Number:</strong>
                      <p className="mb-0 fw-bold text-primary">{data.permit_info.permit_number}</p>
                    </div>
                  )}
                  {data.permit_info.permit_type && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Permit Type:</strong>
                      <p className="mb-0">{decodeHtmlEntities(data.permit_info.permit_type)}</p>
                    </div>
                  )}
                  {data.permit_info.permit_active && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Status:</strong>
                      <p className="mb-0">
                        <span className={`badge ${
                          decodeHtmlEntities(data.permit_info.permit_active).toLowerCase().includes('active') || 
                          decodeHtmlEntities(data.permit_info.permit_active).includes('نشط') ? 
                          'bg-success' : 'bg-danger'
                        }`}>
                          {decodeHtmlEntities(data.permit_info.permit_active)}
                        </span>
                      </p>
                    </div>
                  )}
                  {data.permit_info.expiry_date && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Expiry Date:</strong>
                      <p className="mb-0">{data.permit_info.expiry_date}</p>
                    </div>
                  )}
                  {data.permit_info.employee_classification && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Employee Classification:</strong>
                      <p className="mb-0">{decodeHtmlEntities(data.permit_info.employee_classification)}</p>
                    </div>
                  )}
                  {data.permit_info.payment_number && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Payment Number:</strong>
                      <p className="mb-0">{data.permit_info.payment_number}</p>
                    </div>
                  )}
                  {data.permit_info.paycard_number && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Paycard Number:</strong>
                      <p className="mb-0">{data.permit_info.paycard_number}</p>
                    </div>
                  )}
                  {data.permit_info.person_code && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Person Code:</strong>
                      <p className="mb-0">{data.permit_info.person_code}</p>
                    </div>
                  )}
                  {data.permit_info.transaction_number && (
                    <div className="col-md-6 mb-3">
                      <strong className="text-muted">Transaction Number:</strong>
                      <p className="mb-0">{data.permit_info.transaction_number}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Work Permits List */}
          {data.work_permits && data.work_permits.length > 0 && (
            <div className="card mb-4">
              <div className="card-header bg-warning text-dark">
                <h5 className="mb-0">
                  <i className="fa fa-list me-2"></i>
                  Electronic Work Permits ({data.total_permits})
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped table-bordered table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>#</th>
                        <th>Permit Number</th>
                        <th>Permit Type</th>
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
                            <td>{index + 1}</td>
                            <td>
                              <strong className="text-primary">{permit.permit_number}</strong>
                            </td>
                            <td>{decodedPermitType}</td>
                            <td>
                              <span className={`badge ${
                                decodedStatus.toLowerCase().includes('active') || 
                                decodedStatus.includes('نشط') ||
                                decodedStatus.includes('ملغي') ? 
                                (decodedStatus.includes('ملغي') ? 'bg-danger' : 'bg-success') : 
                                'bg-warning text-dark'
                              }`}>
                                {decodedStatus}
                              </span>
                            </td>
                            <td>{permit.transaction_number}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
                      {immigrationData.immigration_status.application_status}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && !data && !immigrationData && (
        <div className="alert alert-danger">
          <i className="fa fa-exclamation-circle me-2"></i>
          {error}
        </div>
      )}
    </div>
  );
}

