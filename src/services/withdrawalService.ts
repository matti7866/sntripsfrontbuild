import apiClient from './api';
import type {
  Withdrawal,
  Account,
  Currency,
  CreateWithdrawalRequest,
  UpdateWithdrawalRequest
} from '../types/withdrawal';

class WithdrawalService {
  // Get all withdrawals
  async getWithdrawals(): Promise<Withdrawal[]> {
    const response = await apiClient.post('/accounts/withdrawals.php', {
      action: 'getWithdrawals'
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch withdrawals');
  }

  // Get single withdrawal for editing
  async getWithdrawal(id: number): Promise<Withdrawal> {
    const response = await apiClient.post('/accounts/withdrawals.php', {
      action: 'getWithdrawal',
      id: id
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Withdrawal not found');
  }

  // Add new withdrawal
  async addWithdrawal(data: CreateWithdrawalRequest): Promise<string> {
    const response = await apiClient.post('/accounts/withdrawals.php', {
      action: 'createWithdrawal',
      accountID: data.accountID,
      withdrawal_amount: data.withdrawal_amount,
      currencyID: data.currencyID,
      datetime: data.datetime,
      remarks: data.remarks
    });
    
    if (response.data.success) {
      return 'Success';
    }
    throw new Error(response.data.message || 'Failed to add withdrawal');
  }

  // Update withdrawal
  async updateWithdrawal(data: UpdateWithdrawalRequest): Promise<string> {
    const response = await apiClient.post('/accounts/withdrawals.php', {
      action: 'updateWithdrawal',
      withdrawal_ID: data.withdrawal_ID,
      accountID: data.accountID,
      withdrawal_amount: data.withdrawal_amount,
      currencyID: data.currencyID,
      datetime: data.datetime,
      remarks: data.remarks
    });
    
    if (response.data.success) {
      return 'Success';
    }
    throw new Error(response.data.message || 'Failed to update withdrawal');
  }

  // Delete withdrawal
  async deleteWithdrawal(id: number): Promise<string> {
    const response = await apiClient.post('/accounts/withdrawals.php', {
      action: 'deleteWithdrawal',
      id: id
    });
    
    if (response.data.success) {
      return 'Success';
    }
    throw new Error(response.data.message || 'Failed to delete withdrawal');
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

export const withdrawalService = new WithdrawalService();
export default withdrawalService;

