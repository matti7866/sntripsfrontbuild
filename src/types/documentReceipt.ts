export interface DocumentReceipt {
  id: number;
  receipt_number: string;
  customer_id?: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  transaction_type: 'received' | 'returned';
  transaction_date: string;
  document_types: DocumentType[];
  label?: string;
  notes?: string;
  received_by?: string;
  received_by_id?: number;
  returned_by?: string;
  returned_by_id?: number;
  attachments?: DocumentAttachment[];
  status: 'with_company' | 'with_customer';
  created_at: string;
  updated_at?: string;
  original_receipt_id?: number; // Link to the original receipt when returning
}

export interface DocumentType {
  id?: number;
  receipt_id?: number;
  document_type_name: string;
  quantity: number;
  description?: string;
}

export interface DocumentAttachment {
  id?: number;
  receipt_id?: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at?: string;
}

export interface DocumentTypeOption {
  id: number;
  type_name: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateDocumentReceiptRequest {
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  transaction_type: 'received' | 'returned';
  transaction_date: string;
  document_types: Omit<DocumentType, 'id' | 'receipt_id'>[];
  label?: string;
  notes?: string;
  original_receipt_id?: number;
  attachments?: File[];
}

export interface UpdateDocumentReceiptRequest {
  id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  label?: string;
  notes?: string;
  document_types?: Omit<DocumentType, 'id' | 'receipt_id'>[];
  attachments?: File[];
}

export interface DocumentReceiptFilters {
  search?: string;
  transaction_type?: 'received' | 'returned' | 'all';
  status?: 'with_company' | 'with_customer' | 'all';
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

export interface DocumentReceiptStats {
  total_received: number;
  total_returned: number;
  currently_with_company: number;
  currently_with_customer: number;
}

export interface ReceiptPrintData {
  receipt: DocumentReceipt;
  company_info?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

export interface CustomerOption {
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
}

