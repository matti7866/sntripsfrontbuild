# SNT Customer Management Mobile App

A React Native mobile application for customer management, built with Expo. This app allows customers to manage their ticket copies, view upcoming travels, check recent payments, and access their loyalty card.

## Features

- 🔐 **Authentication**: OTP-based login system
- 🎫 **Ticket Management**: View and manage all ticket copies
- ✈️ **Upcoming Travels**: View upcoming travel dates and details
- 💳 **Recent Payments**: Track payment history
- 🎁 **Loyalty Card**: Digital loyalty card with QR code and points tracking

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Studio (for Android development)

## Installation

1. Navigate to the mobile-app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npm start
```

4. Run on your device:
   - **iOS**: Press `i` in the terminal or scan QR code with Expo Go app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

## Project Structure

```
mobile-app/
├── src/
│   ├── config/          # API configuration
│   ├── context/         # React contexts (Auth)
│   ├── navigation/      # Navigation setup
│   ├── screens/         # App screens
│   ├── services/        # API services
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── App.tsx              # Main app component
├── app.json             # Expo configuration
└── package.json         # Dependencies
```

## API Integration

The app uses the same API as the web application:
- Base URL: `https://app.sntrips.com/api`
- Authentication: Bearer token (JWT)
- All endpoints match the web app's API structure

## Database Schema

### Loyalty Card Table

You'll need to create a new table in your database for the loyalty card feature:

```sql
CREATE TABLE IF NOT EXISTS loyalty_cards (
  card_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  card_number VARCHAR(50) UNIQUE NOT NULL,
  points INT DEFAULT 0,
  tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
  INDEX idx_customer_id (customer_id),
  INDEX idx_card_number (card_number)
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  transaction_id INT AUTO_INCREMENT PRIMARY KEY,
  card_id INT NOT NULL,
  points INT NOT NULL,
  type ENUM('earned', 'redeemed') NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES loyalty_cards(card_id) ON DELETE CASCADE,
  INDEX idx_card_id (card_id),
  INDEX idx_created_at (created_at)
);
```

## Backend API Endpoints Required

The app expects the following API endpoints:

### Loyalty Card Endpoints

1. **GET /loyalty/card.php?customerId={id}**
   - Returns loyalty card for a customer
   - Response: `{ success: boolean, data: LoyaltyCard }`

2. **POST /loyalty/card.php**
   - Creates a new loyalty card
   - Body: `{ action: 'create', customer_id: number }`
   - Response: `{ success: boolean, data: LoyaltyCard, message?: string }`

3. **GET /loyalty/transactions.php?cardId={id}**
   - Returns transaction history for a card
   - Response: `{ success: boolean, data: LoyaltyCardTransaction[] }`

4. **POST /loyalty/transactions.php**
   - Adds a transaction (points earned/redeemed)
   - Body: `{ action: 'add', card_id: number, points: number, type: 'earned'|'redeemed', description: string }`
   - Response: `{ success: boolean, message?: string }`

## Configuration

Update the API base URL in `src/config/api.ts` if needed:

```typescript
export const API_CONFIG = {
  baseURL: 'https://app.sntrips.com/api',
  timeout: 30000,
};
```

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

Or use EAS Build:
```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

## Troubleshooting

1. **Metro bundler issues**: Clear cache with `expo start -c`
2. **Module not found**: Run `npm install` again
3. **API connection errors**: Check API base URL and network connectivity
4. **Authentication issues**: Verify token storage and API endpoints

## Notes

- The app currently uses a default `customer_id` of 1 for testing. In production, this should come from the authenticated user's data.
- Make sure your backend API supports CORS for mobile app requests.
- The loyalty card feature requires backend implementation of the endpoints mentioned above.

## License

Private - SNT Trips


