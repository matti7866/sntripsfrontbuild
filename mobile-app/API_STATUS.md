# API Endpoints Status

## Development Mode Active

The app is currently configured for **development mode** with graceful error handling for missing API endpoints.

## API Endpoints Used

### ✅ Working Endpoints (Required)
These endpoints should work with customer ID 558:

1. **Tickets**
   - `GET /ticket/list.php?customerId=558`
   - Returns array of ticket objects

2. **Payments**
   - `POST /payment/customerPayments.php`
   - Body: `{"action": "searchPayments", "customer": 558, "per_page": 50}`
   - Returns payment history

### ⚠️ Optional Endpoints (Gracefully Handled)
These endpoints return 404 but app continues to work:

3. **Flights/Travels**
   - `GET /calendar/flights.php?customerId=558&startDate=2024-01-01`
   - **Status**: 404 - Endpoint may not exist
   - **Impact**: Shows "No upcoming travels" message
   - **Fallback**: Returns empty array

4. **Loyalty Card**
   - `GET /loyalty/card.php?customerId=558`
   - **Status**: 404 - New feature, needs backend implementation
   - **Impact**: Shows "Get Your Loyalty Card" button
   - **Fallback**: Returns null

### 🔒 Auth Endpoints (Bypassed in Dev)
These are currently bypassed for development:

5. **Auth Verification**
   - `GET /auth/me.php`
   - `GET /auth/verify.php`
   - **Status**: Bypassed in development mode
   - **Reason**: Prevents 404 errors during development
   - **Dev Behavior**: Uses locally stored user data

## Error Handling

All API calls now have graceful error handling:

```typescript
try {
  const response = await apiClient.get(endpoint);
  return response.data;
} catch (error) {
  if (error.response?.status === 404) {
    console.log('Endpoint not found, using fallback');
    return fallbackValue;
  }
  console.error('API Error:', error);
  return fallbackValue;
}
```

## Testing with Real Data

### Customer ID: 558
- Base URL: `https://app.sntrips.com/api`
- Backend: `https://app.sntrips.com/customer/view?id=558&curID=1`

### Test API Calls

**Test Tickets:**
```bash
curl "https://app.sntrips.com/api/ticket/list.php?customerId=558"
```

**Test Payments:**
```bash
curl -X POST "https://app.sntrips.com/api/payment/customerPayments.php" \
  -H "Content-Type: application/json" \
  -d '{"action":"searchPayments","customer":558,"per_page":50}'
```

**Test Travels (may 404):**
```bash
curl "https://app.sntrips.com/api/calendar/flights.php?customerId=558&startDate=2024-01-01"
```

## Production Readiness

### To Enable Full Production Mode:

1. **Uncomment Auth Verification** in `src/services/authService.ts`:
   ```typescript
   // Lines 94-111 and 113-123
   ```

2. **Implement Missing Endpoints**:
   - `/calendar/flights.php` for upcoming travels
   - `/loyalty/card.php` for loyalty cards
   - `/loyalty/transactions.php` for point transactions

3. **Test All Endpoints** with actual customer data

4. **Update Error Handling** to show appropriate user messages

## Current Behavior

✅ **App works without errors**
✅ **Shows real data** for tickets and payments
✅ **Gracefully handles** missing endpoints
✅ **No console errors** that crash the app
✅ **Empty states** show helpful messages

## What Users See

- **Dashboard**: Loyalty card creation button (endpoint doesn't exist yet)
- **Tickets**: Real ticket data or empty state
- **Travels**: Empty state (endpoint returns 404)
- **Payments**: Real payment data or empty state

## Notes

- All 404 errors are caught and logged
- App continues to function normally
- Users see appropriate empty states
- No red error screens
- Development mode allows testing without full backend


