# SN Travels - Emirates ID Staff Mobile App

A React Native mobile application for SN Travels staff to manage Emirates ID delivery tasks. This app replicates the functionality of the web-based Emirates ID tasks page with added mobile scanning capabilities.

## Features

- **OTP-Based Authentication**: Secure login using email OTP
- **3-Tab Interface**:
  - **Pending Delivery**: View all Emirates IDs awaiting receipt from courier
  - **Received**: View Emirates IDs received and ready for delivery to customers
  - **Delivered**: History of all delivered Emirates IDs
  
- **Emirates ID Scanning**: 
  - Camera integration to scan Emirates IDs
  - Auto-capture or gallery upload
  - Image attachment for front and back of ID
  
- **Full Task Management**:
  - Mark IDs as received with complete details
  - Mark IDs as delivered to customers
  - View remaining balance, customer info, passport details
  - Filtered views (ML/FZ types)

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for tab and stack navigation
- **Expo Camera** for Emirates ID scanning
- **Expo Image Picker** for gallery uploads
- **AsyncStorage** for local data persistence
- **Axios** for API communication

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Physical device for camera testing (recommended)

## Installation

1. Navigate to the mobile app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure API endpoint:
   - Open `src/config/api.ts`
   - Update `BASE_URL` with your backend API URL:
     ```typescript
     export const API_CONFIG = {
       BASE_URL: 'https://yourdomain.com/api',
       ...
     };
     ```

## Running the App

### Development Mode

Start the Expo development server:
```bash
npm start
```

This will open Expo DevTools in your browser. From there you can:

### Run on iOS Simulator (Mac only):
```bash
npm run ios
```

### Run on Android Emulator:
```bash
npm run android
```

### Run on Physical Device:

1. Install **Expo Go** app on your device:
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code shown in terminal/DevTools with your device camera (iOS) or Expo Go app (Android)

## Project Structure

```
mobile-app/
├── src/
│   ├── components/          # Reusable components
│   │   ├── EIDScanner.tsx   # Emirates ID camera scanner
│   │   └── MarkReceivedModal.tsx  # Modal for marking ID as received
│   ├── config/              # Configuration files
│   │   ├── api.ts           # API configuration
│   │   └── constants.ts     # App constants
│   ├── context/             # React Context providers
│   │   └── AuthContext.tsx  # Authentication context
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.tsx # Main navigator with tabs
│   ├── screens/             # App screens
│   │   ├── LoginScreen.tsx          # OTP login
│   │   ├── PendingDeliveryScreen.tsx  # Pending tab
│   │   ├── ReceivedScreen.tsx       # Received tab
│   │   └── DeliveredScreen.tsx      # Delivered tab
│   ├── services/            # API services
│   │   ├── api.ts           # Base API client
│   │   ├── authService.ts   # Authentication API
│   │   └── eidService.ts    # Emirates ID API
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   └── utils/               # Utility functions
│       └── storage.ts       # AsyncStorage wrapper
├── App.tsx                  # App entry point
├── app.json                 # Expo configuration
└── package.json             # Dependencies

```

## Key Features Explained

### 1. OTP Login
- Staff enters their email address
- OTP is sent to email via backend
- Staff enters 6-digit OTP to authenticate
- JWT token stored locally for session management

### 2. Pending Delivery Tab
- Lists all Emirates IDs waiting to be received from courier
- Shows: ID, Passenger Name, Customer, Passport, EID Number, Balance
- "Mark as Received" button opens scanning modal

### 3. Mark as Received Modal
- **Scan Emirates ID** button opens camera
- Captures front and back images of ID
- Form fields:
  - EID Number (auto-filled from scan if OCR enabled)
  - EID Expiry Date
  - Passenger Full Name
  - Gender
  - Date of Birth
  - Occupation (dropdown)
  - Establishment Name (dropdown)
- Submits all data and images to backend

### 4. Received Tab
- Lists Emirates IDs received and ready for delivery
- Shows received date, expiry date
- "Mark as Delivered" button confirms delivery

### 5. Delivered Tab
- History of all delivered Emirates IDs
- Shows delivery date
- Read-only view

## API Integration

The app expects the following API endpoints (matching your React app):

### Authentication
- `POST /api/auth/send-otp.php` - Send OTP to email
- `POST /api/auth/verify-otp.php` - Verify OTP and get token
- `POST /api/auth/logout.php` - Logout user
- `GET /api/auth/me.php` - Get current user

### Emirates ID Tasks
- `GET /api/visa/eid-tasks.php?step={pending|received|delivered}` - Get tasks by step
- `POST /api/visa/eid-tasks-controller.php` - Mark as received/delivered
- `GET /api/visa/eid-tasks-controller.php` - Get residence, positions, companies data

## Camera Permissions

The app requires camera permissions to scan Emirates IDs. Permissions are handled automatically, but users must grant access when prompted.

### iOS
Permissions are configured in `app.json`:
```json
{
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "This app needs camera access to scan Emirates ID cards."
    }
  }
}
```

### Android
Permissions are configured in `app.json`:
```json
{
  "android": {
    "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE"]
  }
}
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

For more details, see [Expo Build Documentation](https://docs.expo.dev/classic/building-standalone-apps/).

## Troubleshooting

### Camera Not Working
- Ensure you're testing on a physical device (simulators don't have cameras)
- Check that camera permissions are granted
- Restart the app after granting permissions

### API Connection Issues
- Verify `BASE_URL` in `src/config/api.ts`
- Check that backend is running and accessible
- Check network connectivity on device
- For local development, use your computer's IP address instead of localhost

### Authentication Issues
- Clear app data: `rm -rf node_modules && npm install`
- Check AsyncStorage: Device Settings > Apps > Expo Go > Storage > Clear Data

## Development Tips

1. **Hot Reload**: Expo supports fast refresh - save files to see changes instantly
2. **Console Logs**: View logs in terminal where `npm start` is running
3. **Debugging**: Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android) for dev menu
4. **Network**: Use `expo start --tunnel` for testing on devices not on same network

## Support

For issues or questions, contact your development team or refer to:
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation Docs](https://reactnavigation.org/)

## License

Proprietary - SN Travels © 2024
