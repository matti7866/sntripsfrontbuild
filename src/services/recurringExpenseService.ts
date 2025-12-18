import apiClient from './api';
import type {
  RecurringExpense,
  RecurringExpenseFilters,
  RecurringExpenseSummary,
  CreateRecurringExpenseRequest
} from '../types/recurringExpense';

interface RecurringExpenseListResponse {
  data: RecurringExpense[];
  summary: RecurringExpenseSummary;
}

const recurringExpenseService = {
  // Get all recurring expenses with optional filters
  getRecurringExpenses: async (filters?: RecurringExpenseFilters): Promise<RecurringExpenseListResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.category) params.append('category', filters.category);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.start_year) params.append('start_year', filters.start_year.toString());
    
    const queryString = params.toString();
    const url = `/recurring-expense/list.php${queryString ? `?${queryString}` : ''}`;
    
    console.log('🔍 Fetching recurring expenses from:', url);
    console.log('🔍 Full URL:', apiClient.defaults.baseURL + url);
    console.log('🔍 Filters:', filters);
    
    const response = await apiClient.get(url);
    
    console.log('✅ Response received:', response);
    
    return {
      data: response.data.data || [],
      summary: response.data.summary || {
        yearly_totals_by_category: {},
        grand_total_yearly: 0,
        year: new Date().getFullYear()
      }
    };
  },

  // Create new recurring expense
  createRecurringExpense: async (data: CreateRecurringExpenseRequest): Promise<{ id: number }> => {
    const response = await apiClient.post('/recurring-expense/create.php', data);
    return response.data.data;
  },

  // Update recurring expense
  updateRecurringExpense: async (id: number, data: Partial<CreateRecurringExpenseRequest>): Promise<void> => {
    await apiClient.post('/recurring-expense/update.php', {
      id,
      ...data
    });
  },

  // Delete recurring expense
  deleteRecurringExpense: async (id: number): Promise<void> => {
    await apiClient.post('/recurring-expense/delete.php', { id });
  }
};

export default recurringExpenseService;

