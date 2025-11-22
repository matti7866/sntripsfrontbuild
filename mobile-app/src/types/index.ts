// Auth Types
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
  message?: string;
  token?: string;
  user?: User;
}

// Ticket Types
export interface Ticket {
  ticket: number;
  ticketNumber?: string;
  Pnr: string;
  customer_id: number;
  passenger_name: string;
  date_of_travel: string;
  return_date?: string;
  from_id: number;
  to_id: number;
  sale: number;
  currencyID: number;
  staff_id: number;
  supp_id: number;
  net_price: number;
  net_CurrencyID: number;
  ticketCopy?: string;
  branchID: number;
  remarks?: string;
  flight_number?: string;
  return_flight_number?: string;
  departure_time?: string;
  arrival_time?: string;
  return_departure_time?: string;
  return_arrival_time?: string;
  flight_type: 'OW' | 'RT';
  datetime: string;
  status?: number;
  
  // Joined data
  customer_name?: string;
  customer_phone?: string;
  from_code?: string;
  to_code?: string;
  currency_name?: string;
  net_currency_name?: string;
  supplier_name?: string;
  staff_name?: string;
  from_place?: string;
  to_place?: string;
}

export interface TicketFilters {
  customerId?: number;
  startDate?: string;
  endDate?: string;
}

// Payment Types
export interface CustomerPayment {
  pay_id: number;
  customer_id: number;
  customer_name?: string;
  payment_amount: number;
  datetime: string;
  remarks?: string;
  accountID: number;
  account_Name?: string;
  currencyID: number;
  currencyName?: string;
  staff_id: number;
  staff_name?: string;
}

export interface CustomerPaymentFilters {
  customer?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

// Travel Types
export interface UpcomingTravel {
  ticket: number;
  ticketNumber?: string;
  Pnr: string;
  passenger_name: string;
  from_place: string;
  to_place: string;
  date_of_travel: string;
  return_date?: string;
  flight_type: string;
  customer_name: string;
  flight_number?: string;
  departure_time?: string;
  arrival_time?: string;
}

// Loyalty Card Types
export interface LoyaltyCard {
  card_id: number;
  customer_id: number;
  card_number: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  created_at: string;
  updated_at: string;
  customer_name?: string;
}

export interface LoyaltyCardTransaction {
  transaction_id: number;
  card_id: number;
  points: number;
  type: 'earned' | 'redeemed';
  description: string;
  created_at: string;
}

