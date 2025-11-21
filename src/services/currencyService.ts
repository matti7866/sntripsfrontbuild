import axiosDirect from 'axios';
import { config } from '../utils/config';

export type Currency = {
  currencyID: number;
  currencyName: string;
};

const currencyService = {
  async getCurrencies(): Promise<Currency[]> {
    const formData = new FormData();
    formData.append('Select_Currency', 'select_currency');

    const response = await axiosDirect.post(`${config.baseUrl}/currencyController.php`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error('Failed to fetch currencies');
  },

  async addCurrency(currencyName: string): Promise<string> {
    const formData = new FormData();
    formData.append('INSERT', 'INSERT');
    formData.append('Currency_Name', currencyName);

    const response = await axiosDirect.post(`${config.baseUrl}/currencyController.php`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data === 'Success') {
      return 'Success';
    }
    throw new Error(response.data || 'Failed to add currency');
  },

  async updateCurrency(id: number, currencyName: string): Promise<string> {
    const formData = new FormData();
    formData.append('UpdateCurrency', 'UpdateCurrency');
    formData.append('UpdID', id.toString());
    formData.append('UpdName', currencyName);

    const response = await axiosDirect.post(`${config.baseUrl}/currencyController.php`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data === 'Success') {
      return 'Success';
    }
    throw new Error(response.data || 'Failed to update currency');
  },

  async deleteCurrency(id: number): Promise<string> {
    const formData = new FormData();
    formData.append('Delete', 'Delete');
    formData.append('ID', id.toString());

    const response = await axiosDirect.post(`${config.baseUrl}/currencyController.php`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data === 'Success') {
      return 'Success';
    }
    throw new Error(response.data || 'Failed to delete currency');
  }
};

export default currencyService;

