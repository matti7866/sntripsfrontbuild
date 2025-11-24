# Development Credentials & Configuration

## Test Login Credentials

For development and testing purposes, use these credentials to bypass OTP verification:

### 📱 Phone Number
```
501234567
```
(Enter without country code - +971 is automatically added)

### 🔐 OTP Code
```
123456
```

## Development Customer ID

**Customer ID: 558**
- Backend URL: https://app.sntrips.com/customer/view?id=558&curID=1
- Currency ID: 1 (AED)

This customer ID is used for all API calls during development to fetch real data.

## How to Login (Development)

1. Open the app in iOS Simulator
2. You'll see the login screen with UAE flag and +971 country code (locked)
3. Enter phone number: `501234567`
4. Tap "Send OTP"
5. You'll see alert: "Development Mode - Use OTP: 123456"
6. Enter OTP: `123456`
7. Tap "Verify OTP"
8. You'll be logged in with Customer ID 558

## Mock User Data

When you login with development credentials, you get:

```json
{
  "staff_id": 558,
  "name": "Test Customer",
  "email": "test@sntrips.com",
  "customer_id": 558
}
```

## Features Available with Customer ID 558

✅ **Dashboard**
- Loyalty Card (will be created automatically for customer 558)

✅ **Tickets Screen**
- Shows all tickets for customer_id: 558
- API: GET /ticket/list.php?customerId=558

✅ **Upcoming Travels**
- Shows upcoming flights for customer_id: 558
- API: GET /calendar/flights.php?customerId=558&startDate={today}

✅ **Recent Payments**
- Shows payment history for customer_id: 558
- API: POST /payment/customerPayments.php
  ```json
  {
    "action": "searchPayments",
    "customer": 558,
    "per_page": 50
  }
  ```

## API Configuration

All API calls use:
- **Base URL**: https://app.sntrips.com/api
- **Customer ID**: 558
- **Currency ID**: 1 (AED)

## Changing Customer ID

To test with a different customer:

1. Open `src/config/constants.ts`
2. Change `DEV_CUSTOMER_ID` value:
   ```typescript
   export const DEV_CUSTOMER_ID = 558; // Change this
   ```

Or update in each screen individually:
- `src/screens/DashboardScreen.tsx`
- `src/screens/TicketsScreen.tsx`
- `src/screens/TravelsScreen.tsx`
- `src/screens/PaymentsScreen.tsx`
- `src/screens/LoginScreen.tsx`

## Production Mode

For production, the app will:
1. Accept any valid UAE phone number (+971 XXXXXXXXX)
2. Send real OTP via SMS/API
3. Verify OTP against your backend
4. Return actual customer data from API
5. Use customer_id from authenticated user

## Switching Between Dev and Production

The app automatically detects dev credentials. To disable dev bypass:

1. Open `src/screens/LoginScreen.tsx`
2. Comment out or remove these lines:

```typescript
// Development bypass
const DEV_PHONE = '501234567';
const DEV_OTP = '123456';
```

## API Testing

You can test the APIs directly:

### Get Customer Tickets
```bash
curl "https://app.sntrips.com/api/ticket/list.php?customerId=558"
```

### Get Customer Payments
```bash
curl -X POST "https://app.sntrips.com/api/payment/customerPayments.php" \
  -H "Content-Type: application/json" \
  -d '{"action":"searchPayments","customer":558,"per_page":50}'
```

### Get Upcoming Flights
```bash
curl "https://app.sntrips.com/api/calendar/flights.php?customerId=558&startDate=2024-01-01"
```

## Notes

- Country code +971 (UAE) is **locked** and cannot be changed
- Phone input accepts 9 digits after +971
- Format: +971 XX XXX XXXX
- Dev credentials work offline (no API call needed)
- Production credentials require API endpoint for OTP
- All data fetched is real data from customer ID 558
