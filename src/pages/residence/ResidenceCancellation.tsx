import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import residenceService from '../../services/residenceService';
import { accountsService } from '../../services/accountsService';
import Modal from '../../components/common/Modal';
import './ResidenceCancellation.css';

interface Cancellation {
  residence: number;
  passenger_name: string;
  customer_name: string;
  company_name: string;
  cancellation_charges: number;
  currency_name: string;
  datetime: string;
  internal_processed: number;
  internal_net_cost?: number;
  internal_account_name?: string;
}

interface CancellationDetails {
  residence: number;
  passenger_name: string;
  customer_name: string;
  company_name: string;
  cancellation_charges: number;
  currency_name: string;
  datetime: string;
}

export default function ResidenceCancellation() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [toDate, setToDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [processingModalOpen, setProcessingModalOpen] = useState(false);
  const [selectedCancellation, setSelectedCancellation] = useState<Cancellation | null>(null);
  const [cancellationDetails, setCancellationDetails] = useState<CancellationDetails | null>(null);
  const [internalNetCost, setInternalNetCost] = useState<string>('');
  const [internalAccount, setInternalAccount] = useState<string>('');
  const [internalRemarks, setInternalRemarks] = useState<string>('');
  const [setupWarning, setSetupWarning] = useState(false);

  // Load accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsService.getAccounts(),
  });

  // Load cancellations
  const { data: cancellationsData, isLoading, refetch } = useQuery({
    queryKey: ['cancellations', statusFilter, fromDate, toDate],
    queryFn: () => residenceService.getCancellationsForInternalProcessing({
      statusFilter,
      fromDate,
      toDate,
    }),
    enabled: true,
  });

  // Handle different response formats
  const cancellations: Cancellation[] = Array.isArray(cancellationsData?.data) 
    ? cancellationsData.data 
    : Array.isArray(cancellationsData) 
      ? cancellationsData 
      : [];
  const hasSetupError = cancellationsData?.hasSetupError || false;

  useEffect(() => {
    if (hasSetupError) {
      setSetupWarning(true);
    } else {
      setSetupWarning(false);
    }
  }, [hasSetupError]);

  const handleLoadCancellations = () => {
    refetch();
  };

  const handleOpenProcessingModal = async (cancellation: Cancellation) => {
    setSelectedCancellation(cancellation);
    setInternalNetCost('');
    setInternalAccount('');
    setInternalRemarks('');

    try {
      const details = await residenceService.getCancellationDetails(cancellation.residence);
      setCancellationDetails(details.data || details);
      setProcessingModalOpen(true);
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to load cancellation details', 'error');
    }
  };

  const handleCloseProcessingModal = () => {
    setProcessingModalOpen(false);
    setSelectedCancellation(null);
    setCancellationDetails(null);
    setInternalNetCost('');
    setInternalAccount('');
    setInternalRemarks('');
  };

  const handleProcessInternalCancellation = async () => {
    if (!selectedCancellation) return;

    if (!internalNetCost || parseFloat(internalNetCost) < 0) {
      Swal.fire('Error', 'Please enter a valid net cost', 'error');
      return;
    }

    if (!internalAccount) {
      Swal.fire('Error', 'Please select an account', 'error');
      return;
    }

    try {
      await residenceService.processInternalCancellation({
        residenceId: selectedCancellation.residence,
        netCost: parseFloat(internalNetCost),
        account: parseInt(internalAccount),
        remarks: internalRemarks,
      });

      Swal.fire('Success', 'Internal cancellation processed successfully!', 'success');
      handleCloseProcessingModal();
      refetch();
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to process internal cancellation', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AE', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AE', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="residence-cancellation-page">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="card" style={{ marginLeft: '30px', marginRight: '30px', marginTop: '10px' }}>
              <div className="card-header bg-dark text-white" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>
                  <i className="fa fa-building"></i>{' '}
                  <i>Residence Cancellation Management - Internal Processing</i>
                </h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/residence/tasks')}
                  style={{ marginLeft: '15px' }}
                >
                  <i className="fa fa-arrow-left"></i> Back
                </button>
              </div>

              <div className="card-body">
                <div className="alert alert-info">
                  <i className="fa fa-info-circle"></i> <strong>Purpose:</strong>
                  This page handles the internal processing of residence cancellations. Here you can record the actual costs
                  incurred by the company and specify which account should bear these costs.
                </div>

                {setupWarning && (
                  <div className="alert alert-warning">
                    <i className="fa fa-exclamation-triangle"></i> <strong>Database Setup Required:</strong>
                    Please run the <code>create_refund_system.sql</code> script to add the required database columns for internal processing.
                    <br />
                    <small>This message will disappear once the database is properly set up.</small>
                  </div>
                )}

                {/* Filter Section */}
                <div className="row mb-3">
                  <div className="col-md-3">
                    <label>Status:</label>
                    <select
                      className="form-control"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="pending">Pending Internal Processing</option>
                      <option value="processed">Processed</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label>From Date:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label>To Date:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label>&nbsp;</label>
                    <br />
                    <button type="button" className="btn btn-primary" onClick={handleLoadCancellations}>
                      <i className="fa fa-search"></i> Load Cancellations
                    </button>
                  </div>
                </div>

                {/* Cancellations Table */}
                <div className="row">
                  <div className="col-md-12">
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead className="bg-dark text-white">
                          <tr>
                            <th>Residence ID</th>
                            <th>Passenger Name</th>
                            <th>Customer</th>
                            <th>Company</th>
                            <th>Cancellation Charges</th>
                            <th>Cancelled Date</th>
                            <th>Status</th>
                            <th>Internal Cost</th>
                            <th>Account</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoading ? (
                            <tr>
                              <td colSpan={10} className="text-center">
                                <i className="fa fa-spinner fa-spin"></i> Loading cancellations...
                              </td>
                            </tr>
                          ) : hasSetupError ? (
                            <tr>
                              <td colSpan={10} className="text-center text-warning">
                                <i className="fa fa-database"></i> <strong>Database Setup Required:</strong>
                                <br />
                                Please run the database setup script first.
                              </td>
                            </tr>
                          ) : cancellations.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="text-center text-info">
                                <i className="fa fa-info-circle"></i> No cancellations found for the selected criteria.
                              </td>
                            </tr>
                          ) : (
                            cancellations.map((cancellation) => {
                              const isProcessed = cancellation.internal_processed === 1;
                              const rowClass = isProcessed ? 'table-success' : 'table-warning';

                              return (
                                <tr key={cancellation.residence} className={rowClass}>
                                  <td>
                                    <strong>{cancellation.residence}</strong>
                                  </td>
                                  <td>{cancellation.passenger_name}</td>
                                  <td>{cancellation.customer_name}</td>
                                  <td>
                                    <span className="badge bg-info">{cancellation.company_name}</span>
                                  </td>
                                  <td>
                                    <strong>
                                      {parseFloat(cancellation.cancellation_charges.toString()).toLocaleString()}{' '}
                                      {cancellation.currency_name}
                                    </strong>
                                  </td>
                                  <td>{formatDate(cancellation.datetime)}</td>
                                  <td>
                                    {isProcessed ? (
                                      <span className="badge bg-success">Processed</span>
                                    ) : (
                                      <span className="badge bg-warning">Pending</span>
                                    )}
                                  </td>
                                  <td>
                                    {isProcessed ? (
                                      <>
                                        {parseFloat(cancellation.internal_net_cost?.toString() || '0').toLocaleString()} AED
                                      </>
                                    ) : (
                                      <span className="text-muted">Not processed</span>
                                    )}
                                  </td>
                                  <td>
                                    {isProcessed ? (
                                      cancellation.internal_account_name
                                    ) : (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                  <td>
                                    {isProcessed ? (
                                      <span className="text-success">
                                        <i className="fa fa-check"></i> Complete
                                      </span>
                                    ) : (
                                      <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleOpenProcessingModal(cancellation)}
                                      >
                                        <i className="fa fa-cogs"></i> Process
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Processing Modal */}
      <Modal
        isOpen={processingModalOpen}
        onClose={handleCloseProcessingModal}
        title="Internal Cancellation Processing"
        size="lg"
      >
        {cancellationDetails && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessInternalCancellation();
            }}
          >
            {/* Cancellation Info */}
            <div className="alert alert-secondary">
              <h6>
                <i className="fa fa-info-circle"></i> Cancellation Details
              </h6>
              <div className="row">
                <div className="col-md-6">
                  <strong>Passenger:</strong> <span>{cancellationDetails.passenger_name}</span>
                  <br />
                  <strong>Customer:</strong> <span>{cancellationDetails.customer_name}</span>
                  <br />
                  <strong>Company:</strong> <span>{cancellationDetails.company_name}</span>
                </div>
                <div className="col-md-6">
                  <strong>Cancellation Charges:</strong>{' '}
                  <span>
                    {parseFloat(cancellationDetails.cancellation_charges.toString()).toLocaleString()}{' '}
                    {cancellationDetails.currency_name}
                  </span>
                  <br />
                  <strong>Cancelled Date:</strong> <span>{formatDateTime(cancellationDetails.datetime)}</span>
                </div>
              </div>
            </div>

            {/* Internal Processing Fields */}
            <div className="form-group row mb-3">
              <label htmlFor="internalNetCost" className="col-sm-4 col-form-label">
                Actual Net Cost: <span className="text-danger">*</span>
              </label>
              <div className="col-sm-8">
                <input
                  type="number"
                  className="form-control"
                  id="internalNetCost"
                  value={internalNetCost}
                  onChange={(e) => setInternalNetCost(e.target.value)}
                  placeholder="Enter actual cost incurred by company"
                  min="0"
                  step="0.01"
                  required
                />
                <small className="text-muted">The actual amount it cost the company to process this cancellation</small>
              </div>
            </div>

            <div className="form-group row mb-3">
              <label htmlFor="internalAccount" className="col-sm-4 col-form-label">
                Debit Account: <span className="text-danger">*</span>
              </label>
              <div className="col-sm-8">
                <select
                  className="form-control"
                  id="internalAccount"
                  value={internalAccount}
                  onChange={(e) => setInternalAccount(e.target.value)}
                  required
                >
                  <option value="">--Select Account to Debit--</option>
                  {accounts.map((account: any) => (
                    <option key={account.account_ID || account.accountID} value={account.account_ID || account.accountID}>
                      {account.account_Name || account.accountName}
                    </option>
                  ))}
                </select>
                <small className="text-muted">The company account from which cancellation costs will be deducted</small>
              </div>
            </div>

            <div className="form-group row mb-3">
              <label htmlFor="internalRemarks" className="col-sm-4 col-form-label">
                Internal Remarks:
              </label>
              <div className="col-sm-8">
                <textarea
                  className="form-control"
                  id="internalRemarks"
                  value={internalRemarks}
                  onChange={(e) => setInternalRemarks(e.target.value)}
                  rows={3}
                  placeholder="Internal notes about this cancellation processing"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseProcessingModal}>
                <i className="fa fa-times"></i> Cancel
              </button>
              <button type="submit" className="btn btn-success">
                <i className="fa fa-check"></i> Process Internal Cancellation
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

