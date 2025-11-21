import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import currencyService from '../../services/currencyService';
import type { Currency as CurrencyType } from '../../services/currencyService';
import Modal from '../../components/common/Modal';
import './Currency.css';

export default function Currency() {
  const queryClient = useQueryClient();
  const [currencyName, setCurrencyName] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<{ id: number; name: string } | null>(null);
  const [editCurrencyName, setEditCurrencyName] = useState('');

  // Fetch currencies
  const { data: currencies = [], isLoading } = useQuery<CurrencyType[]>({
    queryKey: ['currencies'],
    queryFn: () => currencyService.getCurrencies(),
    staleTime: 30000
  });

  // Add currency mutation
  const addCurrencyMutation = useMutation({
    mutationFn: (name: string) => currencyService.addCurrency(name),
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Currency added successfully',
        timer: 1500,
        showConfirmButton: false
      });
      setCurrencyName('');
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message || 'Failed to add currency'
      });
    }
  });

  // Update currency mutation
  const updateCurrencyMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => 
      currencyService.updateCurrency(id, name),
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Currency updated successfully',
        timer: 1500,
        showConfirmButton: false
      });
      setEditModalOpen(false);
      setEditingCurrency(null);
      setEditCurrencyName('');
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message || 'Failed to update currency'
      });
    }
  });

  // Delete currency mutation
  const deleteCurrencyMutation = useMutation({
    mutationFn: (id: number) => currencyService.deleteCurrency(id),
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Currency deleted successfully',
        timer: 1500,
        showConfirmButton: false
      });
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message || 'Failed to delete currency'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currencyName || currencyName.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error!',
        text: 'Currency name is required'
      });
      return;
    }
    
    addCurrencyMutation.mutate(currencyName.trim());
  };

  const handleEdit = (currency: CurrencyType) => {
    setEditingCurrency({ id: currency.currencyID, name: currency.currencyName });
    setEditCurrencyName(currency.currencyName);
    setEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!editingCurrency) return;
    
    if (!editCurrencyName || editCurrencyName.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Currency name is required'
      });
      return;
    }
    
    updateCurrencyMutation.mutate({
      id: editingCurrency.id,
      name: editCurrencyName.trim()
    });
  };

  const handleDelete = (currency: CurrencyType) => {
    Swal.fire({
      title: 'Delete!',
      text: `Do you want to delete currency "${currency.currencyName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteCurrencyMutation.mutate(currency.currencyID);
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  if (isLoading) {
    return (
      <div className="currency-page">
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="currency-page">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="card w3-card-24" id="todaycard">
              <div className="card-header bg-dark">
                <h1 className="text-white text-center">
                  <b>
                    <i className="fa fa-exchange-alt"></i> Currency
                  </b>
                </h1>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row align-items-center">
                    <div className="col-md-3">
                      <label className="sr-only" htmlFor="currency_name">
                        Currency Name
                      </label>
                      <div className="input-group mb-2">
                        <div className="input-group-prepend">
                          <div className="input-group-text">
                            <i className="fa fa-exchange-alt"></i>
                          </div>
                        </div>
                        <input
                          type="text"
                          className="form-control"
                          name="currency_name"
                          id="currency_name"
                          value={currencyName}
                          onChange={(e) => setCurrencyName(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Currency Name"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <button
                        type="submit"
                        className="btn btn-dark mb-2"
                        disabled={addCurrencyMutation.isPending}
                      >
                        {addCurrencyMutation.isPending ? (
                          <>
                            <i className="fa fa-spinner fa-spin"></i> Saving...
                          </>
                        ) : (
                          <>
                            <i className="fa fa-plus"></i> Save
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
                <br />
                <br />
                <div className="row">
                  <div className="col-md-12">
                    <div className="table-responsive">
                      <table
                        id="myTable"
                        className="table text-center table-striped table-hover"
                      >
                        <thead className="thead-dark bg-black text-white" style={{ fontSize: '14px' }}>
                          <tr>
                            <th>S#</th>
                            <th>Currency Name</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody id="CurrencyReportTbl">
                          {currencies.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="text-center">
                                No currencies found
                              </td>
                            </tr>
                          ) : (
                            currencies.map((currency, index) => (
                              <tr key={currency.currencyID}>
                                <th scope="row">{index + 1}</th>
                                <td className="text-capitalize" style={{ fontSize: '15px' }}>
                                  <b>{currency.currencyName}</b>
                                </td>
                                <td className="float-center">
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(currency)}
                                    className="btn"
                                    style={{ marginRight: '10px' }}
                                  >
                                    <i className="fa fa-edit text-info fa-2x" aria-hidden="true"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(currency)}
                                    className="btn"
                                  >
                                    <i className="fa fa-trash text-danger fa-2x" aria-hidden="true"></i>
                                  </button>
                                </td>
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

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingCurrency(null);
          setEditCurrencyName('');
        }}
        title="Update Currency"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
          <div className="row">
            <div className="col-md-12">
              <label className="sr-only" htmlFor="updcurrency_name">
                Currency Name
              </label>
              <div className="input-group mb-2">
                <input
                  type="text"
                  className="form-control"
                  name="updcurrency_name"
                  id="updcurrency_name"
                  value={editCurrencyName}
                  onChange={(e) => setEditCurrencyName(e.target.value)}
                  placeholder="Currency Name"
                  autoFocus
                />
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditModalOpen(false);
                setEditingCurrency(null);
                setEditCurrencyName('');
              }}
            >
              Close
            </button>
            <button
              type="submit"
              className="btn btn-info"
              disabled={updateCurrencyMutation.isPending}
            >
              {updateCurrencyMutation.isPending ? (
                <>
                  <i className="fa fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

