import api from './api';
import type { APIResponse, TasksResponse, EIDReceiveData, EIDDeliverData } from '../types';

class EIDService {
  /**
   * Get EID tasks by step
   */
  async getEIDTasks(step: string): Promise<{ tasks: any[]; stepCounts: Record<string, number>; totalRemainingBalance: number }> {
    try {
      const response = await api.get<any>('/visa/eid-tasks.php', {
        params: { step },
      });
      // API returns data wrapped in { success, message, data: { tasks, stepCounts, ... } }
      const result = response.data || response;
      return result;
    } catch (error: any) {
      console.error('Error getting EID tasks:', error);
      throw error;
    }
  }

  /**
   * Get residence data for EID
   */
  async getEIDResidence(id: number, type: string): Promise<{ residence: any }> {
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'getResidence');
      formData.append('id', id.toString());
      formData.append('type', type);

      const response = await api.post<any>('/visa/eid-tasks-controller.php', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      // JWTHelper merges data directly into response
      const result = response.data || response;
      return {
        residence: result.residence || result.data?.residence || null
      };
    } catch (error: any) {
      console.error('Error getting EID residence:', error);
      throw error;
    }
  }

  /**
   * Get positions for occupation dropdown
   */
  async getPositions(): Promise<{ positions: Array<{ position_id: number; position_name: string }> }> {
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'getPositions');

      const response = await api.post<any>('/visa/eid-tasks-controller.php', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      // JWTHelper merges data directly into response
      const result = response.data || response;
      return {
        positions: result.positions || result.data?.positions || []
      };
    } catch (error: any) {
      console.error('Error getting positions:', error);
      throw error;
    }
  }

  /**
   * Get companies for establishment dropdown
   */
  async getCompanies(): Promise<{ companies: Array<{ company_id: number; company_name: string }> }> {
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'getCompanies');

      const response = await api.post<any>('/visa/eid-tasks-controller.php', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      // JWTHelper merges data directly into response
      const result = response.data || response;
      console.log('Companies response:', result);
      return {
        companies: result.companies || result.data?.companies || []
      };
    } catch (error: any) {
      console.error('Error getting companies:', error);
      throw error;
    }
  }

  /**
   * Mark EID as received
   */
  async markEIDReceived(data: {
    id: number;
    type: string;
    eidNumber: string;
    eidExpiryDate: string;
    passenger_name: string;
    gender: string;
    dob: string;
    occupation: number | null;
    establishmentName: number | null;
    emiratesIDFrontFile?: any;
    emiratesIDBackFile?: any;
  }): Promise<APIResponse> {
    try {
      const formData = new FormData();
      formData.append('action', 'setMarkReceived');  // Fixed: was 'markReceived'
      formData.append('id', data.id.toString());
      formData.append('type', data.type);
      formData.append('eidNumber', data.eidNumber);
      formData.append('eidExpiryDate', data.eidExpiryDate);
      formData.append('passenger_name', data.passenger_name);
      formData.append('gender', data.gender);
      formData.append('dob', data.dob);
      
      if (data.occupation) {
        formData.append('occupation', data.occupation.toString());
      }
      if (data.establishmentName) {
        formData.append('establishmentName', data.establishmentName.toString());
      }
      if (data.emiratesIDFrontFile) {
        formData.append('emiratesIDFrontFile', data.emiratesIDFrontFile);
      }
      if (data.emiratesIDBackFile) {
        formData.append('emiratesIDBackFile', data.emiratesIDBackFile);
      }

      const response = await api.post<any>('/visa/eid-tasks-controller.php', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error: any) {
      console.error('Error marking EID as received:', error);
      throw error;
    }
  }

  /**
   * Mark EID as delivered
   */
  async markEIDDelivered(data: { id: number; type: string }): Promise<APIResponse> {
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'setMarkDelivered');  // Fixed: was 'markDelivered'
      formData.append('id', data.id.toString());
      formData.append('type', data.type);

      const response = await api.post<any>('/visa/eid-tasks-controller.php', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error: any) {
      console.error('Error marking EID as delivered:', error);
      throw error;
    }
  }
}

export const eidService = new EIDService();
export default eidService;

