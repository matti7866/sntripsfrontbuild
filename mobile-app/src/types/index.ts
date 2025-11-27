// User & Authentication Types
export interface User {
  staff_id: number;
  name: string;
  email: string;
  picture?: string;
  role?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  staff?: {
    name: string;
    picture?: string;
  };
}

// Residence/EID Types
export interface ResidenceTask {
  residenceID: number;
  datetime: string;
  passenger_name: string;
  customer_name: string;
  company_name: string;
  company_number: string;
  passportNumber: string;
  countryName: string;
  countryCode: string;
  EmiratesIDNumber?: string;
  emiratesIDCost?: number;
  emiratesIDDate?: string;
  sale_price: number;
  paid_amount: number;
  completedStep: number;
  remarks?: string;
  uid?: string;
  mb_number?: string;
  eid_received?: boolean;
  eid_received_date?: string;
  eid_expiry?: string;
  eid_delivered?: boolean;
  eid_delivered_datetime?: string;
}

export interface ScannedIDData {
  idNumber: string;
  name?: string;
  nationality?: string;
  expiryDate?: string;
  dateOfBirth?: string;
}

export interface EmiratesIDSubmission {
  residenceID: number;
  emiratesIDNumber: string;
  emiratesIDCost: number;
  emiratesIDCurrency: number;
  emiratesIDChargeOn: '1' | '2'; // 1 = Account, 2 = Supplier
  emiratesIDChargedEntity: number;
  emiratesIDFile?: string; // base64 or file path
}

export interface EIDReceiveData {
  residenceID: number;
  eid_received: boolean;
  eid_received_date: string;
  eid_expiry?: string;
  scannedIDNumber?: string;
  attachmentFile?: string;
}

export interface EIDDeliverData {
  residenceID: number;
  eid_delivered: boolean;
  eid_delivered_datetime: string;
  recipient_name?: string;
  recipient_signature?: string;
}

// Lookup Types
export interface Currency {
  currencyID: number;
  currencyName: string;
}

export interface Account {
  account_ID: number;
  account_Name: string;
}

export interface Supplier {
  supp_id: number;
  supp_name: string;
}

export interface Lookups {
  currencies: Currency[];
  accounts: Account[];
  suppliers: Supplier[];
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface TasksResponse {
  residences: ResidenceTask[];
  stepCounts: Record<string, number>;
}
