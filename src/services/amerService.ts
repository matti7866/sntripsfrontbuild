import apiClient from './api';
import type {
  AmerTransaction,
  AmerType,
  AmerTransactionFilters,
  CreateAmerTransactionRequest,
  CreateAmerTypeRequest,
  DropdownData
} from '../types/amer';

const amerService = {
  // Transactions
  getTransactions: async (filters?: AmerTransactionFilters): Promise<AmerTransaction[]> => {
    const data: any = {
      action: 'searchTransactions'
    };
    
    if (filters?.start_date) data.start_date = filters.start_date;
    if (filters?.end_date) data.end_date = filters.end_date;
    if (filters?.customer) data.customer = filters.customer.toString();
    if (filters?.type) data.type = filters.type.toString();
    if (filters?.account) data.account = filters.account.toString();
    if (filters?.status) data.status = filters.status;
    if (filters?.search) data.search = filters.search;
    
    const response = await apiClient.post('/amer/transactions.php', data);
    console.log('Transactions response:', response.data);
    // Handle different response formats
    if (response.data.success && response.data.data) {
      return Array.isArray(response.data.data) ? response.data.data : [];
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  },

  getTransaction: async (id: number): Promise<AmerTransaction> => {
    const response = await apiClient.post('/amer/transactions.php', { action: 'getTransaction', id });
    return response.data.data;
  },

  createTransaction: async (data: CreateAmerTransactionRequest): Promise<void> => {
    console.log('📤 Sending create transaction request:', { action: 'addTransaction', ...data });
    const response = await apiClient.post('/amer/transactions.php', { action: 'addTransaction', ...data });
    console.log('📥 Create transaction response:', response.data);
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    if (response.data.message && !response.data.success) {
      throw new Error(response.data.message);
    }
    return response.data;
  },

  updateTransaction: async (id: number, data: Partial<CreateAmerTransactionRequest>): Promise<void> => {
    await apiClient.post('/amer/transactions.php', { action: 'updateTransaction', id, ...data });
  },

  deleteTransaction: async (id: number): Promise<void> => {
    await apiClient.post('/amer/transactions.php', { action: 'deleteTransaction', id });
  },

  changeStatus: async (id: number, status: string): Promise<void> => {
    await apiClient.post('/amer/transactions.php', { action: 'changeStatus', id, status });
  },

  // Types
  getTypes: async (): Promise<AmerType[]> => {
    const response = await apiClient.get('/amer/types.php');
    return response.data.data || [];
  },

  getType: async (id: number): Promise<AmerType> => {
    const response = await apiClient.post('/amer/types.php', { action: 'getType', id });
    return response.data.data;
  },

  createType: async (data: CreateAmerTypeRequest): Promise<void> => {
    await apiClient.post('/amer/types.php', { action: 'addType', ...data });
  },

  updateType: async (id: number, data: Partial<CreateAmerTypeRequest>): Promise<void> => {
    await apiClient.post('/amer/types.php', { action: 'updateType', id, ...data });
  },

  deleteType: async (id: number): Promise<void> => {
    await apiClient.post('/amer/types.php', { action: 'deleteType', id });
  },

  // Dropdowns
  getDropdowns: async (): Promise<DropdownData> => {
    const response = await apiClient.get('/amer/dropdowns.php');
    console.log('Dropdowns response:', response.data);
    // Handle different response formats
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Attachments - Using transactions.php endpoint with action parameter
  getAttachments: async (transactionId: number): Promise<any[]> => {
    try {
      const response = await apiClient.post('/amer/transactions.php', { 
        action: 'getAttachments', 
        transaction_id: transactionId 
      });
      console.log('Get attachments response:', response.data);
      if (response.data.success && response.data.data) {
        return Array.isArray(response.data.data) ? response.data.data : [];
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data.attachments)) {
        return response.data.attachments;
      }
      return [];
    } catch (error: any) {
      console.error('Error getting attachments:', error);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  },

  uploadAttachment: async (transactionId: number, file: File, description?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('action', 'uploadAttachment');
    formData.append('transaction_id', transactionId.toString());
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    const response = await apiClient.post('/amer/transactions.php', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('Upload attachment response:', response.data);
    return response.data;
  },

  deleteAttachment: async (attachmentId: number): Promise<void> => {
    const response = await apiClient.post('/amer/transactions.php', { 
      action: 'deleteAttachment', 
      attachment_id: attachmentId 
    });
    console.log('Delete attachment response:', response.data);
    return response.data;
  }
};

export default amerService;

