export interface Withdrawal {
  withdrawal_ID: number;
  withdrawal_amount: number;
  currencyID: number;
  currencyName?: string;
  datetime: string;
  withdrawalBy: number;
  withdrawalByName?: string;
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

export interface CreateWithdrawalRequest {
  accountID: number;
  withdrawal_amount: number;
  currencyID: number;
  datetime: string;
  remarks: string;
}

export interface UpdateWithdrawalRequest {
  withdrawal_ID: number;
  accountID: number;
  withdrawal_amount: number;
  currencyID: number;
  datetime: string;
  remarks: string;
}

export interface WithdrawalResponse {
  status?: string;
  success?: boolean;
  message?: string;
  data?: Withdrawal | Withdrawal[];
  errors?: Record<string, string>;
}

