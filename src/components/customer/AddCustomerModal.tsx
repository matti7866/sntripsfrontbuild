import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { customerService } from '../../services/customerService';
import apiClient from '../../services/api';
import SearchableSelect from '../form/SearchableSelect';
import PhoneInput from '../form/PhoneInput';
import type { CreateCustomerRequest, Customer } from '../../types/customer';

interface Supplier {
  supp_id: number;
  supp_name: string;
}

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customer: Customer) => void;
}

export default function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
  const [formData, setFormData] = useState<Partial<CreateCustomerRequest>>({
    customer_name: '',
    customer_phone: '',
    customer_whatsapp: '',
    customer_address: '',
    customer_email: '',
    customer_password: '',
    customer_status: 1,
    supplier_id: -1
  });
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Load suppliers for dropdown
  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ['suppliers-dropdown'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/payment/dropdowns.php?type=suppliers');
        return response.data.success ? response.data.data.suppliers || [] : [];
      } catch (error) {
        return [];
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false
  });
  
  // Add customer mutation
  const addCustomerMutation = useMutation({
    mutationFn: (data: CreateCustomerRequest) => customerService.addCustomer(data),
    onSuccess: (result, variables) => {
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'New customer added successfully',
        timer: 1500,
        showConfirmButton: false
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['service-dropdowns'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-dropdowns'] });
      resetForm();
      onClose();
      
      // Call onSuccess callback with the new customer data if provided
      if (onSuccess) {
        // We'll need to fetch the customer to get the full data including ID
        // For now, we'll pass a partial customer object
        const newCustomer: Partial<Customer> = {
          customer_name: variables.customer_name,
          customer_phone: variables.customer_phone,
          customer_whatsapp: variables.customer_whatsapp,
          customer_email: variables.customer_email,
          customer_address: variables.customer_address,
          status: variables.customer_status
        };
        onSuccess(newCustomer as Customer);
      }
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to add customer'
      });
    }
  });
  
  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_whatsapp: '',
      customer_address: '',
      customer_email: '',
      customer_password: '',
      customer_status: 1,
      supplier_id: -1
    });
  };
  
  // Check for duplicate customers by name
  const checkForDuplicates = async (customerName: string): Promise<Customer[]> => {
    try {
      const response = await customerService.getCustomers({
        filter_name: customerName,
        page: 1,
        per_page: 10
      });
      
      // Normalize names for comparison (case-insensitive, trim whitespace)
      const normalizedInput = customerName.toLowerCase().trim();
      
      // Filter for similar names
      const similarCustomers = response.data.filter(customer => {
        const normalizedCustomer = customer.customer_name.toLowerCase().trim();
        
        // Exact match
        if (normalizedCustomer === normalizedInput) {
          return true;
        }
        
        // Check if one contains the other (for partial matches)
        if (normalizedCustomer.includes(normalizedInput) || normalizedInput.includes(normalizedCustomer)) {
          return true;
        }
        
        // Check similarity using Levenshtein distance (for typos)
        const similarity = calculateSimilarity(normalizedCustomer, normalizedInput);
        if (similarity > 0.8) {
          return true;
        }
        
        return false;
      });
      
      return similarCustomers;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return [];
    }
  };
  
  // Calculate similarity between two strings (0-1)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    // Use Levenshtein distance
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };
  
  // Calculate Levenshtein distance between two strings
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.customer_name.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error!',
        text: 'Customer name is required'
      });
      return;
    }
    
    const customerName = formData.customer_name.trim();
    
    // Check for duplicates before submitting
    setCheckingDuplicate(true);
    try {
      const duplicates = await checkForDuplicates(customerName);
      
      if (duplicates.length > 0) {
        setCheckingDuplicate(false);
        
        // Show duplicate warning with customer details
        const duplicateList = duplicates.map((dup, index) => 
          `${index + 1}. ${dup.customer_name}${dup.customer_phone ? ` (${dup.customer_phone})` : ''}`
        ).join('\n');
        
        const result = await Swal.fire({
          title: 'Similar Customer Found',
          html: `Found ${duplicates.length} similar customer(s):<br><br><pre style="text-align: left; font-size: 14px;">${duplicateList}</pre><br>Is this the same person?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, Same Person',
          cancelButtonText: 'No, New Customer',
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#6c757d'
        });
        
        if (result.isConfirmed) {
          // User confirmed it's the same person, don't add
          Swal.fire({
            icon: 'info',
            title: 'Customer Not Added',
            text: 'Please select the existing customer from the list instead.',
            timer: 2000,
            showConfirmButton: false
          });
          return;
        }
        
        // User confirmed it's a new customer, proceed with adding
      }
      
      // Prepare data for submission
      const submitData: CreateCustomerRequest = {
        customer_name: customerName,
        customer_phone: formData.customer_phone || '',
        customer_whatsapp: formData.customer_whatsapp || '',
        customer_address: formData.customer_address || '',
        customer_email: formData.customer_email || '',
        customer_password: formData.customer_password || '',
        customer_status: formData.customer_status || 1,
        supplier_id: formData.supplier_id === -1 ? null : (formData.supplier_id || null)
      };
      
      addCustomerMutation.mutate(submitData);
    } catch (error) {
      console.error('Error checking duplicates:', error);
      setCheckingDuplicate(false);
      // Continue with submission even if duplicate check fails
      const submitData: CreateCustomerRequest = {
        customer_name: customerName,
        customer_phone: formData.customer_phone || '',
        customer_whatsapp: formData.customer_whatsapp || '',
        customer_address: formData.customer_address || '',
        customer_email: formData.customer_email || '',
        customer_password: formData.customer_password || '',
        customer_status: formData.customer_status || 1,
        supplier_id: formData.supplier_id === -1 ? null : (formData.supplier_id || null)
      };
      addCustomerMutation.mutate(submitData);
    } finally {
      setCheckingDuplicate(false);
    }
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <i className="fa fa-user-plus me-2"></i>
            Add New Customer
          </h3>
          <button
            type="button"
            className="btn-close"
            onClick={handleClose}
          >×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <i className="fa fa-user me-2"></i>Customer Name: <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="customer_name"
                  value={formData.customer_name || ''}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Customer Name"
                  required
                  disabled={checkingDuplicate || addCustomerMutation.isPending}
                />
              </div>
              <div className="form-group">
                <PhoneInput
                  label="Customer Phone"
                  value={formData.customer_phone || ''}
                  onChange={(value) => setFormData({ ...formData, customer_phone: value })}
                  placeholder="971 XX XXX XXXX"
                  showValidation={true}
                  disabled={checkingDuplicate || addCustomerMutation.isPending}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <i className="fa fa-whatsapp me-2"></i>Customer Whatsapp:
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="customer_whatsapp"
                  value={formData.customer_whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, customer_whatsapp: e.target.value })}
                  placeholder="Customer Whatsapp"
                  disabled={checkingDuplicate || addCustomerMutation.isPending}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <i className="fa fa-envelope me-2"></i>Customer Email:
                </label>
                <input
                  type="email"
                  className="form-control"
                  name="customer_email"
                  value={formData.customer_email || ''}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  placeholder="Customer Email"
                  disabled={checkingDuplicate || addCustomerMutation.isPending}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <i className="fa fa-address-card me-2"></i>Customer Address:
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="customer_address"
                  value={formData.customer_address || ''}
                  onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                  placeholder="Customer Address"
                  disabled={checkingDuplicate || addCustomerMutation.isPending}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <i className="fa fa-key me-2"></i>Customer Password:
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="customer_password"
                  value={formData.customer_password || ''}
                  onChange={(e) => setFormData({ ...formData, customer_password: e.target.value })}
                  placeholder="Customer Password (leave empty for default)"
                  disabled={checkingDuplicate || addCustomerMutation.isPending}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <i className="fa fa-toggle-on me-2"></i>Customer Status:
                </label>
                <select
                  className="form-control"
                  name="customer_status"
                  value={formData.customer_status || 1}
                  onChange={(e) => setFormData({ ...formData, customer_status: Number(e.target.value) })}
                  disabled={checkingDuplicate || addCustomerMutation.isPending}
                >
                  <option value="1">Active</option>
                  <option value="2">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <i className="fa fa-user me-2"></i>Affiliate Supplier:
                </label>
                <SearchableSelect
                  options={[
                    { value: '-1', label: '--Supplier--' },
                    ...(suppliers?.map(s => ({
                      value: String(s.supp_id),
                      label: s.supp_name
                    })) || [])
                  ]}
                  value={formData.supplier_id ? String(formData.supplier_id) : '-1'}
                  onChange={(value) => setFormData({ ...formData, supplier_id: value ? Number(value) : -1 })}
                  placeholder="Select Supplier"
                  disabled={checkingDuplicate || addCustomerMutation.isPending}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={checkingDuplicate || addCustomerMutation.isPending}
              >
                Close
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={checkingDuplicate || addCustomerMutation.isPending}
              >
                {checkingDuplicate ? (
                  <>
                    <i className="fa fa-spinner fa-spin me-2"></i>
                    Checking...
                  </>
                ) : addCustomerMutation.isPending ? (
                  <>
                    <i className="fa fa-spinner fa-spin me-2"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fa fa-save me-2"></i>
                    Add Customer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
