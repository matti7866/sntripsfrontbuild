# SNT Customer Management Mobile App - Project Summary

## Overview

A professional React Native mobile application built with Expo for customer management. The app integrates with your existing web application's API and provides customers with easy access to their travel information, payments, and loyalty rewards.

## Features Implemented

### ✅ 1. Authentication System
- **OTP-based login** - Secure email/OTP authentication matching your web app
- **Token management** - Automatic token storage and refresh
- **Session handling** - Persistent login sessions

### ✅ 2. Dashboard with Loyalty Card
- **Digital Loyalty Card** - Beautiful card display with QR code
- **Points tracking** - Real-time points display
- **Tier system** - Bronze, Silver, Gold, Platinum tiers
- **Quick actions** - Easy navigation to main features

### ✅ 3. Ticket Copies Management
- **View all tickets** - List of all customer tickets
- **Ticket details** - PNR, flight info, dates, amounts
- **Download/Share** - View and share ticket copies
- **Upcoming indicator** - Visual indicator for upcoming trips

### ✅ 4. Upcoming Travels
- **Travel calendar** - View all upcoming trips
- **Travel details** - Full flight information
- **Days until travel** - Countdown to departure
- **Soon badge** - Highlights trips within 7 days

### ✅ 5. Recent Payments
- **Payment history** - List of all customer payments
- **Payment details** - Amount, date, account, remarks
- **Total summary** - Quick view of total payments
- **Recent indicator** - Highlights payments from last 30 days

## Project Structure

```
mobile-app/
├── src/
│   ├── config/
│   │   └── api.ts                 # API configuration
│   ├── context/
│   │   └── AuthContext.tsx        # Authentication context
│   ├── navigation/
│   │   └── AppNavigator.tsx      # Navigation setup
│   ├── screens/
│   │   ├── LoginScreen.tsx        # Login/OTP screen
│   │   ├── DashboardScreen.tsx    # Main dashboard
│   │   ├── TicketsScreen.tsx      # Ticket copies
│   │   ├── TravelsScreen.tsx      # Upcoming travels
│   │   └── PaymentsScreen.tsx     # Recent payments
│   ├── services/
│   │   ├── api.ts                 # Base API client
│   │   ├── authService.ts         # Auth operations
│   │   ├── ticketService.ts       # Ticket operations
│   │   ├── travelService.ts       # Travel operations
│   │   ├── paymentService.ts      # Payment operations
│   │   └── loyaltyCardService.ts  # Loyalty card operations
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   └── utils/
│       └── storage.ts              # AsyncStorage wrapper
├── database/
│   └── loyalty_card_schema.sql    # Database schema
├── backend-api-example/
│   └── loyalty/
│       ├── card.php                # Loyalty card API
│       └── transactions.php        # Transactions API
├── App.tsx                         # Main app component
├── package.json                    # Dependencies
├── README.md                       # Documentation
└── SETUP.md                        # Setup guide
```

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **UI Components**: React Native Paper, Custom components
- **Styling**: StyleSheet API
- **QR Code**: react-native-qrcode-svg
- **Gradients**: react-native-linear-gradient
- **Date Handling**: date-fns

## API Integration

The app uses the same API endpoints as your web application:

### Existing Endpoints Used:
- `/auth/send-otp.php` - Send OTP
- `/auth/verify-otp.php` - Verify OTP
- `/auth/login.php` - Password login (fallback)
- `/auth/me.php` - Get current user
- `/auth/verify.php` - Verify token
- `/ticket/list.php` - Get tickets
- `/payment/customerPayments.php` - Get payments
- `/calendar/flights.php` - Get upcoming flights

### New Endpoints Required:
- `/loyalty/card.php` - Get/Create loyalty card
- `/loyalty/transactions.php` - Get/Add transactions

## Database Schema

### New Tables Created:

1. **loyalty_cards**
   - Stores customer loyalty card information
   - Auto-updates tier based on points
   - Generates unique card numbers

2. **loyalty_transactions**
   - Tracks all point transactions
   - Supports earned/redeemed points
   - Links to loyalty cards

See `database/loyalty_card_schema.sql` for full schema.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd mobile-app
   npm install
   ```

2. **Set Up Database**
   - Run `database/loyalty_card_schema.sql` in your database
   - Verify tables are created

3. **Deploy API Endpoints**
   - Copy PHP files from `backend-api-example/loyalty/` to your API directory
   - Update database connection paths
   - Test endpoints

4. **Configure API URL**
   - Update `src/config/api.ts` if needed
   - Default: `https://app.sntrips.com/api`

5. **Start Development**
   ```bash
   npm start
   ```

## Key Implementation Details

### Authentication Flow
1. User enters email
2. System sends OTP via email
3. User enters 6-digit OTP
4. System verifies and returns JWT token
5. Token stored in AsyncStorage
6. Token included in all API requests

### Loyalty Card System
- Cards are auto-created on first dashboard visit
- Points can be earned/redeemed via API
- Tier automatically updates based on points:
  - Bronze: 0-1,999 points
  - Silver: 2,000-4,999 points
  - Gold: 5,000-9,999 points
  - Platinum: 10,000+ points

### Data Flow
- All screens fetch data on mount
- Pull-to-refresh available on all lists
- Loading states for better UX
- Error handling with user-friendly messages

## Customization Points

1. **Customer ID**: Currently uses default value for testing. Update to use authenticated user's customer_id
2. **Colors**: Update color scheme in StyleSheet files
3. **Tier Thresholds**: Modify in database trigger or API logic
4. **Points Calculation**: Implement business logic in backend API

## Production Checklist

- [ ] Update customer_id handling to use authenticated user
- [ ] Deploy loyalty card API endpoints
- [ ] Test all API endpoints
- [ ] Configure app icons and splash screens
- [ ] Set up app store accounts
- [ ] Configure push notifications (optional)
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing

## Support & Maintenance

- All API calls include error handling
- Console logging for debugging
- Refresh functionality on all screens
- Offline handling (can be enhanced)

## Next Steps

1. Test the app with your API
2. Deploy backend endpoints
3. Update customer_id handling
4. Customize branding/colors
5. Add additional features as needed
6. Prepare for app store submission

## Notes

- The app is designed to work with your existing API structure
- All endpoints match your web application's API
- The loyalty card feature is new and requires backend implementation
- The app uses modern React Native patterns and best practices
- TypeScript is used throughout for type safety

