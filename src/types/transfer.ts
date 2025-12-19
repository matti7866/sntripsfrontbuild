export interface Transfer {
  id: number;
  datetime: string;
  from_account: number;
  fromAccountName?: string;
  to_account: number;
  toAccountName?: string;
  remarks: string;
  amount: number;
  charges: number;
  exchange_rate: number;
  trx: string;
  filename?: string | null;
  added_by: number;
  addedByName?: string;
}

export interface Account {
  account_ID: number;
  account_Name: string;
  accountNum?: string;
  accountType: number;
  currencyName?: string;
  curID?: number;
}

export interface Currency {
  currencyID: number;
  currencyName: string;
}

export interface CreateTransferRequest {
  from_account: number;
  to_account: number;
  amount: number;
  charges: number;
  exchange_rate: number;
  datetime: string;
  remarks: string;
  trx: string;
}

export interface UpdateTransferRequest {
  id: number;
  from_account: number;
  to_account: number;
  amount: number;
  charges: number;
  exchange_rate: number;
  datetime: string;
  remarks: string;
  trx: string;
}

export interface TransferResponse {
  status?: string;
  success?: boolean;
  message?: string;
  data?: Transfer | Transfer[];
  errors?: Record<string, string>;
}

