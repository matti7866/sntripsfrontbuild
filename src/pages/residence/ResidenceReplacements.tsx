import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import residenceService from '../../services/residenceService';
import './ResidenceReplacements.css';

interface Replacement {
  residenceID: number;
  passenger_name: string;
  customer_name: string;
  company_name: string;
  sale_price: number;
  currencyName: string;
  completedStep: number;
  created_on: string;
  completed_date?: string;
  replacement_status?: string;
}

export default function ResidenceReplacements() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'inprocess' | 'completed'>('inprocess');
  const queryClient = useQueryClient();

  // Fetch in-process replacements
  const { data: inProcessData, isLoading: loadingInProcess } = useQuery({
    queryKey: ['replacements', 'inprocess'],
    queryFn: () => residenceService.getReplacements('inprocess'),
  });

  // Fetch completed replacements
  const { data: completedData, isLoading: loadingCompleted } = useQuery({
    queryKey: ['replacements', 'completed'],
    queryFn: () => residenceService.getReplacements('completed'),
  });

  const inProcessReplacements: Replacement[] = Array.isArray(inProcessData?.data)
    ? inProcessData.data
    : Array.isArray(inProcessData)
      ? inProcessData
      : [];

  const completedReplacements: Replacement[] = Array.isArray(completedData?.data)
    ? completedData.data
    : Array.isArray(completedData)
      ? completedData
      : [];

  // Mutation for marking as complete
  const markAsCompleteMutation = useMutation({
    mutationFn: async (residenceID: number) => {
      const response = await residenceService.markReplacementAsComplete(residenceID);
      // Check if the response indicates success
      if (response.status === 'success') {
        return response;
      } else {
        throw new Error(response.message || 'Failed to update record');
      }
    },
    onSuccess: () => {
      // Invalidate both queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['replacements'] });
      Swal.fire('Success', 'Record marked as completed', 'success');
    },
    onError: (error: any) => {
      Swal.fire('Error', error.message || error.response?.data?.message || 'Failed to update record', 'error');
    },
  });

  const handleMarkAsComplete = async (residenceID: number) => {
    const result = await Swal.fire({
      title: 'Confirm Completion',
      text: 'Are you sure you want to mark this replacement as completed?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, mark as complete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      markAsCompleteMutation.mutate(residenceID);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return `${parseFloat(price.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  return (
    <div className="residence-replacements-page">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="panel">
              <div className="panel-heading bg-inverse text-white" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 className="panel-title" style={{ margin: 0 }}>
                  <i className="fa fa-exchange"></i> Residence Replacements
                </h4>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/residence/tasks')}
                  style={{ marginLeft: '15px' }}
                >
                  <i className="fa fa-arrow-left"></i> Back
                </button>
              </div>
              <div className="panel-body p-0">
                {/* Tabs navigation */}
                <ul className="nav nav-tabs" id="myTab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'inprocess' ? 'active' : ''}`}
                      onClick={() => setActiveTab('inprocess')}
                      type="button"
                    >
                      In Process{' '}
                      <span className="badge bg-primary">{inProcessReplacements.length}</span>
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'completed' ? 'active' : ''}`}
                      onClick={() => setActiveTab('completed')}
                      type="button"
                    >
                      Completed{' '}
                      <span className="badge bg-success">{completedReplacements.length}</span>
                    </button>
                  </li>
                </ul>

                {/* Tab content */}
                <div className="tab-content" id="myTabContent">
                  {/* In Process Tab */}
                  <div
                    className={`tab-pane fade ${activeTab === 'inprocess' ? 'show active' : ''}`}
                    id="inprocess"
                    role="tabpanel"
                  >
                    <div className="table-responsive">
                      <table className="table table-bordered align-middle mb-0" id="replacedTableInProcess">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Passenger</th>
                            <th>Customer</th>
                            <th>Company</th>
                            <th>Sale Price</th>
                            <th>Created On</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingInProcess ? (
                            <tr>
                              <td colSpan={7} className="text-center">
                                <i className="fa fa-spinner fa-spin"></i> Loading...
                              </td>
                            </tr>
                          ) : inProcessReplacements.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center">
                                No in-process replacement records found.
                              </td>
                            </tr>
                          ) : (
                            inProcessReplacements.map((replacement, index) => (
                              <tr key={replacement.residenceID}>
                                <td>{index + 1}</td>
                                <td>{replacement.passenger_name}</td>
                                <td>{replacement.customer_name}</td>
                                <td>{replacement.company_name || '-'}</td>
                                <td>{formatPrice(replacement.sale_price, replacement.currencyName)}</td>
                                <td>{replacement.created_on}</td>
                                <td>
                                  <div className="btn-group">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-success"
                                      onClick={() => handleMarkAsComplete(replacement.residenceID)}
                                      disabled={markAsCompleteMutation.isPending}
                                    >
                                      <i className="fa fa-check"></i>{' '}
                                      {markAsCompleteMutation.isPending ? 'Processing...' : 'Mark as Complete'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Completed Tab */}
                  <div
                    className={`tab-pane fade ${activeTab === 'completed' ? 'show active' : ''}`}
                    id="completed"
                    role="tabpanel"
                  >
                    <div className="table-responsive">
                      <table className="table table-bordered align-middle mb-0" id="replacedTableCompleted">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Passenger</th>
                            <th>Customer</th>
                            <th>Company</th>
                            <th>Sale Price</th>
                            <th>Created On</th>
                            <th>Completed On</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingCompleted ? (
                            <tr>
                              <td colSpan={7} className="text-center">
                                <i className="fa fa-spinner fa-spin"></i> Loading...
                              </td>
                            </tr>
                          ) : completedReplacements.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center">
                                No completed replacement records found.
                              </td>
                            </tr>
                          ) : (
                            completedReplacements.map((replacement, index) => (
                              <tr key={replacement.residenceID}>
                                <td>{index + 1}</td>
                                <td>{replacement.passenger_name}</td>
                                <td>{replacement.customer_name}</td>
                                <td>{replacement.company_name || '-'}</td>
                                <td>{formatPrice(replacement.sale_price, replacement.currencyName)}</td>
                                <td>{replacement.created_on}</td>
                                <td>{replacement.completed_date || '-'}</td>
                              </tr>
                            ))
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
    </div>
  );
}

