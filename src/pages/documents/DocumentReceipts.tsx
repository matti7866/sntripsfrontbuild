import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';
import documentReceiptService from '../../services/documentReceiptService';
import type {
  DocumentReceipt,
  CreateDocumentReceiptRequest,
  DocumentReceiptFilters,
  DocumentType,
  DocumentTypeOption
} from '../../types/documentReceipt';
import { useAuth } from '../../context/AuthContext';
import './DocumentReceipts.css';

export default function DocumentReceipts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  // State
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<DocumentReceipt | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'received' | 'returned'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'with_company' | 'with_customer'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newTypeName, setNewTypeName] = useState('');

  // Form states for receiving documents
  const [receiveFormData, setReceiveFormData] = useState({
    customer_id: 0,
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    transaction_date: new Date().toISOString().slice(0, 16),
    label: '',
    notes: '',
    document_types: [{ document_type_name: '', quantity: 1, description: '' }] as Omit<DocumentType, 'id' | 'receipt_id'>[]
  });

  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Form states for returning documents
  const [returnFormData, setReturnFormData] = useState({
    original_receipt_id: 0,
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    transaction_date: new Date().toISOString().slice(0, 16),
    notes: ''
  });

  const itemsPerPage = 20;

  // Build filters
  const filters: DocumentReceiptFilters = useMemo(() => ({
    search: searchTerm,
    transaction_type: transactionTypeFilter === 'all' ? undefined : transactionTypeFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    from_date: dateFrom || undefined,
    to_date: dateTo || undefined,
    page: currentPage,
    limit: itemsPerPage
  }), [searchTerm, transactionTypeFilter, statusFilter, dateFrom, dateTo, currentPage]);

  // Fetch receipts
  const { data: receiptsData, isLoading, refetch, error: receiptsError } = useQuery({
    queryKey: ['document-receipts', filters],
    queryFn: async () => {
      console.log('Fetching receipts with filters:', filters);
      const result = await documentReceiptService.getDocumentReceipts(filters);
      console.log('Receipts result:', result);
      return result;
    },
    staleTime: 30000
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['document-receipts-stats'],
    queryFn: () => documentReceiptService.getStats(),
    staleTime: 60000
  });

  // Fetch document type options
  const { data: documentTypeOptions = [], refetch: refetchTypes } = useQuery<DocumentTypeOption[]>({
    queryKey: ['document-type-options'],
    queryFn: () => documentReceiptService.getDocumentTypeOptions(),
    staleTime: 300000
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-dropdown'],
    queryFn: () => documentReceiptService.getCustomers(),
    staleTime: 300000
  });

  // Fetch available receipts for return
  const { data: availableForReturn = [], refetch: refetchAvailable } = useQuery<DocumentReceipt[]>({
    queryKey: ['available-for-return'],
    queryFn: () => documentReceiptService.getAvailableForReturn(),
    enabled: showReturnModal,
    staleTime: 10000
  });

  // Create receipt mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateDocumentReceiptRequest) => documentReceiptService.createDocumentReceipt(data),
    onSuccess: (response) => {
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: response.message,
          confirmButtonText: 'OK'
        }).then(() => {
          setShowReceiveModal(false);
          setShowReturnModal(false);
          resetReceiveForm();
          resetReturnForm();
          refetch();
          queryClient.invalidateQueries({ queryKey: ['document-receipts-stats'] });
        });
      } else {
        Swal.fire('Error', response.message, 'error');
      }
    },
    onError: (error: any) => {
      Swal.fire('Error', error.response?.data?.message || 'Failed to create receipt', 'error');
    }
  });

  // Delete receipt mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentReceiptService.deleteDocumentReceipt(id),
    onSuccess: (response) => {
      if (response.success) {
        Swal.fire('Success', response.message, 'success');
        refetch();
        queryClient.invalidateQueries({ queryKey: ['document-receipts-stats'] });
      } else {
        Swal.fire('Error', response.message, 'error');
      }
    },
    onError: (error: any) => {
      Swal.fire('Error', error.response?.data?.message || 'Failed to delete receipt', 'error');
    }
  });

  // Add document type mutation
  const addTypeMutation = useMutation({
    mutationFn: (typeName: string) => documentReceiptService.addDocumentTypeOption(typeName),
    onSuccess: (response) => {
      if (response.success) {
        Swal.fire('Success', response.message, 'success');
        setNewTypeName('');
        refetchTypes();
      } else {
        Swal.fire('Error', response.message, 'error');
      }
    },
    onError: (error: any) => {
      Swal.fire('Error', error.response?.data?.message || 'Failed to add document type', 'error');
    }
  });

  // Reset forms
  const resetReceiveForm = () => {
    setReceiveFormData({
      customer_id: 0,
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      transaction_date: new Date().toISOString().slice(0, 16),
      label: '',
      notes: '',
      document_types: [{ document_type_name: '', quantity: 1, description: '' }]
    });
    setSelectedFiles([]);
    setIsNewCustomer(false);
  };

  const resetReturnForm = () => {
    setReturnFormData({
      original_receipt_id: 0,
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      transaction_date: new Date().toISOString().slice(0, 16),
      notes: ''
    });
    setSelectedFiles([]);
  };

  // Handle receive form
  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!receiveFormData.customer_name.trim()) {
      Swal.fire('Validation Error', 'Customer name is required', 'warning');
      return;
    }

    const validDocTypes = receiveFormData.document_types.filter(dt => dt.document_type_name.trim() && dt.quantity > 0);
    if (validDocTypes.length === 0) {
      Swal.fire('Validation Error', 'At least one document type is required', 'warning');
      return;
    }

    const requestData: CreateDocumentReceiptRequest = {
      customer_name: receiveFormData.customer_name,
      customer_phone: receiveFormData.customer_phone || undefined,
      customer_email: receiveFormData.customer_email || undefined,
      transaction_type: 'received',
      transaction_date: receiveFormData.transaction_date,
      document_types: validDocTypes,
      label: receiveFormData.label || undefined,
      notes: receiveFormData.notes || undefined,
      attachments: selectedFiles.length > 0 ? selectedFiles : undefined
    };

    createMutation.mutate(requestData);
  };

  // Handle return form
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!returnFormData.original_receipt_id) {
      Swal.fire('Validation Error', 'Please select a receipt to return', 'warning');
      return;
    }

    const originalReceipt = availableForReturn.find(r => r.id === returnFormData.original_receipt_id);
    if (!originalReceipt) {
      Swal.fire('Error', 'Original receipt not found', 'error');
      return;
    }

    const requestData: CreateDocumentReceiptRequest = {
      customer_name: returnFormData.customer_name,
      customer_phone: returnFormData.customer_phone || undefined,
      customer_email: returnFormData.customer_email || undefined,
      transaction_type: 'returned',
      transaction_date: returnFormData.transaction_date,
      document_types: originalReceipt.document_types.map(dt => ({
        document_type_name: dt.document_type_name,
        quantity: dt.quantity,
        description: dt.description
      })),
      notes: returnFormData.notes || undefined,
      original_receipt_id: returnFormData.original_receipt_id,
      attachments: selectedFiles.length > 0 ? selectedFiles : undefined
    };

    createMutation.mutate(requestData);
  };

  // Add document type row
  const addDocumentTypeRow = () => {
    setReceiveFormData({
      ...receiveFormData,
      document_types: [...receiveFormData.document_types, { document_type_name: '', quantity: 1, description: '' }]
    });
  };

  // Remove document type row
  const removeDocumentTypeRow = (index: number) => {
    const newDocTypes = receiveFormData.document_types.filter((_, i) => i !== index);
    setReceiveFormData({
      ...receiveFormData,
      document_types: newDocTypes.length > 0 ? newDocTypes : [{ document_type_name: '', quantity: 1, description: '' }]
    });
  };

  // Update document type
  const updateDocumentType = (index: number, field: keyof Omit<DocumentType, 'id' | 'receipt_id'>, value: any) => {
    const newDocTypes = [...receiveFormData.document_types];
    newDocTypes[index] = { ...newDocTypes[index], [field]: value };
    setReceiveFormData({ ...receiveFormData, document_types: newDocTypes });
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle delete
  const handleDelete = (receipt: DocumentReceipt) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Delete receipt ${receipt.receipt_number}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(receipt.id);
      }
    });
  };

  // Handle view
  const handleView = async (receipt: DocumentReceipt) => {
    try {
      const fullReceipt = await documentReceiptService.getDocumentReceipt(receipt.id);
      setSelectedReceipt(fullReceipt);
      setShowViewModal(true);
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Failed to load receipt details', 'error');
    }
  };

  const [printSize, setPrintSize] = useState<'A4' | 'A5'>('A4');

  // Handle print preview - show in same page
  const handlePrintPreview = () => {
    setShowViewModal(false);
    setShowPrintModal(true);
  };

  // Handle actual print
  const handlePrint = (size: 'A4' | 'A5') => {
    if (!printRef.current || !selectedReceipt) {
      Swal.fire('Error', 'Receipt content not found', 'error');
      return;
    }

    setPrintSize(size);
    
    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';
    
    document.body.appendChild(printFrame);
    
    const printDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!printDoc) {
      Swal.fire('Error', 'Could not create print window', 'error');
      return;
    }

    const printContent = printRef.current.innerHTML;

    printDoc.open();
    printDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Document Receipt ${selectedReceipt.receipt_number}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: ${size} portrait;
              margin: 5mm;
            }
            
            body {
              font-family: 'Poppins', Arial, sans-serif;
              font-size: 0.9rem;
              color: #000;
              background: white;
              padding: 0;
              margin: 0;
            }
            
            .page {
              display: block;
              width: ${size === 'A4' ? '8.27in' : '5.83in'};
              margin: 0 auto;
              background: white;
              border: 1px solid #000;
            }
            
            .header {
              display: flex;
              width: 100%;
              height: ${size === 'A4' ? '1.3in' : '1.2in'};
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid #000;
              padding: 10px 15px;
            }
            
            .logo-container {
              width: ${size === 'A4' ? '1.8in' : '1.5in'};
              background-color: #000;
              padding: 12px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .logo-container img {
              width: 100%;
              height: auto;
              max-width: 200px;
            }
            
            .heading {
              font-size: ${size === 'A4' ? '22px' : '20px'};
              font-weight: bold;
              text-align: center;
              flex: 1;
            }
            
            .heading span {
              padding: 8px 20px;
              border: 2px dashed #000;
              border-radius: 10px;
            }
            
            .qr {
              height: ${size === 'A4' ? '1.1in' : '1in'};
              width: ${size === 'A4' ? '1.1in' : '1in'};
            }
            
            .qr img {
              width: 100%;
              height: 100%;
            }
            
            .data {
              padding: ${size === 'A4' ? '15px 20px' : '20px'};
            }
            
            .row {
              margin-bottom: ${size === 'A4' ? '10px' : '15px'};
              display: flex;
            }
            
            .row .col {
              width: 33%;
              margin: 5px;
            }
            
            .col .label {
              background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
              padding: ${size === 'A4' ? '8px 10px' : '6px'};
              font-weight: 600;
              border-radius: 4px 4px 0 0;
              border: 1px solid #dee2e6;
              border-bottom: none;
              font-size: ${size === 'A4' ? '1.1rem' : '0.75rem'};
            }
            
            .col .value {
              padding: ${size === 'A4' ? '8px 10px' : '6px'};
              border: 1px solid #dee2e6;
              border-top: 2px solid #007bff;
              border-radius: 0 0 4px 4px;
              font-weight: 500;
              background: white;
              font-size: ${size === 'A4' ? '1.2rem' : '0.75rem'};
            }
            
            .col.col-full {
              width: 100%;
            }
            
            table {
              margin-top: ${size === 'A4' ? '12px' : '15px'};
              margin-bottom: ${size === 'A4' ? '12px' : '20px'};
              border: 2px solid #000;
              width: 100%;
              border-collapse: collapse;
            }
            
            table th {
              background: linear-gradient(to bottom, #e9ecef, #dee2e6);
              padding: ${size === 'A4' ? '10px 8px' : '8px'};
              text-align: center;
              font-weight: 700;
              border-bottom: 2px solid #000;
              font-size: ${size === 'A4' ? '1rem' : '0.7rem'};
            }
            
            table td {
              padding: ${size === 'A4' ? '8px 6px' : '8px'};
              text-align: center;
              border: 1px solid #dee2e6;
              font-size: ${size === 'A4' ? '0.95rem' : '0.7rem'};
            }
            
            table tbody tr:last-child td {
              font-weight: 700;
              background-color: #f8f9fa;
              font-size: ${size === 'A4' ? '1.05rem' : '0.7rem'};
            }
            
            table td.text-right {
              text-align: right;
            }
            
            .english, .arabic {
              margin-top: ${size === 'A4' ? '12px' : '15px'};
              font-style: italic;
              color: #555;
              text-align: center;
              font-size: ${size === 'A4' ? '0.95rem' : '0.8rem'};
            }
            
            .arabic {
              direction: rtl;
            }
            
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                margin: 0;
                padding: 0;
              }
              
              .page {
                border: 2px solid #000;
                box-shadow: none;
                margin: 0;
              }
              
              .logo-container {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                background-color: #000 !important;
              }
              
              table th {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printDoc.close();

    // Wait for content to load, then print
    setTimeout(() => {
      if (printFrame.contentWindow) {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      }
      
      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    }, 250);
  };

  // Generate QR Code URL
  const generateQRUrl = () => {
    if (!selectedReceipt) return '';
    const qrData = `Receipt: ${selectedReceipt.receipt_number} | Customer: ${selectedReceipt.customer_name} | Type: ${selectedReceipt.transaction_type}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}`;
  };

  // Select original receipt for return
  const handleSelectOriginalReceipt = (receiptId: number) => {
    const receipt = availableForReturn.find(r => r.id === receiptId);
    if (receipt) {
      setReturnFormData({
        original_receipt_id: receiptId,
        customer_name: receipt.customer_name,
        customer_phone: receipt.customer_phone || '',
        customer_email: receipt.customer_email || '',
        transaction_date: new Date().toISOString().slice(0, 16),
        notes: ''
      });
    }
  };

  // Add new document type
  const handleAddDocumentType = async () => {
    if (!newTypeName.trim()) {
      Swal.fire('Validation Error', 'Document type name is required', 'warning');
      return;
    }
    
    try {
      const result = await documentReceiptService.addDocumentTypeOption(newTypeName);
      if (result.success) {
        Swal.fire('Success', result.message, 'success');
        setNewTypeName('');
        refetchTypes();
      } else {
        Swal.fire('Error', result.message, 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to add document type', 'error');
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customerId: number) => {
    if (customerId === -1) {
      // New customer
      setIsNewCustomer(true);
      setReceiveFormData({
        ...receiveFormData,
        customer_id: 0,
        customer_name: '',
        customer_phone: '',
        customer_email: ''
      });
    } else {
      const customer = customers.find(c => c.customer_id === customerId);
      if (customer) {
        setIsNewCustomer(false);
        setReceiveFormData({
          ...receiveFormData,
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          customer_phone: customer.customer_phone || '',
          customer_email: customer.customer_email || ''
        });
      }
    }
  };

  const receipts = receiptsData?.data || [];
  const pagination = receiptsData?.pagination || { total: 0, page: 1, limit: itemsPerPage, totalPages: 1 };

  // Debug logging
  console.log('Receipts Data:', receiptsData);
  console.log('Receipts Array:', receipts);
  console.log('Is Loading:', isLoading);
  console.log('Receipts Error:', receiptsError);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="document-receipts-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-header mb-0">
          <i className="fas fa-file-contract me-2"></i>
          Document Receipt Management
        </h1>
        <div className="btn-group">
          <button
            className="btn btn-success"
            onClick={() => {
              resetReceiveForm();
              setShowReceiveModal(true);
            }}
          >
            <i className="fas fa-download me-2"></i>
            Receive Documents
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetReturnForm();
              refetchAvailable();
              setShowReturnModal(true);
            }}
          >
            <i className="fas fa-upload me-2"></i>
            Return Documents
          </button>
          <button
            className="btn btn-info"
            onClick={() => setShowTypeModal(true)}
          >
            <i className="fas fa-cog me-2"></i>
            Manage Types
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="row mb-4">
          <div className="col-xl-3 col-md-6">
            <div className="card bg-gradient-blue text-white mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="fs-16px">Total Received</div>
                    <div className="fs-28px fw-bold">{stats.total_received}</div>
                  </div>
                  <div className="text-white-transparent-5 fs-48px">
                    <i className="fas fa-download"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card bg-gradient-green text-white mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="fs-16px">Total Returned</div>
                    <div className="fs-28px fw-bold">{stats.total_returned}</div>
                  </div>
                  <div className="text-white-transparent-5 fs-48px">
                    <i className="fas fa-upload"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card bg-gradient-orange text-white mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="fs-16px">With Company</div>
                    <div className="fs-28px fw-bold">{stats.currently_with_company}</div>
                  </div>
                  <div className="text-white-transparent-5 fs-48px">
                    <i className="fas fa-building"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card bg-gradient-purple text-white mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="fs-16px">With Customer</div>
                    <div className="fs-28px fw-bold">{stats.currently_with_customer}</div>
                  </div>
                  <div className="text-white-transparent-5 fs-48px">
                    <i className="fas fa-user"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search customer name, receipt #..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={transactionTypeFilter}
                onChange={(e) => {
                  setTransactionTypeFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Transactions</option>
                <option value="received">Received</option>
                <option value="returned">Returned</option>
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="with_company">With Company</option>
                <option value="with_customer">With Customer</option>
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="From Date"
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="To Date"
              />
            </div>
            <div className="col-md-1">
              <button
                className="btn btn-secondary w-100"
                onClick={() => {
                  setSearchTerm('');
                  setTransactionTypeFilter('all');
                  setStatusFilter('all');
                  setDateFrom('');
                  setDateTo('');
                  setCurrentPage(1);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="card">
        <div className="card-body">
          {receiptsError && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Error loading receipts: {(receiptsError as any)?.message || 'Unknown error'}
            </div>
          )}
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fas fa-inbox fa-3x mb-3"></i>
              <p>No document receipts found</p>
              <small className="text-muted">
                Debug: Total in DB: {pagination.total}, Current filters active
              </small>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Customer</th>
                      <th>Transaction Type</th>
                      <th>Documents</th>
                      <th>Label</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Handled By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((receipt) => (
                      <tr key={receipt.id}>
                        <td>
                          <strong className="text-primary">{receipt.receipt_number}</strong>
                        </td>
                        <td>
                          <div>{receipt.customer_name}</div>
                          {receipt.customer_phone && (
                            <small className="text-muted">{receipt.customer_phone}</small>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${receipt.transaction_type === 'received' ? 'bg-success' : 'bg-info'}`}>
                            <i className={`fas fa-${receipt.transaction_type === 'received' ? 'download' : 'upload'} me-1`}></i>
                            {receipt.transaction_type === 'received' ? 'Received' : 'Returned'}
                          </span>
                        </td>
                        <td>
                          <div className="document-types-cell">
                            {receipt.document_types.slice(0, 2).map((dt, idx) => (
                              <div key={idx} className="small">
                                <i className="fas fa-file me-1"></i>
                                {dt.document_type_name} ({dt.quantity})
                              </div>
                            ))}
                            {receipt.document_types.length > 2 && (
                              <small className="text-muted">
                                +{receipt.document_types.length - 2} more
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          {receipt.label && (
                            <span className="badge bg-secondary">{receipt.label}</span>
                          )}
                        </td>
                        <td>
                          <small>{formatDate(receipt.transaction_date)}</small>
                        </td>
                        <td>
                          <span className={`badge ${receipt.status === 'with_company' ? 'bg-warning' : 'bg-success'}`}>
                            {receipt.status === 'with_company' ? 'With Company' : 'With Customer'}
                          </span>
                        </td>
                        <td>
                          <small>
                            {receipt.transaction_type === 'received' ? receipt.received_by : receipt.returned_by}
                          </small>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-info"
                              onClick={() => handleView(receipt)}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDelete(receipt)}
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} entries
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          </li>
                        );
                      })}
                      <li className={`page-item ${currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === pagination.totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Receive Documents Modal */}
      {showReceiveModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="fas fa-download me-2"></i>
                  Receive Documents
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowReceiveModal(false)}
                ></button>
              </div>
              <form onSubmit={handleReceiveSubmit}>
                <div className="modal-body">
                  {/* Customer Information */}
                  <div className="card mb-3">
                    <div className="card-header">
                      <h6 className="mb-0">Customer Information</h6>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-12">
                          <label className="form-label">Select Customer <span className="text-danger">*</span></label>
                          <select
                            className="form-select"
                            value={receiveFormData.customer_id || ''}
                            onChange={(e) => handleCustomerSelect(Number(e.target.value))}
                            required
                          >
                            <option value="">-- Select Customer --</option>
                            {customers.map((customer) => (
                              <option key={customer.customer_id} value={customer.customer_id}>
                                {customer.customer_name} {customer.customer_phone ? `(${customer.customer_phone})` : ''}
                              </option>
                            ))}
                            <option value="-1">+ Add New Customer</option>
                          </select>
                        </div>
                        
                        {(isNewCustomer || receiveFormData.customer_id === 0) && (
                          <>
                            <div className="col-md-12">
                              <label className="form-label">Customer Name <span className="text-danger">*</span></label>
                              <input
                                type="text"
                                className="form-control"
                                value={receiveFormData.customer_name}
                                onChange={(e) => setReceiveFormData({ ...receiveFormData, customer_name: e.target.value })}
                                placeholder="Enter customer name"
                                required
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Phone Number</label>
                              <input
                                type="text"
                                className="form-control"
                                value={receiveFormData.customer_phone}
                                onChange={(e) => setReceiveFormData({ ...receiveFormData, customer_phone: e.target.value })}
                                placeholder="Enter phone number"
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Email</label>
                              <input
                                type="email"
                                className="form-control"
                                value={receiveFormData.customer_email}
                                onChange={(e) => setReceiveFormData({ ...receiveFormData, customer_email: e.target.value })}
                                placeholder="Enter email"
                              />
                            </div>
                          </>
                        )}
                        
                        {receiveFormData.customer_id > 0 && !isNewCustomer && (
                          <>
                            <div className="col-md-12">
                              <div className="alert alert-info mb-0">
                                <strong>Customer:</strong> {receiveFormData.customer_name}<br />
                                {receiveFormData.customer_phone && (
                                  <>
                                    <strong>Phone:</strong> {receiveFormData.customer_phone}<br />
                                  </>
                                )}
                                {receiveFormData.customer_email && (
                                  <>
                                    <strong>Email:</strong> {receiveFormData.customer_email}
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Document Types */}
                  <div className="card mb-3">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Document Types <span className="text-danger">*</span></h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={addDocumentTypeRow}
                      >
                        <i className="fas fa-plus me-1"></i>
                        Add Document
                      </button>
                    </div>
                    <div className="card-body">
                      {receiveFormData.document_types.map((docType, index) => (
                        <div key={index} className="row g-2 mb-2 align-items-end">
                          <div className="col-md-5">
                            <label className="form-label small">Document Type</label>
                            <input
                              type="text"
                              className="form-control"
                              value={docType.document_type_name}
                              onChange={(e) => updateDocumentType(index, 'document_type_name', e.target.value)}
                              list={`document-types-${index}`}
                              placeholder="Type or select..."
                            />
                            <datalist id={`document-types-${index}`}>
                              {documentTypeOptions.map((opt) => (
                                <option key={opt.id} value={opt.type_name} />
                              ))}
                            </datalist>
                          </div>
                          <div className="col-md-2">
                            <label className="form-label small">Quantity</label>
                            <input
                              type="number"
                              className="form-control"
                              min="1"
                              value={docType.quantity}
                              onChange={(e) => updateDocumentType(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small">Description</label>
                            <input
                              type="text"
                              className="form-control"
                              value={docType.description || ''}
                              onChange={(e) => updateDocumentType(index, 'description', e.target.value)}
                              placeholder="Optional"
                            />
                          </div>
                          <div className="col-md-1">
                            {receiveFormData.document_types.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm w-100"
                                onClick={() => removeDocumentTypeRow(index)}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="card mb-3">
                    <div className="card-header">
                      <h6 className="mb-0">Additional Information</h6>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Label/Location</label>
                          <input
                            type="text"
                            className="form-control"
                            value={receiveFormData.label}
                            onChange={(e) => setReceiveFormData({ ...receiveFormData, label: e.target.value })}
                            placeholder="e.g., Shelf A-1, Box 5"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Date & Time</label>
                          <input
                            type="datetime-local"
                            className="form-control"
                            value={receiveFormData.transaction_date}
                            onChange={(e) => setReceiveFormData({ ...receiveFormData, transaction_date: e.target.value })}
                          />
                        </div>
                        <div className="col-md-12">
                          <label className="form-label">Notes</label>
                          <textarea
                            className="form-control"
                            rows={3}
                            value={receiveFormData.notes}
                            onChange={(e) => setReceiveFormData({ ...receiveFormData, notes: e.target.value })}
                            placeholder="Any additional notes..."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attachments */}
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">Attachments (Optional)</h6>
                    </div>
                    <div className="card-body">
                      <input
                        type="file"
                        className="form-control mb-2"
                        onChange={handleFileSelect}
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      {selectedFiles.length > 0 && (
                        <div className="mt-2">
                          <strong>Selected Files:</strong>
                          <ul className="list-group mt-2">
                            {selectedFiles.map((file, index) => (
                              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                <span>
                                  <i className="fas fa-file me-2"></i>
                                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => removeFile(index)}
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowReceiveModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Generate Receipt
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Return Documents Modal */}
      {showReturnModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-upload me-2"></i>
                  Return Documents
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowReturnModal(false)}
                ></button>
              </div>
              <form onSubmit={handleReturnSubmit}>
                <div className="modal-body">
                  {/* Select Original Receipt */}
                  <div className="card mb-3">
                    <div className="card-header">
                      <h6 className="mb-0">Select Receipt to Return</h6>
                    </div>
                    <div className="card-body">
                      {availableForReturn.length === 0 ? (
                        <div className="alert alert-info mb-0">
                          <i className="fas fa-info-circle me-2"></i>
                          No documents currently with the company
                        </div>
                      ) : (
                        <div className="receipt-selection-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {availableForReturn.map((receipt) => (
                            <div
                              key={receipt.id}
                              className={`receipt-selection-item card mb-2 cursor-pointer ${returnFormData.original_receipt_id === receipt.id ? 'border-primary' : ''}`}
                              onClick={() => handleSelectOriginalReceipt(receipt.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="card-body p-2">
                                <div className="d-flex justify-content-between">
                                  <div>
                                    <strong>{receipt.receipt_number}</strong> - {receipt.customer_name}
                                    <div className="small text-muted">
                                      Received: {formatDate(receipt.transaction_date)}
                                    </div>
                                    <div className="small">
                                      {receipt.document_types.map((dt, idx) => (
                                        <span key={idx} className="badge bg-secondary me-1">
                                          {dt.document_type_name} ({dt.quantity})
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    {returnFormData.original_receipt_id === receipt.id && (
                                      <i className="fas fa-check-circle text-primary fs-24px"></i>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Information */}
                  {returnFormData.original_receipt_id > 0 && (
                    <>
                      <div className="card mb-3">
                        <div className="card-header">
                          <h6 className="mb-0">Return Information</h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-12">
                              <label className="form-label">Customer Name</label>
                              <input
                                type="text"
                                className="form-control"
                                value={returnFormData.customer_name}
                                readOnly
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Date & Time</label>
                              <input
                                type="datetime-local"
                                className="form-control"
                                value={returnFormData.transaction_date}
                                onChange={(e) => setReturnFormData({ ...returnFormData, transaction_date: e.target.value })}
                              />
                            </div>
                            <div className="col-md-12">
                              <label className="form-label">Notes</label>
                              <textarea
                                className="form-control"
                                rows={3}
                                value={returnFormData.notes}
                                onChange={(e) => setReturnFormData({ ...returnFormData, notes: e.target.value })}
                                placeholder="Any notes about the return..."
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Attachments */}
                      <div className="card">
                        <div className="card-header">
                          <h6 className="mb-0">Attachments (Optional)</h6>
                        </div>
                        <div className="card-body">
                          <input
                            type="file"
                            className="form-control mb-2"
                            onChange={handleFileSelect}
                            multiple
                            accept="image/*,.pdf,.doc,.docx"
                          />
                          {selectedFiles.length > 0 && (
                            <div className="mt-2">
                              <strong>Selected Files:</strong>
                              <ul className="list-group mt-2">
                                {selectedFiles.map((file, index) => (
                                  <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                    <span>
                                      <i className="fas fa-file me-2"></i>
                                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                    </span>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-danger"
                                      onClick={() => removeFile(index)}
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowReturnModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createMutation.isPending || !returnFormData.original_receipt_id}
                  >
                    {createMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Generate Return Receipt
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Receipt Modal */}
      {showViewModal && selectedReceipt && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-file-contract me-2"></i>
                  Receipt Details - {selectedReceipt.receipt_number}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Simple Details View */}
                <div className="receipt-details-view">
                  <div className="detail-section">
                    <h6 className="section-title">Receipt Information</h6>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Receipt Number:</span>
                        <span className="detail-value"><strong>{selectedReceipt.receipt_number}</strong></span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">
                          <span className={`badge ${selectedReceipt.transaction_type === 'received' ? 'bg-success' : 'bg-info'}`}>
                            {selectedReceipt.transaction_type === 'received' ? 'Received' : 'Returned'}
                          </span>
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Status:</span>
                        <span className="detail-value">
                          <span className={`badge ${selectedReceipt.status === 'with_company' ? 'bg-warning' : 'bg-success'}`}>
                            {selectedReceipt.status === 'with_company' ? 'With Company' : 'With Customer'}
                          </span>
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{formatDate(selectedReceipt.transaction_date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h6 className="section-title">Customer Information</h6>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Name:</span>
                        <span className="detail-value">{selectedReceipt.customer_name}</span>
                      </div>
                      {selectedReceipt.customer_phone && (
                        <div className="detail-item">
                          <span className="detail-label">Phone:</span>
                          <span className="detail-value">{selectedReceipt.customer_phone}</span>
                        </div>
                      )}
                      {selectedReceipt.customer_email && (
                        <div className="detail-item">
                          <span className="detail-label">Email:</span>
                          <span className="detail-value">{selectedReceipt.customer_email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h6 className="section-title">Documents</h6>
                    <table className="table table-sm table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Document Type</th>
                          <th>Quantity</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReceipt.document_types.map((dt, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{dt.document_type_name}</td>
                            <td>{dt.quantity}</td>
                            <td>{dt.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedReceipt.label && (
                    <div className="detail-section">
                      <h6 className="section-title">Storage Location</h6>
                      <div className="alert alert-info">
                        <i className="fas fa-map-marker-alt me-2"></i>
                        <strong>{selectedReceipt.label}</strong>
                      </div>
                    </div>
                  )}

                  {selectedReceipt.notes && (
                    <div className="detail-section">
                      <h6 className="section-title">Additional Notes</h6>
                      <div className="alert alert-secondary">
                        {selectedReceipt.notes}
                      </div>
                    </div>
                  )}

                  {selectedReceipt.attachments && selectedReceipt.attachments.length > 0 && (
                    <div className="detail-section">
                      <h6 className="section-title">Attachments</h6>
                      <ul className="list-group">
                        {selectedReceipt.attachments.map((att, idx) => (
                          <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                            <span>
                              <i className="fas fa-file me-2"></i>
                              <a href={att.file_path} target="_blank" rel="noopener noreferrer">
                                {att.file_name}
                              </a>
                            </span>
                            <span className="badge bg-secondary">{(att.file_size / 1024).toFixed(2)} KB</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="detail-section">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Handled By:</span>
                        <span className="detail-value">
                          {selectedReceipt.transaction_type === 'received' ? selectedReceipt.received_by : selectedReceipt.returned_by}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">{formatDate(selectedReceipt.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePrintPreview}
                >
                  <i className="fas fa-print me-2"></i>
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Receipt Modal */}
      {showPrintModal && selectedReceipt && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-xl" style={{ maxWidth: '900px' }}>
            <div className="modal-content">
              <div className="modal-header no-print">
                <h5 className="modal-title">
                  <i className="fas fa-print me-2"></i>
                  Document Receipt - {selectedReceipt.receipt_number}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPrintModal(false)}
                ></button>
              </div>
              <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)', background: '#f5f5f5' }}>
                {/* Print Buttons */}
                <div className="receipt-print-buttons d-flex justify-content-end gap-2 mb-3 no-print">
                  <button
                    className="btn btn-primary"
                    onClick={() => handlePrint('A4')}
                    style={{ minWidth: '120px' }}
                  >
                    <i className="fa fa-print me-2"></i>
                    Print A4
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => handlePrint('A5')}
                    style={{ minWidth: '120px' }}
                  >
                    <i className="fa fa-print me-2"></i>
                    Print A5
                  </button>
                </div>

                {/* Professional Receipt Design */}
                <div ref={printRef} className={`page print-${printSize.toLowerCase()}`}>
                  {/* Header with Logo */}
                  <div className="header">
                    <div className="logo logo-container">
                      <img src="/assets/logo-white.png" alt="Company Logo" />
                    </div>
                    <div className="heading">
                      <span>
                        {selectedReceipt.transaction_type === 'received' ? 'DOCUMENT RECEIPT' : 'DOCUMENT RETURN'}
                      </span>
                    </div>
                    <div className="qr">
                      <img src={generateQRUrl()} alt="QR Code" />
                    </div>
                  </div>

                  {/* Data Section */}
                  <div className="data">
                    <div className="row">
                      <div className="col">
                        <div className="label">Receipt #:</div>
                        <div className="value">{selectedReceipt.receipt_number}</div>
                      </div>
                      <div className="col">
                        <div className="label">Date:</div>
                        <div className="value">{new Date(selectedReceipt.transaction_date).toLocaleDateString('en-GB')}</div>
                      </div>
                      <div className="col">
                        <div className="label">Status:</div>
                        <div className="value">{selectedReceipt.status === 'with_company' ? 'With Company' : 'With Customer'}</div>
                      </div>
                    </div>
                    
                    <div className="row">
                      <div className="col col-full">
                        <div className="label">Customer Name</div>
                        <div className="value">{selectedReceipt.customer_name}</div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col">
                        <div className="label">Phone:</div>
                        <div className="value">{selectedReceipt.customer_phone || 'N/A'}</div>
                      </div>
                      <div className="col">
                        <div className="label">Email:</div>
                        <div className="value">{selectedReceipt.customer_email || 'N/A'}</div>
                      </div>
                      <div className="col">
                        <div className="label">Label/Location:</div>
                        <div className="value">{selectedReceipt.label || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Documents Table */}
                    <table border={1} width="100%" style={{ borderCollapse: 'collapse' }} cellPadding="4" cellSpacing="0">
                      <thead>
                        <tr>
                          <th>SR#</th>
                          <th>Document Type</th>
                          <th>Quantity</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReceipt.document_types.map((dt, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{dt.document_type_name}</td>
                            <td>{dt.quantity}</td>
                            <td>{dt.description || '-'}</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={2} align="right" className="text-right">
                            <strong>Total Documents:</strong>
                          </td>
                          <td>
                            <strong>{selectedReceipt.document_types.reduce((sum, dt) => sum + dt.quantity, 0)}</strong>
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Notes if present */}
                    {selectedReceipt.notes && (
                      <div className="row">
                        <div className="col col-full">
                          <div className="label">Notes:</div>
                          <div className="value">{selectedReceipt.notes}</div>
                        </div>
                      </div>
                    )}

                    <div className="row">
                      <div className="col">
                        <div className="label">
                          {selectedReceipt.transaction_type === 'received' ? 'Received By:' : 'Returned By:'}
                        </div>
                        <div className="value">
                          {selectedReceipt.transaction_type === 'received' ? selectedReceipt.received_by : selectedReceipt.returned_by}
                        </div>
                      </div>
                      <div className="col">
                        <div className="label">Signature:</div>
                        <div className="value" style={{ minHeight: '40px' }}>_________________</div>
                      </div>
                    </div>

                    {/* Footer Text */}
                    <div>
                      <div className="english">
                        {selectedReceipt.transaction_type === 'received' 
                          ? 'This receipt confirms that we have received your original documents. Please keep this receipt safe and present it when collecting your documents.'
                          : 'This receipt confirms that your original documents have been returned to you. Please verify all documents before leaving.'}
                      </div>
                      <div className="arabic">
                        {selectedReceipt.transaction_type === 'received'
                          ? 'يؤكد هذا الإيصال أننا استلمنا مستنداتك الأصلية. يرجى الاحتفاظ بهذا الإيصال وتقديمه عند استلام مستنداتك.'
                          : 'يؤكد هذا الإيصال أن مستنداتك الأصلية قد أعيدت إليك. يرجى التحقق من جميع المستندات قبل المغادرة.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer no-print">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPrintModal(false)}
                >
                  <i className="fas fa-times me-2"></i>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Document Types Modal */}
      {showTypeModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-cog me-2"></i>
                  Manage Document Types
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTypeModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Add New Document Type</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="e.g., Passport, ID Card, Contract"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDocumentType();
                        }
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleAddDocumentType}
                      disabled={addTypeMutation.isPending}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>

                <div>
                  <strong>Existing Document Types:</strong>
                  <div className="list-group mt-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {documentTypeOptions.map((type) => (
                      <div key={type.id} className="list-group-item">
                        <i className="fas fa-file-alt me-2"></i>
                        {type.type_name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTypeModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

