export interface RecurringExpense {
  id: number;
  expense_name: string;
  category: 'office_rent' | 'shop_rent' | 'sim_card' | 'utilities' | 'subscription' | 'other';
  amount: number;
  currency_id: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string | null;
  description?: string | null;
  is_active: number;
  branch_id?: number | null;
  staff_id: number;
  created_at: string;
  updated_at: string;
  currencyName?: string;
  created_by?: string;
  yearly_amount?: number;
}

export interface RecurringExpenseFilters {
  category?: string;
  is_active?: number;
  start_year?: number;
}

export interface RecurringExpenseSummary {
  yearly_totals_by_category: {
    [key: string]: number;
  };
  grand_total_yearly: number;
  year: number;
}

export interface CreateRecurringExpenseRequest {
  expense_name: string;
  category: string;
  amount: number;
  currency_id: number;
  frequency: string;
  start_date: string;
  end_date?: string | null;
  description?: string | null;
  is_active?: number;
  branch_id?: number | null;
}

export interface Currency {
  currencyID: number;
  currencyName: string;
  currencySymbol: string;
}

