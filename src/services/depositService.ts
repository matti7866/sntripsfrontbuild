import apiClient from './api';
import type {
  Deposit,
  Account,
  Currency,
  CreateDepositRequest,
  UpdateDepositRequest
} from '../types/deposit';

class DepositService {
  // Get all deposits
  async getDeposits(): Promise<Deposit[]> {
    const response = await apiClient.post('/accounts/deposits.php', {
      action: 'getDeposits'
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch deposits');
  }

  // Get single deposit for editing
  async getDeposit(id: number): Promise<Deposit> {
    const response = await apiClient.post('/accounts/deposits.php', {
      action: 'getDeposit',
      id: id
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Deposit not found');
  }

  // Add new deposit
  async addDeposit(data: CreateDepositRequest): Promise<string> {
    const response = await apiClient.post('/accounts/deposits.php', {
      action: 'createDeposit',
      accountID: data.accountID,
      deposit_amount: data.deposit_amount,
      currencyID: data.currencyID,
      datetime: data.datetime,
      remarks: data.remarks
    });
    
    if (response.data.success) {
      return 'Success';
    }
    throw new Error(response.data.message || 'Failed to add deposit');
  }

  // Update deposit
  async updateDeposit(data: UpdateDepositRequest): Promise<string> {
    const response = await apiClient.post('/accounts/deposits.php', {
      action: 'updateDeposit',
      deposit_ID: data.deposit_ID,
      accountID: data.accountID,
      deposit_amount: data.deposit_amount,
      currencyID: data.currencyID,
      datetime: data.datetime,
      remarks: data.remarks
    });
    
    if (response.data.success) {
      return 'Success';
    }
    throw new Error(response.data.message || 'Failed to update deposit');
  }

  // Delete deposit
  async deleteDeposit(id: number): Promise<string> {
    const response = await apiClient.post('/accounts/deposits.php', {
      action: 'deleteDeposit',
      id: id
    });
    
    if (response.data.success) {
      return 'Success';
    }
    throw new Error(response.data.message || 'Failed to delete deposit');
  }

  // Get accounts for dropdown
  async getAccounts(): Promise<Account[]> {
    const response = await apiClient.get('/accounts.php');
    
    // accounts.php returns the array directly, not wrapped in {success, data}
    if (Array.isArray(response.data)) {
      return response.data.map((acc: any) => ({
        account_ID: acc.account_ID,
        account_Name: acc.account_Name,
        accountNum: acc.accountNum || '',
        accountType: acc.accountType || 1,
        curID: acc.currency || acc.curID
      }));
    }
    
    // If it's an error object
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    
    return [];
  }

  // Get currencies for dropdown
  async getCurrencies(): Promise<Currency[]> {
    const response = await apiClient.get('/currencies.php');
    
    // currencies.php returns the array directly, not wrapped in {success, data}
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // If it's an error object
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    
    return [];
  }
}

export const depositService = new DepositService();
export default depositService;
