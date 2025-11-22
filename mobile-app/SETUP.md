# Setup Guide for SNT Customer Mobile App

## Quick Start

1. **Install Dependencies**
   ```bash
   cd mobile-app
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Run on Device**
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal
   - Or press `i` for iOS simulator, `a` for Android emulator

## Backend Setup

### 1. Database Setup

Run the SQL script to create loyalty card tables:

```bash
mysql -u your_username -p your_database < database/loyalty_card_schema.sql
```

Or manually execute the SQL in `database/loyalty_card_schema.sql`

### 2. API Endpoints

Copy the PHP files from `backend-api-example/loyalty/` to your backend API directory:

```
/api/loyalty/card.php
/api/loyalty/transactions.php
```

Make sure to:
- Update database connection paths in the PHP files
- Ensure proper authentication middleware is applied
- Test endpoints with Postman or similar tool

### 3. API Endpoint Testing

**Get Loyalty Card:**
```bash
GET /api/loyalty/card.php?customerId=1
```

**Create Loyalty Card:**
```bash
POST /api/loyalty/card.php
Content-Type: application/json

{
  "action": "create",
  "customer_id": 1
}
```

**Get Transactions:**
```bash
GET /api/loyalty/transactions.php?cardId=1
```

**Add Transaction:**
```bash
POST /api/loyalty/transactions.php
Content-Type: application/json

{
  "action": "add",
  "card_id": 1,
  "points": 100,
  "type": "earned",
  "description": "Ticket purchase"
}
```

## Configuration

### API Base URL

Update `src/config/api.ts` if your API URL is different:

```typescript
export const API_CONFIG = {
  baseURL: 'https://your-api-domain.com/api',
  timeout: 30000,
};
```

### Customer ID

Currently, the app uses a default `customer_id` of 1 for testing. In production:

1. Update your authentication API to return `customer_id` in the user object
2. Update screens to use `user.customer_id` instead of hardcoded value

Example in `src/screens/DashboardScreen.tsx`:
```typescript
// Change from:
const customerId = (user as any)?.customer_id || 1;

// To:
const customerId = user?.customer_id; // Make sure API returns this
```

## Troubleshooting

### Common Issues

1. **"Network request failed"**
   - Check API base URL
   - Ensure backend CORS is configured
   - Verify API endpoints are accessible

2. **"Module not found"**
   - Run `npm install` again
   - Clear Expo cache: `expo start -c`

3. **"Loyalty card not found"**
   - Ensure database tables are created
   - Check API endpoint is working
   - Verify customer_id exists in database

4. **QR Code not displaying**
   - Check `react-native-qrcode-svg` is installed
   - Verify card_number is being generated

### Development Tips

- Use React Native Debugger for better debugging
- Enable network inspection in Expo Dev Tools
- Check console logs for API errors
- Test API endpoints independently before testing in app

## Production Build

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

Or use EAS Build (recommended):
```bash
npm install -g eas-cli
eas login
eas build --platform ios
eas build --platform android
```

## Next Steps

1. ✅ Set up database tables
2. ✅ Deploy API endpoints
3. ✅ Test API endpoints
4. ✅ Update customer_id handling
5. ✅ Test app with real data
6. ✅ Configure push notifications (optional)
7. ✅ Set up app store accounts
8. ✅ Build and deploy to stores

