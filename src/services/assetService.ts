import axios from './api';
import type { Asset, AssetLookups, AssetFilters } from '../types/asset';

const assetService = {
  /**
   * Get asset lookups (dropdowns data)
   */
  async getLookups(): Promise<AssetLookups> {
    const response = await axios.get('/assets/lookups.php');
    return response.data.data || response.data;
  },

  /**
   * Get list of assets with filters
   */
  async getAssets(filters: AssetFilters = {}) {
    const response = await axios.get('/assets/list.php', { params: filters });
    console.log('Raw API response:', response.data);
    // JWTHelper merges data array into response, so assets and pagination are at root level
    return {
      assets: response.data.assets || response.data.data?.assets || [],
      pagination: response.data.pagination || response.data.data?.pagination || {
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 1
      }
    };
  },

  /**
   * Get single asset by ID
   */
  async getAsset(id: number): Promise<Asset> {
    const response = await axios.get('/assets/get.php', { params: { id } });
    return response.data.data || response.data;
  },

  /**
   * Create new asset
   */
  async createAsset(data: Partial<Asset>) {
    const response = await axios.post('/assets/create.php', data);
    return response.data;
  },

  /**
   * Update asset
   */
  async updateAsset(assetId: number, data: Partial<Asset>) {
    const response = await axios.post('/assets/update.php', {
      asset_id: assetId,
      ...data
    });
    return response.data;
  },

  /**
   * Delete asset
   */
  async deleteAsset(assetId: number) {
    const response = await axios.post('/assets/delete.php', {
      asset_id: assetId
    });
    return response.data;
  }
};

export default assetService;

