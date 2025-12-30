# Quick Start Guide 🚀

Get the SN Travels EID Staff app running in 5 minutes!

## Prerequisites

- Node.js installed (v16+)
- Mobile device with Expo Go app installed

## Step 1: Install Dependencies (2 min)

```bash
cd mobile-app
npm install
```

## Step 2: Configure API (1 min)

Edit `src/config/api.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://your-backend-url.com/api',  // ← Change this!
  ...
};
```

For local development, use your computer's IP address:
```typescript
BASE_URL: 'http://192.168.1.100/api',  // ← Your local IP
```

## Step 3: Run the App (2 min)

```bash
npm start
```

This opens Expo DevTools in your browser.

## Step 4: Open on Your Phone

1. **Install Expo Go** on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan the QR code** shown in terminal:
   - iOS: Use Camera app
   - Android: Use Expo Go app

3. **Wait for app to load** (first time takes 30-60 seconds)

## Step 5: Test Login

1. Enter your staff email
2. Click "Send OTP"
3. Check email for 6-digit code
4. Enter OTP and login

✅ **Done!** You should see the 3-tab Emirates ID interface.

## Camera Testing

**Important**: Camera scanning only works on physical devices (not simulators).

To test scanning:
1. Go to "Pending" tab
2. Tap a task's "Mark as Received"
3. Tap "Scan Emirates ID"
4. Grant camera permission
5. Capture photo of Emirates ID

## Need Help?

### App won't connect to backend?
- Check `BASE_URL` in `src/config/api.ts`
- Ensure phone and computer on same Wi-Fi
- Use IP address (not localhost) for local dev

### Camera not working?
- Only works on real devices (not simulators)
- Check camera permissions in phone settings
- Try gallery upload instead

### App loading slowly?
- First load takes time (building bundles)
- Subsequent loads are faster
- Check terminal for error messages

## Full Documentation

For detailed setup, troubleshooting, and production deployment, see:
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Complete setup instructions
- [README.md](./README.md) - Full documentation

## Quick Commands

```bash
# Start development server
npm start

# Run on iOS simulator (Mac only)
npm run ios

# Run on Android emulator
npm run android

# Clear cache and restart
npm start -- --clear
```

---

**Ready to go?** Start with `npm install` and follow the steps above! 🎉








