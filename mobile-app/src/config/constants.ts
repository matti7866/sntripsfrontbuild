// Development Configuration Constants

/**
 * Development Customer ID
 * This is used for testing with real data from the backend
 * Customer: https://app.sntrips.com/customer/view?id=558&curID=1
 */
export const DEV_CUSTOMER_ID = 558;

/**
 * Development Currency ID (AED)
 */
export const DEV_CURRENCY_ID = 1;

/**
 * Development Login Credentials
 */
export const DEV_CREDENTIALS = {
  phone: '501234567',
  otp: '123456',
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Loyalty Card
  loyaltyCard: '/loyalty/card.php',
  loyaltyTransactions: '/loyalty/transactions.php',
  
  // Tickets
  tickets: '/ticket/list.php',
  ticketDropdowns: '/ticket/dropdowns.php',
  
  // Payments
  customerPayments: '/payment/customerPayments.php',
  
  // Travels/Flights
  flights: '/calendar/flights.php',
  
  // Customer
  customer: '/customer/customers.php',
};

export default {
  DEV_CUSTOMER_ID,
  DEV_CURRENCY_ID,
  DEV_CREDENTIALS,
  API_ENDPOINTS,
};


