export interface CreditCard {
  account_ID: number;
  account_Name: string; // Bank name + Card type (e.g., "Emirates NBD Visa Platinum")
  accountNum: string; // Last 4 digits or masked number
  card_number_full?: string; // Full card number (encrypted in backend)
  card_holder_name?: string;
  expiry_date?: string; // MM/YY format
  cvv?: string; // Should be encrypted
  card_type?: 'Visa' | 'Mastercard' | 'American Express' | 'Other';
  credit_limit?: number;
  current_balance?: number;
  available_credit?: number;
  billing_cycle_day?: number; // Day of month (1-31)
  payment_due_day?: number; // Days after billing cycle
  minimum_payment_percentage?: number;
  interest_rate?: number;
  bank_name?: string;
  curID: number;
  currencyName?: string;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCreditCardRequest {
  account_name: string; // Card nickname/identifier
  account_number?: string; // Last 4 digits
  card_holder_name: string;
  card_type?: string;
  bank_name?: string;
  credit_limit?: number;
  billing_cycle_day?: number;
  payment_due_day?: number;
  interest_rate?: number;
  currency_type: number;
  expiry_date?: string;
  notes?: string;
}

export interface UpdateCreditCardRequest {
  accountID: number;
  updaccount_name?: string;
  updaccount_number?: string;
  card_holder_name?: string;
  card_type?: string;
  bank_name?: string;
  credit_limit?: number;
  billing_cycle_day?: number;
  payment_due_day?: number;
  interest_rate?: number;
  updcurrency_type?: number;
  expiry_date?: string;
  is_active?: boolean;
  notes?: string;
}

export interface CreditCardTransaction {
  transaction_id: number;
  account_id: number;
  transaction_date: string;
  description?: string;
  amount: number;
  transaction_type: 'debit' | 'credit' | 'payment' | 'refund' | 'fee' | 'interest';
  category?: string;
  merchant?: string;
  reference?: string;
  notes?: string;
  currency_id?: number;
  currencyName?: string;
  created_by?: number;
  created_by_name?: string;
  running_balance?: number;
}

export interface CreditCardStatement {
  statement_date: string;
  billing_period_start: string;
  billing_period_end: string;
  previous_balance: number;
  payments_credits: number;
  purchases: number;
  fees_interest: number;
  new_balance: number;
  minimum_payment: number;
  payment_due_date: string;
  transactions: CreditCardTransaction[];
}

