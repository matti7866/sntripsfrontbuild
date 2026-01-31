import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/api';
import Swal from 'sweetalert2';
import './ResidenceMonthlyReport.css';

interface MonthlyRecord {
  residenceID: number;
  passenger_name: string;
  nationality: string;
  customer_name: string;
  company_name: string;
  month: string;
  dt: string;
  current_status: string;
  sale_price: number;
  fine: number;
  residencePayment: number;
  finePayment: number;
  cancellation_charges: number;
  tawjeeh_charges: number;
  tawjeeh_payments: number;
  iloe_charges: number;
  iloe_payments: number;
  custom_charges: number;
  total_charges: number;
  total_payments: number;
  balance: number;
  payment_status: string;
  currency_name: string;
}

interface MonthlyStats {
  month: string;
  total_residences: number;
  active: number;
  cancelled: number;
  completed: number;
  renewed: number;
  replaced: number;
  other_status: number;
  paid: number;
  unpaid: number;
  partial: number;
  total_sale: number;
  total_paid: number;
  total_balance: number;
}

export default function ResidenceMonthlyReport() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [residenceStatusFilter, setResidenceStatusFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(1000);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Totals
  const [overallTotals, setOverallTotals] = useState({
    total_residences: 0,
    total_sale: 0,
    total_paid: 0,
    total_balance: 0
  });

  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMonthlyReport();
  }, [selectedMonth, paymentStatusFilter, residenceStatusFilter, currentPage, recordsPerPage]);

  // Reset to page 1 when filters or records per page changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [selectedMonth, paymentStatusFilter, residenceStatusFilter, recordsPerPage]);

  const loadMonthlyReport = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (selectedMonth) {
        formData.append('month', selectedMonth);
      }
      formData.append('paymentStatus', paymentStatusFilter);
      formData.append('residenceStatus', residenceStatusFilter);
      formData.append('page', currentPage.toString());
      formData.append('limit', recordsPerPage.toString());
      
      const response = await axios.post('/residence/residence-monthly-report.php', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response && response.data) {
        const responseData = response.data;
        
        console.log('Monthly Report Response:', responseData);
        
        let data = [];
        let stats = [];
        let pagination = null;
        let totals = null;
        
        if (responseData.success && responseData.data) {
          data = Array.isArray(responseData.data.data) ? responseData.data.data : responseData.data;
          stats = responseData.data.monthlyStats || [];
          pagination = responseData.data.pagination || null;
          totals = responseData.data.totals || null;
          
          console.log('Extracted totals:', totals);
          console.log('Extracted data length:', data.length);
        }
        
        setRecords(data);
        setMonthlyStats(stats);
        
        if (totals) {
          console.log('Setting totals from API:', totals);
          setOverallTotals(totals);
        } else {
          // Calculate totals from records if not provided by API
          console.log('Calculating totals from records. Record count:', data.length);
          const calculatedTotals = {
            total_residences: data.length,
            total_sale: data.reduce((sum, record) => sum + (parseFloat(record.total_charges?.toString() || '0')), 0),
            total_paid: data.reduce((sum, record) => sum + (parseFloat(record.total_payments?.toString() || '0')), 0),
            total_balance: data.reduce((sum, record) => sum + (parseFloat(record.balance?.toString() || '0')), 0)
          };
          console.log('Calculated totals:', calculatedTotals);
          setOverallTotals(calculatedTotals);
        }
        
        if (pagination) {
          setTotalPages(pagination.totalPages || 1);
          setTotalRecords(pagination.totalRecords || data.length);
        } else {
          setTotalPages(1);
          setTotalRecords(data.length);
        }
      } else {
        setRecords([]);
        setMonthlyStats([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (error: any) {
      console.error('Error loading monthly report:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load monthly report';
      Swal.fire('Error', errorMessage, 'error');
      setRecords([]);
      setMonthlyStats([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printAreaRef.current) {
      Swal.fire('Error', 'Print area not found', 'error');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      Swal.fire('Error', 'Please allow popups to print', 'error');
      return;
    }

    const printContent = printAreaRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Residence Monthly Report</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A4 portrait;
              margin: 10mm 15mm;
            }
            
            html, body {
              width: 100%;
              height: auto;
              overflow: visible;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              font-size: 11px;
              color: #1a1a1a;
              background: #ffffff;
              padding: 0;
              margin: 0;
              line-height: 1.4;
            }
            
            .no-print {
              display: none !important;
            }
            
            .container-fluid {
              width: 100%;
              padding: 0;
              margin: 0;
            }
            
            .print-header {
              margin-bottom: 10px;
              page-break-inside: avoid;
              background: #000000;
              padding: 15px 20px;
              border-radius: 8px;
              color: white;
            }
            
            .print-header h2 {
              color: white;
              font-size: 18px;
              margin: 0;
            }
            
            .print-header p {
              color: rgba(255, 255, 255, 0.95);
              font-size: 12px;
              margin: 5px 0;
            }
            
            .table-responsive {
              width: 100%;
              overflow: visible;
              margin-top: 10px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              border-spacing: 0;
              margin: 10px 0;
              font-size: 10px;
              background: white;
            }
            
            table th {
              background: #000000 !important;
              color: white !important;
              padding: 8px 6px;
              text-align: left;
              font-weight: 600;
              border: 1px solid #ddd;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            table td {
              padding: 6px 6px;
              border: 1px solid #e5e7eb;
              text-align: left;
              font-size: 10px;
              vertical-align: top;
            }
            
            table tbody tr:nth-of-type(even) {
              background-color: #f9fafb;
            }
            
            .badge {
              padding: 3px 6px;
              border-radius: 4px;
              font-size: 8px;
              font-weight: 600;
              display: inline-block;
              text-transform: uppercase;
              white-space: nowrap;
            }
            
            .bg-success { 
              background: #10b981 !important; 
              color: white; 
            }
            .bg-danger { 
              background: #ef4444 !important; 
              color: white; 
            }
            .bg-warning { 
              background: #f59e0b !important; 
              color: white; 
            }
            .bg-info { 
              background: #3b82f6 !important; 
              color: white; 
            }
            .bg-primary { 
              background: #000000 !important; 
              color: white; 
            }
            .bg-secondary { 
              background: #6b7280 !important; 
              color: white; 
            }
            
            .monthly-stats {
              background: #f3f4f6;
              padding: 12px;
              border-radius: 6px;
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            
            .stat-card {
              display: inline-block;
              background: white;
              padding: 10px 14px;
              border-radius: 4px;
              margin: 5px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              min-width: 120px;
            }
            
            .stat-label {
              font-size: 9px;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            
            .stat-value {
              font-size: 16px;
              font-weight: 700;
              color: #1f2937;
            }
            
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              table thead {
                display: table-header-group;
              }
              
              table tbody tr {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="container-fluid">
            ${printContent}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    let badgeClass = 'bg-secondary';
    
    if (statusLower === 'active') {
      badgeClass = 'bg-success';
    } else if (statusLower === 'cancelled' || statusLower === 'replaced' || statusLower === 'cancelled & replaced') {
      badgeClass = 'bg-danger';
    } else if (statusLower === 'renewed') {
      badgeClass = 'bg-info';
    } else if (statusLower === 'completed') {
      badgeClass = 'bg-primary';
    }
    
    return <span className={`badge ${badgeClass}`}>{status}</span>;
  };

  const getPaymentStatusBadge = (status: string) => {
    let badgeClass = 'bg-danger';
    let text = 'Unpaid';
    
    if (status === 'paid') {
      badgeClass = 'bg-success';
      text = 'Paid';
    } else if (status === 'partial') {
      badgeClass = 'bg-warning';
      text = 'Partial';
    }
    
    return <span className={`badge ${badgeClass}`}>{text}</span>;
  };

  const formatNumber = (num: number | string | null | undefined) => {
    const value = parseFloat(num?.toString() || '0');
    return value.toLocaleString();
  };

  const formatMonthDisplay = (monthStr: string) => {
    if (!monthStr) return 'N/A';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Pagination calculations
  const indexOfLastRecord = Math.min(currentPage * recordsPerPage, totalRecords);
  const indexOfFirstRecord = totalRecords > 0 ? ((currentPage - 1) * recordsPerPage) + 1 : 0;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate month options (last 24 months)
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7); // YYYY-MM format
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  };

  return (
    <div className="residence-monthly-report-page">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <h2 className="mb-0">Residence Monthly Report</h2>
                  </div>
                  <div className="col-md-6 text-right">
                    <button className="btn btn-danger" onClick={handlePrint}>
                      <i className="fa fa-print me-2"></i> Print Report
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Filters */}
              <div className="card-body no-print">
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label htmlFor="monthFilter" className="form-label">Filter by Month</label>
                    <select
                      id="monthFilter"
                      className="form-control"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      <option value="">All Months</option>
                      {generateMonthOptions().map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-3">
                    <label htmlFor="paymentStatusFilter" className="form-label">Payment Status</label>
                    <select
                      id="paymentStatusFilter"
                      className="form-control"
                      value={paymentStatusFilter}
                      onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                  </div>
                  
                  <div className="col-md-3">
                    <label htmlFor="residenceStatusFilter" className="form-label">Residence Status</label>
                    <select
                      id="residenceStatusFilter"
                      className="form-control"
                      value={residenceStatusFilter}
                      onChange={(e) => setResidenceStatusFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                      <option value="renewed">Renewed</option>
                      <option value="replaced">Replaced</option>
                      <option value="cancelled & replaced">Cancelled & Replaced</option>
                    </select>
                  </div>
                  
                  <div className="col-md-3">
                    <label htmlFor="recordsPerPage" className="form-label">Records per page</label>
                    <select
                      id="recordsPerPage"
                      className="form-control"
                      value={recordsPerPage}
                      onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                    >
                      <option value={1000}>All</option>
                      <option value={100}>100</option>
                      <option value={50}>50</option>
                      <option value={25}>25</option>
                    </select>
                  </div>
                </div>
                
                {!loading && records.length > 0 && (
                  <div className="row mb-3">
                    <div className="col-md-12">
                      <p className="text-muted mb-0">
                        Showing {indexOfFirstRecord} to {indexOfLastRecord} of {totalRecords} records
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div id="printThisArea" ref={printAreaRef}>
                <div className="card-body">
                  <div className="print-header">
                    <div className="row">
                      <div className="col-md-12 text-center">
                        <h2>Residence Monthly Report</h2>
                        <p>Generated on: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        {selectedMonth && <p>Month: {formatMonthDisplay(selectedMonth)}</p>}
                      </div>
                    </div>
                  </div>
                  
                  {/* Monthly Statistics */}
                  {!loading && monthlyStats.length > 0 && (
                    <div className="monthly-stats no-print">
                      <h4 className="mb-3">Monthly Summary</h4>
                      {monthlyStats.map((stat, index) => (
                        <div key={index} className="mb-4 p-3" style={{ background: 'white', borderRadius: '8px' }}>
                          <h5 className="mb-3" style={{ color: '#000', fontWeight: 'bold' }}>
                            {formatMonthDisplay(stat.month)}
                          </h5>
                          <div className="row">
                            <div className="col-md-2">
                              <div className="stat-card">
                                <div className="stat-label">Total Residences</div>
                                <div className="stat-value">{stat.total_residences}</div>
                              </div>
                            </div>
                            <div className="col-md-2">
                              <div className="stat-card">
                                <div className="stat-label">Active</div>
                                <div className="stat-value text-success">{stat.active}</div>
                              </div>
                            </div>
                            <div className="col-md-2">
                              <div className="stat-card">
                                <div className="stat-label">Cancelled</div>
                                <div className="stat-value text-danger">{stat.cancelled}</div>
                              </div>
                            </div>
                            <div className="col-md-2">
                              <div className="stat-card">
                                <div className="stat-label">Paid</div>
                                <div className="stat-value text-success">{stat.paid}</div>
                              </div>
                            </div>
                            <div className="col-md-2">
                              <div className="stat-card">
                                <div className="stat-label">Unpaid</div>
                                <div className="stat-value text-danger">{stat.unpaid}</div>
                              </div>
                            </div>
                            <div className="col-md-2">
                              <div className="stat-card">
                                <div className="stat-label">Total Sale</div>
                                <div className="stat-value">{formatNumber(stat.total_sale)}</div>
                              </div>
                            </div>
                          </div>
                          <div className="row mt-2">
                            <div className="col-md-3">
                              <div className="stat-card">
                                <div className="stat-label">Total Paid</div>
                                <div className="stat-value text-primary">{formatNumber(stat.total_paid)}</div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="stat-card">
                                <div className="stat-label">Total Balance</div>
                                <div className="stat-value text-warning">{formatNumber(stat.total_balance)}</div>
                              </div>
                            </div>
                            <div className="col-md-2">
                              <div className="stat-card">
                                <div className="stat-label">Completed</div>
                                <div className="stat-value">{stat.completed}</div>
                              </div>
                            </div>
                            <div className="col-md-2">
                              <div className="stat-card">
                                <div className="stat-label">Renewed</div>
                                <div className="stat-value">{stat.renewed}</div>
                              </div>
                            </div>
                            <div className="col-md-2">
                              <div className="stat-card">
                                <div className="stat-label">Partial Paid</div>
                                <div className="stat-value text-warning">{stat.partial}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Table Section */}
                  <div className="row mt-4">
                    <div className="table-responsive">
                      <table className="table table-striped table-hover table-bordered">
                        <thead>
                          <tr className="bg-danger text-white">
                            <th>S#</th>
                            <th>Month</th>
                            <th>Date</th>
                            <th>Customer Name</th>
                            <th>Passenger Name</th>
                            <th>Company</th>
                            <th>Sale Price</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Payment Status</th>
                            <th>Residence Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={11} className="text-center py-4">
                                <i className="fa fa-spinner fa-spin fa-2x"></i>
                                <p className="mt-2">Loading...</p>
                              </td>
                            </tr>
                          ) : records.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="text-center py-4">
                                No records found for the selected filters
                              </td>
                            </tr>
                          ) : (
                            records.map((record, index) => (
                              <tr key={record.residenceID} className={record.payment_status === 'unpaid' ? 'table-danger-light' : ''}>
                                <td>{indexOfFirstRecord + index}</td>
                                <td>{formatMonthDisplay(record.month)}</td>
                                <td>{new Date(record.dt).toLocaleDateString('en-GB')}</td>
                                <td className="text-capitalize">{record.customer_name}</td>
                                <td className="text-capitalize">
                                  {record.passenger_name}
                                  <br />
                                  <small className="text-muted">
                                    <i className="fa fa-flag"></i> {record.nationality || 'N/A'}
                                  </small>
                                </td>
                                <td>{record.company_name || 'N/A'}</td>
                                <td>
                                  {formatNumber(record.total_charges)}
                                  <br />
                                  <small className="text-muted">{record.currency_name}</small>
                                </td>
                                <td>
                                  {formatNumber(record.total_payments)}
                                  <br />
                                  <small className="text-muted">{record.currency_name}</small>
                                </td>
                                <td>
                                  <span className={record.balance > 0 ? 'text-danger fw-bold' : 'text-success'}>
                                    {formatNumber(record.balance)}
                                  </span>
                                  <br />
                                  <small className="text-muted">{record.currency_name}</small>
                                </td>
                                <td>{getPaymentStatusBadge(record.payment_status)}</td>
                                <td>{getStatusBadge(record.current_status)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Pagination Controls */}
                  {!loading && records.length > 0 && totalPages > 1 && (
                    <div className="row no-print" style={{ marginTop: '20px', marginBottom: '20px' }}>
                      <div className="col-md-12">
                        <nav aria-label="Report pagination">
                          <ul className="pagination justify-content-center">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                              >
                                Previous
                              </button>
                            </li>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              ) {
                                return (
                                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                    <button
                                      className="page-link"
                                      onClick={() => handlePageChange(page)}
                                    >
                                      {page}
                                    </button>
                                  </li>
                                );
                              } else if (
                                page === currentPage - 2 ||
                                page === currentPage + 2
                              ) {
                                return (
                                  <li key={page} className="page-item disabled">
                                    <span className="page-link">...</span>
                                  </li>
                                );
                              }
                              return null;
                            })}
                            
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                              >
                                Next
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    </div>
                  )}
                  
                  {/* Overall Totals */}
                  {!loading && records.length > 0 && (
                    <div className="print-totals">
                      <div className="row">
                        <div className="col-md-12 text-right">
                          <p className="print-total-row">
                            Total Residences: <span>{overallTotals.total_residences}</span>
                          </p>
                          <hr />
                          <p className="print-total-row">
                            Total Sale: <span>{formatNumber(overallTotals.total_sale)}</span>
                          </p>
                          <p className="print-total-row">
                            Total Paid: <span>{formatNumber(overallTotals.total_paid)}</span>
                          </p>
                          <hr />
                          <p className="print-outstanding">
                            <b>Total Outstanding: <span>{formatNumber(overallTotals.total_balance)}</span></b>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
