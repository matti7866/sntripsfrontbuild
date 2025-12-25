import apiClient from './api';
import type {
  DocumentReceipt,
  CreateDocumentReceiptRequest,
  UpdateDocumentReceiptRequest,
  DocumentReceiptFilters,
  DocumentReceiptStats,
  DocumentTypeOption,
  ReceiptPrintData
} from '../types/documentReceipt';

const documentReceiptService = {
  /**
   * Get all document receipts with filters
   */
  async getDocumentReceipts(filters: DocumentReceiptFilters = {}): Promise<{
    data: DocumentReceipt[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await apiClient.post('/document_receiptsController.php', {
        action: 'getReceipts',
        ...filters
      });
      
      console.log('API Response:', response);
      
      if (response.data.success) {
        return {
          data: response.data.data || [],
          pagination: response.data.pagination || {
            total: 0,
            page: 1,
            limit: 50,
            totalPages: 1
          }
        };
      }
      throw new Error(response.data.message || 'Failed to fetch document receipts');
    } catch (error: any) {
      console.error('Error fetching receipts:', error);
      console.error('Error response:', error.response);
      throw error;
    }
  },

  /**
   * Get a single document receipt by ID
   */
  async getDocumentReceipt(id: number): Promise<DocumentReceipt> {
    const response = await apiClient.post('/document_receiptsController.php', {
      action: 'getReceipt',
      id
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Document receipt not found');
  },

  /**
   * Create a new document receipt
   */
  async createDocumentReceipt(data: CreateDocumentReceiptRequest): Promise<{
    success: boolean;
    message: string;
    receipt_id?: number;
    receipt_number?: string;
  }> {
    const formData = new FormData();
    formData.append('action', 'createReceipt');
    formData.append('customer_name', data.customer_name);
    formData.append('transaction_type', data.transaction_type);
    formData.append('transaction_date', data.transaction_date);
    formData.append('document_types', JSON.stringify(data.document_types));
    
    if (data.customer_phone) formData.append('customer_phone', data.customer_phone);
    if (data.customer_email) formData.append('customer_email', data.customer_email);
    if (data.label) formData.append('label', data.label);
    if (data.notes) formData.append('notes', data.notes);
    if (data.original_receipt_id) formData.append('original_receipt_id', data.original_receipt_id.toString());
    
    // Append file attachments
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[]`, file);
      });
    }
    
    const response = await apiClient.post('/document_receiptsController.php', formData);
    
    return {
      success: response.data.success,
      message: response.data.message || 'Document receipt created successfully',
      receipt_id: response.data.receipt_id,
      receipt_number: response.data.receipt_number
    };
  },

  /**
   * Update a document receipt
   */
  async updateDocumentReceipt(data: UpdateDocumentReceiptRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    const formData = new FormData();
    formData.append('action', 'updateReceipt');
    formData.append('id', data.id.toString());
    
    if (data.customer_name) formData.append('customer_name', data.customer_name);
    if (data.customer_phone) formData.append('customer_phone', data.customer_phone);
    if (data.customer_email) formData.append('customer_email', data.customer_email);
    if (data.label) formData.append('label', data.label);
    if (data.notes) formData.append('notes', data.notes);
    if (data.document_types) formData.append('document_types', JSON.stringify(data.document_types));
    
    // Append file attachments
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[]`, file);
      });
    }
    
    const response = await apiClient.post('/document_receiptsController.php', formData);
    
    return {
      success: response.data.success,
      message: response.data.message || 'Document receipt updated successfully'
    };
  },

  /**
   * Delete a document receipt
   */
  async deleteDocumentReceipt(id: number): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post('/document_receiptsController.php', {
      action: 'deleteReceipt',
      id
    });
    
    return {
      success: response.data.success,
      message: response.data.message || 'Document receipt deleted successfully'
    };
  },

  /**
   * Get receipt statistics
   */
  async getStats(): Promise<DocumentReceiptStats> {
    const response = await apiClient.post('/document_receiptsController.php', {
      action: 'getStats'
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch statistics');
  },

  /**
   * Get all document type options
   */
  async getDocumentTypeOptions(): Promise<DocumentTypeOption[]> {
    const response = await apiClient.post('/document_receiptsController.php', {
      action: 'getDocumentTypeOptions'
    });
    
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  },

  /**
   * Add a new document type option
   */
  async addDocumentTypeOption(typeName: string): Promise<{
    success: boolean;
    message: string;
    type_id?: number;
  }> {
    const response = await apiClient.post('/document_receiptsController.php', {
      action: 'addDocumentTypeOption',
      type_name: typeName
    });
    
    return {
      success: response.data.success,
      message: response.data.message || 'Document type added successfully',
      type_id: response.data.type_id
    };
  },

  /**
   * Get receipt data for printing
   */
  async getReceiptForPrint(id: number): Promise<ReceiptPrintData> {
    const response = await apiClient.post('/document_receiptsController.php', {
      action: 'getReceiptForPrint',
      id
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch receipt data');
  },

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post('/document_receiptsController.php', {
      action: 'deleteAttachment',
      attachment_id: attachmentId
    });
    
    return {
      success: response.data.success,
      message: response.data.message || 'Attachment deleted successfully'
    };
  },

  /**
   * Get available receipts for return (documents currently with company)
   */
  async getAvailableForReturn(customerName?: string): Promise<DocumentReceipt[]> {
    const response = await apiClient.post('/document_receiptsController.php', {
      action: 'getAvailableForReturn',
      customer_name: customerName
    });
    
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  },

  /**
   * Get customers for dropdown
   */
  async getCustomers(): Promise<Array<{
    customer_id: number;
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
  }>> {
    const response = await apiClient.post('/document_receiptsController.php', {
      action: 'getCustomers'
    });
    
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  }
};

export default documentReceiptService;

