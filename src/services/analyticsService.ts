import apiClient from './api';
import type {
  RealTimeComparison,
  SalesDataPoint,
  PerformanceData,
  MonthlyCountsData,
  WeeklyCountsData
} from '../types/analytics';

export const analyticsService = {
  // Get real-time comparison data (today vs 7-day average)
  getRealTimeComparison: async (): Promise<RealTimeComparison> => {
    const response = await apiClient.get('/analytics/data.php', {
      params: { action: 'realTimeComparison' }
    });
    
    
    // JWTHelper wraps data in 'data' property when sending arrays/objects
    if (response.data.success) {
      // The data might be directly in response.data or in response.data.data
      const data = response.data.data || response.data;
      if (data.today && data.pastAverage) {
        return data as RealTimeComparison;
      }
    }
    throw new Error('Failed to fetch real-time comparison data');
  },

  // Get 30-day sales data
  getSalesData: async (): Promise<SalesDataPoint[]> => {
    const response = await apiClient.get('/analytics/data.php', {
      params: { action: 'salesData' }
    });
    
    
    if (response.data.success) {
      // Check both possible locations for the data array
      if (response.data.data && response.data.data.data) {
        return response.data.data.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
    }
    throw new Error('Failed to fetch sales data');
  },

  // Get performance comparison (month/year/ytd)
  getPerformance: async (period: 'month' | 'year' | 'ytd' = 'month'): Promise<PerformanceData> => {
    const response = await apiClient.get('/analytics/data.php', {
      params: { action: 'performance', period }
    });
    
    if (response.data.success) {
      const data = response.data.data || response.data;
      if (data.current && data.previous) {
        return data as PerformanceData;
      }
    }
    throw new Error('Failed to fetch performance data');
  },

  // Get monthly counts for a specific year
  getMonthlyCounts: async (year: number): Promise<MonthlyCountsData> => {
    const response = await apiClient.get('/analytics/data.php', {
      params: { action: 'monthlyCounts', year }
    });
    
    if (response.data.success) {
      const data = response.data.data || response.data;
      
      // JWTHelper merges data directly into response for non-arrays
      // Check if year/data are directly in response.data
      if (response.data.year !== undefined) {
        return {
          year: response.data.year,
          data: response.data.data
        } as MonthlyCountsData;
      }
      
      if (data.year !== undefined && data.data) {
        return data as MonthlyCountsData;
      }
    }
    throw new Error('Failed to fetch monthly counts');
  },

  // Get weekly counts for a specific year/month
  getWeeklyCounts: async (year: number, month?: number): Promise<WeeklyCountsData> => {
    const response = await apiClient.get('/analytics/data.php', {
      params: { action: 'weeklyCounts', year, ...(month && { month }) }
    });
    
    if (response.data.success) {
      const data = response.data.data || response.data;
      
      // JWTHelper merges data directly into response for non-arrays
      // Check if year/month/data are directly in response.data
      if (response.data.year !== undefined) {
        return {
          year: response.data.year,
          month: response.data.month,
          data: response.data.data
        } as WeeklyCountsData;
      }
      
      if (data.year !== undefined && data.data) {
        return data as WeeklyCountsData;
      }
    }
    throw new Error('Failed to fetch weekly counts');
  },
};

export default analyticsService;

