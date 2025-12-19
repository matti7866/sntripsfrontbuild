export interface Deposit {
  deposit_ID: number;
  deposit_amount: number;
  currencyID: number;
  currencyName?: string;
  datetime: string;
  depositBy: number;
  depositByName?: string;
  accountID: number;
  accountName?: string;
  remarks: string;
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

export interface CreateDepositRequest {
  accountID: number;
  deposit_amount: number;
  currencyID: number;
  datetime: string;
  remarks: string;
}

export interface UpdateDepositRequest {
  deposit_ID: number;
  accountID: number;
  deposit_amount: number;
  currencyID: number;
  datetime: string;
  remarks: string;
}

export interface DepositResponse {
  status?: string;
  success?: boolean;
  message?: string;
  data?: Deposit | Deposit[];
  errors?: Record<string, string>;
}
