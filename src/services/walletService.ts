import axios from './api';

export interface WalletBalance {
  customer_id: number;
  customer_name: string;
  wallet_balance: number;
  total_transactions: number;
  last_transaction_date: string | null;
}

export interface WalletTransaction {
  transaction_id: number;
  customer_id: number;
  transaction_type: 'deposit' | 'refund' | 'payment' | 'withdrawal';
  amount: number;
  currency_id: number;
  currency_name: string;
  currency_symbol: string;
  balance_before: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: number | null;
  payment_id: number | null;
  staff_id: number;
  staff_name: string;
  account_id: number | null;
  account_name: string | null;
  remarks: string | null;
  datetime: string;
}

export interface WalletTransactionResponse {
  data: WalletTransaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    recordsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface AddFundsRequest {
  customerID: number;
  amount: number;
  accountID: number;
  currencyID?: number;
  remarks?: string;
  transactionType?: 'deposit' | 'refund';
}

export interface WithdrawRequest {
  customerID: number;
  amount: number;
  accountID: number;
  currencyID?: number;
  remarks?: string;
}

const walletService = {
  /**
   * Get customer wallet balance
   */
  async getBalance(customerID: number): Promise<WalletBalance> {
    const response = await axios.post('/wallet/get-balance.php', { customerID });
    return response.data.data || response.data;
  },

  /**
   * Add funds to customer wallet (deposit or refund)
   */
  async addFunds(data: AddFundsRequest): Promise<{ transaction_id: number; [key: string]: any }> {
    const response = await axios.post('/wallet/add-funds.php', data);
    console.log('addFunds full response:', response.data);
    // Try multiple possible response structures
    if (response.data.data) {
      console.log('Using response.data.data:', response.data.data);
      return response.data.data;
    } else if (response.data.transaction_id) {
      console.log('Using response.data directly:', response.data);
      return response.data;
    }
    return response.data;
  },

  /**
   * Withdraw funds from customer wallet
   */
  async withdraw(data: WithdrawRequest): Promise<{ transaction_id: number; [key: string]: any }> {
    const response = await axios.post('/wallet/withdraw.php', data);
    console.log('withdraw full response:', response.data);
    // Try multiple possible response structures
    if (response.data.data) {
      console.log('Using response.data.data:', response.data.data);
      return response.data.data;
    } else if (response.data.transaction_id) {
      console.log('Using response.data directly:', response.data);
      return response.data;
    }
    return response.data;
  },

  /**
   * Get wallet transaction history
   */
  async getTransactions(
    customerID: number,
    page: number = 1,
    limit: number = 20
  ): Promise<WalletTransactionResponse> {
    const response = await axios.post('/wallet/get-transactions.php', {
      customerID,
      page,
      limit
    });
    
    console.log('Get transactions axios response:', response);
    console.log('Get transactions response.data:', response.data);
    
    // Handle JWTHelper response format: { success: true, message: "...", data: { data: [...], pagination: {...} } }
    if (response.data && response.data.success && response.data.data) {
      console.log('Using response.data.data structure');
      return response.data.data;
    } else if (response.data && response.data.data) {
      console.log('Using response.data structure');
      return response.data.data;
    } else if (response.data) {
      console.log('Using response.data directly');
      return response.data;
    }
    
    console.log('Fallback - returning empty');
    return { data: [], pagination: { currentPage: 1, totalPages: 1, totalRecords: 0, recordsPerPage: limit, hasNextPage: false, hasPreviousPage: false } };
  },

  /**
   * Make payment from wallet
   * Used for paying residence/visa/ticket from customer wallet
   */
  async payFromWallet(data: {
    customerID: number;
    amount: number;
    referenceType: string;
    referenceID: number;
    currencyID?: number;
    remarks?: string;
  }) {
    const response = await axios.post('/wallet/pay-from-wallet.php', {
      customerID: data.customerID,
      amount: data.amount,
      referenceType: data.referenceType,
      referenceID: data.referenceID,
      currencyID: data.currencyID || 1,
      remarks: data.remarks || ''
    });
    return response.data.data || response.data;
  }
};

export default walletService;

