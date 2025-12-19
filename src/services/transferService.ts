import apiClient from './api';
import type {
  Transfer,
  Account,
  Currency,
  CreateTransferRequest,
  UpdateTransferRequest
} from '../types/transfer';

class TransferService {
  // Get all transfers
  async getTransfers(): Promise<Transfer[]> {
    const response = await apiClient.post('/accounts/transfers.php', {
      action: 'getTransfers'
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch transfers');
  }

  // Get single transfer for editing
  async getTransfer(id: number): Promise<Transfer> {
    const response = await apiClient.post('/accounts/transfers.php', {
      action: 'getTransfer',
      id: id
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Transfer not found');
  }

  // Add new transfer
  async addTransfer(data: CreateTransferRequest): Promise<string> {
    const response = await apiClient.post('/accounts/transfers.php', {
      action: 'createTransfer',
      from_account: data.from_account,
      to_account: data.to_account,
      amount: data.amount,
      charges: data.charges,
      exchange_rate: data.exchange_rate,
      datetime: data.datetime,
      remarks: data.remarks,
      trx: data.trx
    });
    
    if (response.data.success) {
      return 'Success';
    }
    throw new Error(response.data.message || 'Failed to add transfer');
  }

  // Update transfer
  async updateTransfer(data: UpdateTransferRequest): Promise<string> {
    const response = await apiClient.post('/accounts/transfers.php', {
      action: 'updateTransfer',
      id: data.id,
      from_account: data.from_account,
      to_account: data.to_account,
      amount: data.amount,
      charges: data.charges,
      exchange_rate: data.exchange_rate,
      datetime: data.datetime,
      remarks: data.remarks,
      trx: data.trx
    });
    
    if (response.data.success) {
      return 'Success';
    }
    throw new Error(response.data.message || 'Failed to update transfer');
  }

  // Delete transfer
  async deleteTransfer(id: number): Promise<string> {
    const response = await apiClient.post('/accounts/transfers.php', {
      action: 'deleteTransfer',
      id: id
    });
    
    if (response.data.success) {
      return 'Success';
    }
    throw new Error(response.data.message || 'Failed to delete transfer');
  }

  // Get accounts for dropdown
  async getAccounts(): Promise<Account[]> {
    const response = await apiClient.get('/accounts.php');
    
    if (Array.isArray(response.data)) {
      return response.data.map((acc: any) => ({
        account_ID: acc.account_ID,
        account_Name: acc.account_Name,
        accountNum: acc.accountNum || '',
        accountType: acc.accountType || 1,
        curID: acc.currency || acc.curID
      }));
    }
    
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    
    return [];
  }

  // Get currencies for dropdown
  async getCurrencies(): Promise<Currency[]> {
    const response = await apiClient.get('/currencies.php');
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    
    return [];
  }
}

export const transferService = new TransferService();
export default transferService;

