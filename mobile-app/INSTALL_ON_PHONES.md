# How to Install SN Travels EID App on Staff Phones 📱

This is a **simple step-by-step guide** for installing the app on your staff's phones.

## Recommended Method: EAS Build

This is the professional way to distribute your app without going through App Store/Play Store review.

---

## 🍎 For iPhone Users

### Method 1: TestFlight (Best for iOS)

TestFlight lets you distribute to up to 100 staff members easily.

#### Initial Setup (One-time, you do this):

1. **Get Apple Developer Account**:
   - Go to [developer.apple.com](https://developer.apple.com)
   - Sign up ($99/year)
   - Complete enrollment

2. **Install EAS CLI** (on your Mac):
   ```bash
   npm install -g eas-cli
   ```

3. **Login to Expo**:
   ```bash
   eas login
   ```
   Create free account at expo.dev if needed

4. **Build the app**:
   ```bash
   cd /Applications/XAMPP/xamppfiles/htdocs/snt/react-frontend/mobile-app
   eas build --platform ios
   ```
   
   - First time will ask for Apple ID credentials
   - Select "internal distribution" or "App Store"
   - Wait 15-20 minutes for build

5. **Submit to TestFlight**:
   ```bash
   eas submit --platform ios
   ```

6. **Add testers in App Store Connect**:
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Select your app
   - Go to TestFlight tab
   - Add staff emails under "Internal Testing"

#### For Each Staff Member:

1. **Receive email** from TestFlight
2. **Install TestFlight** app from App Store
3. **Open the email on iPhone**
4. **Tap "View in TestFlight"**
5. **Tap "Accept" then "Install"**
6. Done! App appears on home screen

---

## 🤖 For Android Users

### Method 1: Direct APK Install (Easiest for Android)

No Google Play account needed!

#### Initial Setup (One-time, you do this):

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Build APK**:
   ```bash
   cd /Applications/XAMPP/xamppfiles/htdocs/snt/react-frontend/mobile-app
   eas build --platform android --profile production
   ```
   
   When asked: Select **APK** (not AAB)
   
   Wait 15-20 minutes for build

3. **Download APK**:
   - Link appears in terminal
   - Or go to [expo.dev](https://expo.dev) → Your project → Builds
   - Download the .apk file

4. **Share APK with staff**:
   - Upload to Google Drive/Dropbox
   - Share link with all staff
   - Or email the APK file directly

#### For Each Staff Member:

1. **Enable "Install from Unknown Sources"**:
   - Open Settings
   - Go to Security or Apps
   - Enable "Install from Unknown Sources"
   - Or "Install Unknown Apps" → Enable for Chrome/Files

2. **Download the APK**:
   - Open the shared link on Android phone
   - Download the APK file

3. **Install**:
   - Tap the downloaded APK file
   - Tap "Install"
   - Tap "Open"

4. Done! App appears in app drawer

---

## 🔄 Quick Alternative: Expo Go (Testing Only)

If you want to test immediately without building:

### For ALL Phones (iOS & Android):

1. **Staff install Expo Go**:
   - iOS: App Store → Search "Expo Go"
   - Android: Play Store → Search "Expo Go"

2. **You run the server** (keep it running):
   ```bash
   cd /Applications/XAMPP/xamppfiles/htdocs/snt/react-frontend/mobile-app
   npx expo start --tunnel
   ```

3. **Share the QR code** that appears (take screenshot)

4. **Staff scan QR code**:
   - iOS: Open Camera app → Scan QR
   - Android: Open Expo Go → Scan QR

5. App loads in Expo Go (temporary, for testing)

**Note**: This requires you to keep the server running, and app runs inside Expo Go (not standalone).

---

## 📋 Comparison of Methods

| Method | iOS Cost | Android Cost | App Store Approval | Updates | Best For |
|--------|----------|--------------|-------------------|---------|----------|
| **Expo Go** | Free | Free | No | Instant | Testing |
| **TestFlight** | $99/year | N/A | No | Via EAS Update | iOS Production |
| **Direct APK** | N/A | Free | No | Manual reinstall | Android Production |
| **App Store** | $99/year | $25 one-time | Yes (1-2 weeks) | Via App Store | Public release |

---

## Recommended Approach

**For Your Use Case (Internal Staff Only):**

1. **iOS Staff**: Use **TestFlight** ($99/year)
2. **Android Staff**: Use **Direct APK** (FREE)
3. **Updates**: Use **EAS Update** (FREE)

### Why This Works Best:

- ✅ No app store approval needed
- ✅ Install in minutes, not weeks
- ✅ Push updates instantly
- ✅ Professional standalone app
- ✅ Your branding, no Expo Go
- ✅ Works for internal teams

---

## Step-by-Step for Your Team (Simplified)

### Phase 1: Update Production Config (5 min)

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/snt/react-frontend/mobile-app
```

Edit `src/config/api.ts`:
```typescript
BASE_URL: 'https://your-production-domain.com/snt/api',
```

### Phase 2: Build Apps (20 min)

```bash
# Install EAS
npm install -g eas-cli
eas login

# Build iOS
eas build --platform ios

# Build Android APK
eas build --platform android
```

Choose **APK** for Android.

### Phase 3: Distribute (10 min)

**iOS**:
```bash
eas submit --platform ios
```
Then add staff emails in App Store Connect → TestFlight

**Android**:
- Download APK from build link
- Upload to Google Drive
- Share link with all Android staff

### Phase 4: Staff Install (5 min per person)

**iOS Staff**:
1. Install TestFlight from App Store
2. Check email for invite
3. Tap link → Install

**Android Staff**:
1. Settings → Enable "Unknown Sources"
2. Download APK from shared link
3. Tap APK → Install

---

## Update the App Later

When you make changes:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/snt/react-frontend/mobile-app

# Push instant update (no reinstall needed)
eas update --branch production --message "Added search to dropdowns"
```

Staff open the app → Automatically gets the update!

---

## First Time Setup Script

Save this as `deploy.sh` in mobile-app folder:

```bash
#!/bin/bash

echo "🚀 SN Travels EID App Deployment"
echo "================================"

# Update production config
echo "1. Updating API config..."
# TODO: Update src/config/api.ts with production URL

# Build iOS
echo "2. Building iOS app..."
eas build --platform ios --non-interactive

# Build Android
echo "3. Building Android APK..."
eas build --platform android --non-interactive

echo "✅ Builds started! Check expo.dev for download links"
echo "Next steps:"
echo "  - iOS: eas submit --platform ios"
echo "  - Android: Download APK and share with staff"
```

Run: `bash deploy.sh`

---

## Cost Estimate for Your Team

**Minimum Cost (Android only)**:
- FREE (Direct APK distribution)

**With iOS Support**:
- $99/year (Apple Developer account)
- Everything else is FREE

**Optional**:
- Google Play: $25 one-time (if you want Play Store distribution)

---

## Summary: What You Need to Do

1. **Sign up for Expo**: [expo.dev](https://expo.dev) (FREE)
2. **Install EAS CLI**: `npm install -g eas-cli`
3. **Update API config**: Change BASE_URL to production
4. **Build apps**: `eas build --platform ios` and `eas build --platform android`
5. **Distribute**:
   - iOS: Submit to TestFlight, invite staff
   - Android: Share APK file
6. **Done!** Staff can install and use

**Total Time**: ~1 hour for first build, then instant updates

Need help with any step? Let me know!




