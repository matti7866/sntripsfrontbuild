import axios from 'axios';
import { config } from '../utils/config';
import type {
  CreditCard,
  CreateCreditCardRequest,
  UpdateCreditCardRequest,
  CreditCardStatement,
  CreditCardTransaction
} from '../types/creditCard';
import type { Currency } from '../types/accountManagement';

class CreditCardService {
  private baseUrl = `${config.baseUrl}`;

  // Get all credit cards (account_type = 4)
  async getCreditCards(): Promise<CreditCard[]> {
    try {
      const formData = new FormData();
      formData.append('GetCreditCards', 'getCreditCards');
      
      const response = await axios.post<CreditCard[]>(
        `${this.baseUrl}/api/accounts/credit-cards.php`, 
        formData, 
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Return empty array if response is not an array
      if (!Array.isArray(response.data)) {
        console.warn('Credit cards API returned non-array response:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching credit cards:', error);
      // If endpoint doesn't exist yet, return empty array instead of throwing
      if (error.response?.status === 404 || error.message?.includes('404')) {
        return [];
      }
      throw error;
    }
  }

  // Get single credit card for editing
  async getCreditCard(id: number): Promise<CreditCard> {
    const formData = new FormData();
    formData.append('GetSingleCreditCard', 'getSingleCreditCard');
    formData.append('accountID', id.toString());
    
    const response = await axios.post<CreditCard>(
      `${this.baseUrl}/api/accounts/credit-cards.php`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  }

  // Add new credit card
  async addCreditCard(data: CreateCreditCardRequest): Promise<string> {
    const formData = new FormData();
    formData.append('SaveCreditCard', 'saveCreditCard');
    formData.append('account_name', data.account_name);
    formData.append('account_number', data.account_number || '');
    formData.append('card_holder_name', data.card_holder_name);
    formData.append('card_type', data.card_type || '');
    formData.append('bank_name', data.bank_name || '');
    formData.append('credit_limit', data.credit_limit?.toString() || '0');
    formData.append('billing_cycle_day', data.billing_cycle_day?.toString() || '1');
    formData.append('payment_due_day', data.payment_due_day?.toString() || '21');
    formData.append('interest_rate', data.interest_rate?.toString() || '0');
    formData.append('currency_type', data.currency_type.toString());
    formData.append('expiry_date', data.expiry_date || '');
    formData.append('notes', data.notes || '');
    formData.append('accountType', '4'); // Credit Card type
    
    const response = await axios.post<string>(
      `${this.baseUrl}/api/accounts/credit-cards.php`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  }

  // Update credit card
  async updateCreditCard(data: UpdateCreditCardRequest): Promise<string> {
    const formData = new FormData();
    formData.append('UpdateCreditCard', 'updateCreditCard');
    formData.append('accountID', data.accountID.toString());
    
    if (data.updaccount_name) formData.append('updaccount_name', data.updaccount_name);
    if (data.updaccount_number) formData.append('updaccount_number', data.updaccount_number);
    if (data.card_holder_name) formData.append('card_holder_name', data.card_holder_name);
    if (data.card_type) formData.append('card_type', data.card_type);
    if (data.bank_name) formData.append('bank_name', data.bank_name);
    if (data.credit_limit !== undefined) formData.append('credit_limit', data.credit_limit.toString());
    if (data.billing_cycle_day) formData.append('billing_cycle_day', data.billing_cycle_day.toString());
    if (data.payment_due_day) formData.append('payment_due_day', data.payment_due_day.toString());
    if (data.interest_rate !== undefined) formData.append('interest_rate', data.interest_rate.toString());
    if (data.updcurrency_type) formData.append('updcurrency_type', data.updcurrency_type.toString());
    if (data.expiry_date) formData.append('expiry_date', data.expiry_date);
    if (data.is_active !== undefined) formData.append('is_active', data.is_active ? '1' : '0');
    if (data.notes) formData.append('notes', data.notes);
    formData.append('updaccountType', '4'); // Credit Card type
    
    const response = await axios.post<string>(
      `${this.baseUrl}/api/accounts/credit-cards.php`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  }

  // Delete credit card
  async deleteCreditCard(id: number): Promise<string> {
    const formData = new FormData();
    formData.append('DeleteCreditCard', 'deleteCreditCard');
    formData.append('accountID', id.toString());
    
    const response = await axios.post<string>(
      `${this.baseUrl}/api/accounts/credit-cards.php`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  }

  // Get currencies for dropdown
  async getCurrencies(): Promise<Currency[]> {
    const formData = new FormData();
    formData.append('GetCurrencies', 'getCurrencies');
    
    const response = await axios.post<Currency[]>(
      `${this.baseUrl}/api/accounts/credit-cards.php`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  }

  // Get credit card statement
  async getCreditCardStatement(accountId: number, month?: string, year?: string): Promise<CreditCardStatement> {
    const formData = new FormData();
    formData.append('GetCreditCardStatement', 'getCreditCardStatement');
    formData.append('accountID', accountId.toString());
    if (month) formData.append('month', month);
    if (year) formData.append('year', year);
    
    const response = await axios.post<CreditCardStatement>(
      `${this.baseUrl}/api/accounts/credit-cards.php`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  }

  // Get credit card transactions
  async getCreditCardTransactions(accountId: number, startDate?: string, endDate?: string, limit?: number): Promise<CreditCardTransaction[]> {
    const formData = new FormData();
    formData.append('GetTransactions', 'getTransactions');
    formData.append('account_id', accountId.toString());
    if (startDate) formData.append('start_date', startDate);
    if (endDate) formData.append('end_date', endDate);
    if (limit) formData.append('limit', limit.toString());
    
    const response = await axios.post<CreditCardTransaction[]>(
      `${this.baseUrl}/api/accounts/credit-card-transactions.php`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  }

  // Add transaction (Debit/Credit)
  async addTransaction(data: {
    account_id: number;
    transaction_type: 'debit' | 'credit' | 'payment' | 'refund' | 'fee' | 'interest';
    amount: number;
    currency_id?: number;
    category?: string;
    merchant?: string;
    description?: string;
    reference?: string;
    notes?: string;
    transaction_date?: string;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('AddTransaction', 'addTransaction');
    formData.append('account_id', data.account_id.toString());
    formData.append('transaction_type', data.transaction_type);
    formData.append('amount', data.amount.toString());
    if (data.currency_id) formData.append('currency_id', data.currency_id.toString());
    if (data.category) formData.append('category', data.category);
    if (data.merchant) formData.append('merchant', data.merchant);
    if (data.description) formData.append('description', data.description);
    if (data.reference) formData.append('reference', data.reference);
    if (data.notes) formData.append('notes', data.notes);
    if (data.transaction_date) formData.append('transaction_date', data.transaction_date);
    
    const response = await axios.post(
      `${this.baseUrl}/api/accounts/credit-card-transactions.php`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  }

  // Delete transaction
  async deleteTransaction(transactionId: number): Promise<any> {
    const formData = new FormData();
    formData.append('DeleteTransaction', 'deleteTransaction');
    formData.append('transaction_id', transactionId.toString());
    
    const response = await axios.post(
      `${this.baseUrl}/api/accounts/credit-card-transactions.php`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  }

  // Get balance for a credit card
  async getBalance(accountId: number): Promise<{ current_balance: number; credit_limit: number; available_credit: number }> {
    const formData = new FormData();
    formData.append('GetBalance', 'getBalance');
    formData.append('account_id', accountId.toString());
    
    const response = await axios.post(
      `${this.baseUrl}/api/accounts/credit-card-transactions.php`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  }

  // Get transaction categories
  async getCategories(): Promise<Record<string, string>> {
    const formData = new FormData();
    formData.append('GetCategories', 'getCategories');
    
    const response = await axios.post(
      `${this.baseUrl}/api/accounts/credit-card-transactions.php`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  }
}

export default new CreditCardService();

