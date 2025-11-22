export interface Asset {
  asset_id: number;
  asset_name: string;
  asset_type_id: number;
  asset_type_name?: string;
  type_icon?: string;
  purchase_date?: string;
  purchase_price: number;
  purchase_currency_id: number;
  purchase_currency?: string;
  purchase_currency_symbol?: string;
  current_value: number;
  depreciation_rate: number;
  description?: string;
  location?: string;
  serial_number?: string;
  registration_number?: string;
  brand?: string;
  model?: string;
  year?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  status: 'active' | 'sold' | 'disposed' | 'under_maintenance' | 'rented_out';
  sold_date?: string;
  sold_price?: number;
  sold_to?: string;
  notes?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  document_count?: number;
  maintenance_count?: number;
  documents?: AssetDocument[];
  maintenance_records?: AssetMaintenance[];
}

export interface AssetDocument {
  document_id: number;
  asset_id: number;
  document_type: 'purchase_invoice' | 'registration' | 'insurance' | 'warranty' | 'maintenance' | 'photo' | 'other';
  document_name: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  upload_date: string;
  uploaded_by: number;
  notes?: string;
}

export interface AssetMaintenance {
  maintenance_id: number;
  asset_id: number;
  maintenance_date: string;
  maintenance_type?: string;
  description?: string;
  cost: number;
  currency_id: number;
  currency?: string;
  currency_symbol?: string;
  service_provider?: string;
  next_service_date?: string;
  notes?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
}

export interface AssetType {
  type_id: number;
  type_name: string;
  type_icon: string;
  description?: string;
  is_active: boolean;
}

export interface AssetLookups {
  asset_types: AssetType[];
  currencies: Array<{
    currency_id: number;
    short_name: string;
    symbol: string;
    full_name: string;
  }>;
  statuses: Array<{
    value: string;
    label: string;
  }>;
  conditions: Array<{
    value: string;
    label: string;
  }>;
}

export interface AssetFilters {
  search?: string;
  status?: string;
  asset_type_id?: number;
  page?: number;
  limit?: number;
}

