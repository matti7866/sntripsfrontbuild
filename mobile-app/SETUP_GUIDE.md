# Setup Guide - SN Travels EID Staff Mobile App

This guide will walk you through setting up and running the Emirates ID Staff mobile application.

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v16 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** or **yarn** (comes with Node.js)
   - Verify npm: `npm --version`
   - Or install yarn: `npm install -g yarn`

3. **Expo CLI** (for React Native development)
   ```bash
   npm install -g expo-cli
   ```

4. **Code Editor** (recommended: VS Code)
   - Download from [code.visualstudio.com](https://code.visualstudio.com/)

5. **Mobile Device or Emulator**
   - **iOS**: Mac required for iOS Simulator (Xcode)
   - **Android**: Android Studio for Android Emulator
   - **Physical Device**: Expo Go app (easiest option)

## Step 1: Install Dependencies

1. Navigate to the mobile app directory:
   ```bash
   cd /Applications/XAMPP/xamppfiles/htdocs/snt/react-frontend/mobile-app
   ```

2. Install all required packages:
   ```bash
   npm install
   ```
   
   This will install:
   - React Native and Expo
   - Navigation libraries
   - Camera and image picker
   - HTTP client (Axios)
   - All other dependencies

## Step 2: Configure API Endpoint

**IMPORTANT**: You must configure the backend API URL before running the app.

1. Open the API configuration file:
   ```bash
   code src/config/api.ts
   ```

2. Update the `BASE_URL` with your actual backend URL:

   ```typescript
   export const API_CONFIG = {
     // PRODUCTION: Use your production domain
     BASE_URL: 'https://yourdomain.com/api',
     
     // OR DEVELOPMENT: Use your local IP address (NOT localhost)
     // BASE_URL: 'http://192.168.1.100/api',
     
     TIMEOUT: 30000,
     HEADERS: {
       'Content-Type': 'application/json',
     },
   };
   ```

   **Finding your local IP:**
   - **Mac**: System Preferences > Network > Select Wi-Fi/Ethernet > IP Address
   - **Windows**: Open CMD > `ipconfig` > Look for IPv4 Address
   - **Linux**: Terminal > `ip addr show` or `ifconfig`

3. Save the file.

## Step 3: Add Logo Assets (Optional)

The app expects a logo file. You can either:

1. **Option A**: Copy your logo to:
   ```bash
   cp /path/to/your/logo.png mobile-app/assets/logo-white.png
   ```

2. **Option B**: Use the default placeholder (app will still work)

3. **Option C**: Update the logo path in `src/screens/LoginScreen.tsx` line 107:
   ```typescript
   source={require('../../assets/your-logo.png')}
   ```

## Step 4: Run the Application

### Method 1: Using Expo Go (Easiest - Recommended for Testing)

1. **Install Expo Go on your mobile device:**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Connect your device:**
   - Ensure your device is on the **same Wi-Fi network** as your computer
   - **iOS**: Open Camera app and scan the QR code
   - **Android**: Open Expo Go app and scan the QR code

4. Wait for the app to build and load on your device

### Method 2: iOS Simulator (Mac Only)

1. **Install Xcode** from the Mac App Store (if not already installed)

2. **Run on iOS Simulator:**
   ```bash
   npm run ios
   ```

3. This will:
   - Start Expo dev server
   - Launch iOS Simulator
   - Install and run the app

### Method 3: Android Emulator

1. **Install Android Studio** and set up an AVD (Android Virtual Device)

2. **Start an emulator** from Android Studio

3. **Run on Android:**
   ```bash
   npm run android
   ```

## Step 5: Test the Application

### Test Login Flow

1. **Enter your email** (must be registered staff email in backend)
2. **Click "Send OTP"**
3. **Check your email** for the OTP code
4. **Enter the 6-digit OTP**
5. **Click "Verify & Login"**

If successful, you should see the 3-tab interface!

### Test Camera Scanning

**Note**: Camera only works on physical devices, not simulators/emulators.

1. Navigate to "Pending" tab
2. Tap any task's "Mark as Received" button
3. Tap "Scan Emirates ID" button
4. **Grant camera permission** when prompted
5. Position an Emirates ID in the frame
6. Tap the capture button (white circle)
7. The captured image will be attached to the form

## Common Issues & Solutions

### Issue 1: "Network request failed"

**Solution**: 
- Check that `BASE_URL` in `src/config/api.ts` is correct
- Ensure backend server is running
- For local development, use IP address (not localhost)
- Ensure device and computer are on same Wi-Fi network

### Issue 2: "Couldn't start project on Android"

**Solution**:
```bash
# Clear cache and restart
npm start -- --clear

# Or try
expo start -c
```

### Issue 3: Camera not working

**Solution**:
- Camera only works on physical devices
- Ensure camera permissions are granted
- Check that camera is not being used by another app
- Try closing and reopening the app

### Issue 4: "Unable to resolve module"

**Solution**:
```bash
# Clear node modules and reinstall
rm -rf node_modules
npm install

# Clear watchman cache (Mac/Linux)
watchman watch-del-all

# Restart with cleared cache
npm start -- --clear
```

### Issue 5: Slow loading or white screen

**Solution**:
- This is normal on first run (app is building)
- Subsequent launches will be faster
- Check terminal for error messages
- Ensure stable internet connection

## Development Workflow

### Hot Reload

Expo supports fast refresh. Any changes you make to the code will automatically reload in the app:

1. Save a file in your editor
2. App automatically refreshes
3. State is preserved (in most cases)

### Viewing Logs

Terminal where you ran `npm start` will show:
- Console.log output
- Errors and warnings
- Network requests

### Developer Menu

On device, shake it or:
- **iOS**: Cmd+D
- **Android**: Cmd+M

This opens developer menu with options:
- Reload
- Debug Remote JS
- Show Performance Monitor
- Toggle Inspector

### Debugging

1. Open developer menu
2. Select "Debug Remote JS"
3. Browser opens with Chrome DevTools
4. Use breakpoints, console, network tab

## Building for Production

### iOS (TestFlight/App Store)

```bash
# Build for iOS
expo build:ios

# Or with EAS (newer method)
npx eas-cli build --platform ios
```

### Android (APK/AAB)

```bash
# Build APK for testing
expo build:android -t apk

# Build AAB for Play Store
expo build:android -t app-bundle

# Or with EAS
npx eas-cli build --platform android
```

## Testing Checklist

Before deploying to production, test:

- [ ] Login with OTP
- [ ] View all three tabs
- [ ] Pull to refresh on each tab
- [ ] Mark EID as received
- [ ] Camera scanning
- [ ] Image upload from gallery
- [ ] Mark EID as delivered
- [ ] Logout functionality
- [ ] App works on poor network
- [ ] App works offline (graceful error handling)

## API Endpoint Reference

The app expects these endpoints (ensure your backend provides them):

### Authentication
- `POST /auth/send-otp.php` - Send OTP
- `POST /auth/verify-otp.php` - Verify OTP and login
- `GET /auth/me.php` - Get current user
- `POST /auth/logout.php` - Logout

### Emirates ID Tasks
- `GET /visa/eid-tasks.php?step={pending|received|delivered}` - Get tasks
- `POST /visa/eid-tasks-controller.php` - Mark received/delivered
  - Actions: `getResidence`, `getPositions`, `getCompanies`, `markReceived`, `markDelivered`

## Next Steps

1. **Test thoroughly** on different devices
2. **Gather feedback** from staff
3. **Monitor logs** for any errors
4. **Update API configuration** for production
5. **Build and deploy** to TestFlight/Play Store

## Support

For technical issues:
1. Check this guide first
2. Review error messages in terminal
3. Check Expo documentation: [docs.expo.dev](https://docs.expo.dev/)
4. Contact your development team

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated**: November 2024
**Version**: 1.0.0




