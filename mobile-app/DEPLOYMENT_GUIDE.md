# Production Deployment Guide 🚀

This guide explains how to deploy your SN Travels EID Staff app to production and install it on staff phones.

## Part 1: Configure for Production Server

### Step 1: Update API URL

Open `src/config/api.ts` and change the BASE_URL to your production server:

```typescript
export const API_CONFIG = {
  // PRODUCTION - Your live server
  BASE_URL: 'https://yourdomain.com/snt/api',
  
  // Example if your domain is sntravels.ae:
  // BASE_URL: 'https://sntravels.ae/snt/api',
  
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};
```

**Important**: 
- Use `https://` (secure) for production
- Make sure your server has SSL certificate installed
- The API path should match your actual backend structure

### Step 2: Test with Production Data

Before deploying to phones, test with production:

```bash
cd mobile-app
npx expo start --ios
# or
npx expo start --android
```

Login with your production credentials and verify:
- ✅ OTP emails are sent
- ✅ Login works
- ✅ Tasks load correctly
- ✅ Mark as Received works
- ✅ Mark as Delivered works

---

## Part 2: Install on Staff Phones

You have **3 options** to install the app on staff phones:

### Option A: Expo Go (Easiest - For Testing)

**Pros**: Instant updates, no app store approval needed  
**Cons**: Requires Expo Go app, shows Expo branding

#### Steps:

1. **Staff install Expo Go**:
   - iOS: [App Store - Expo Go](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store - Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Run your app on a server**:
   ```bash
   cd mobile-app
   npx expo start --tunnel
   ```

3. **Share the QR code** with staff (appears in terminal)

4. **Staff scan the QR code**:
   - iOS: Camera app
   - Android: Expo Go app

5. **App loads** and stays in their Expo Go library

**Best for**: Internal testing, quick deployment to small teams

---

### Option B: EAS Build (Recommended - Professional)

**Pros**: Standalone app, your own branding, can publish to App Store/Play Store  
**Cons**: Requires Apple Developer account ($99/year) or Google Play Developer account ($25 one-time)

#### Setup EAS Build:

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo account**:
   ```bash
   eas login
   ```
   
   If you don't have an account, create one at [expo.dev](https://expo.dev)

3. **Configure EAS**:
   ```bash
   cd mobile-app
   eas build:configure
   ```

#### For iOS (iPhone/iPad):

**Prerequisites**:
- Apple Developer Account ($99/year)
- Enrolled in Apple Developer Program

**Steps**:

1. **Build for iOS**:
   ```bash
   eas build --platform ios --profile production
   ```

2. **Choose distribution**:
   - Select "Internal Distribution" (for TestFlight/Ad-hoc)
   - Or "App Store" (for public release)

3. **Wait for build** (takes 10-20 minutes)

4. **Install on phones**:

   **Option 4A: TestFlight (Recommended)**
   - Upload build to TestFlight
   - Invite staff via email
   - They install TestFlight app
   - Install your app from TestFlight
   
   **Option 4B: Ad-Hoc Distribution**
   - Download .ipa file from EAS
   - Install using Apple Configurator
   - Or share via diawi.com

#### For Android:

**Prerequisites**:
- Google Play Developer Account ($25 one-time fee) - Optional

**Steps**:

1. **Build APK for direct install**:
   ```bash
   eas build --platform android --profile production
   ```
   
   When prompted, select: **APK** (for direct install)

2. **Wait for build** (10-20 minutes)

3. **Download the APK** from EAS dashboard or link in terminal

4. **Install on phones**:

   **Method 1: Direct Install**
   - Transfer APK to phone (email, USB, cloud)
   - On phone: Enable "Install from Unknown Sources"
   - Tap the APK file to install
   
   **Method 2: Share via Link**
   - Upload APK to cloud storage
   - Share download link with staff
   - They download and install

   **Method 3: Google Play (Internal Testing)**
   - Upload to Google Play Console
   - Create "Internal Testing" track
   - Add staff emails as testers
   - They get link to install from Play Store

---

### Option C: Expo Updates (Best for Updates)

After initial install via EAS Build, you can push **instant updates** without rebuilding:

```bash
cd mobile-app
eas update --branch production --message "Updated search functionality"
```

Staff will get updates automatically next time they open the app!

---

## Detailed Step-by-Step for EAS Build

### iOS Deployment (TestFlight - Recommended)

1. **Create Apple Developer Account**
   - Go to [developer.apple.com](https://developer.apple.com)
   - Enroll ($99/year)
   - Complete setup

2. **Configure App**

   Update `app.json`:
   ```json
   {
     "expo": {
       "name": "SN Travels EID Staff",
       "slug": "snt-eid-staff",
       "version": "1.0.0",
       "ios": {
         "bundleIdentifier": "com.sntravels.eidstaff",
         "buildNumber": "1"
       }
     }
   }
   ```

3. **Create Build**:
   ```bash
   cd mobile-app
   eas build --platform ios
   ```

4. **Submit to TestFlight**:
   ```bash
   eas submit --platform ios
   ```

5. **Invite Staff**:
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Select your app
   - Go to TestFlight tab
   - Add internal testers (staff emails)
   - They receive email with install link

6. **Staff Install**:
   - Install TestFlight app from App Store
   - Open email invite
   - Tap "View in TestFlight"
   - Install the app

### Android Deployment (Internal Testing)

1. **Create Google Play Developer Account** (Optional)
   - Go to [play.google.com/console](https://play.google.com/console)
   - Pay $25 one-time fee
   - Complete setup

2. **Build APK**:
   ```bash
   cd mobile-app
   eas build --platform android --profile production
   ```
   
   Select: **APK** (not AAB for direct install)

3. **Download APK**:
   - Link appears in terminal
   - Or check [expo.dev](https://expo.dev) dashboard

4. **Distribute to Staff**:

   **Option A: Direct Install (No Play Store)**
   - Share APK file via email/cloud
   - Staff enable "Install from Unknown Sources" in settings
   - Install APK
   
   **Option B: Google Play Internal Testing**
   - Upload APK/AAB to Play Console
   - Create "Internal Testing" release
   - Add staff emails
   - They install from Play Store link

---

## Quick Install Options

### Fastest Method (No App Store):

**iOS**:
1. Build with EAS: `eas build -p ios`
2. Get .ipa file
3. Use [diawi.com](https://www.diawi.com) to share
4. Send link to staff
5. They open link on iPhone and install

**Android**:
1. Build APK: `eas build -p android`
2. Upload APK to Google Drive/Dropbox
3. Share link with staff
4. They download and install

---

## Configuration Checklist

Before deploying, ensure:

- [ ] API_CONFIG points to production server
- [ ] Production server has HTTPS (SSL certificate)
- [ ] CORS is configured on backend for mobile app
- [ ] All API endpoints are accessible
- [ ] Test login with production credentials
- [ ] Test all features (Receive, Deliver, Camera)
- [ ] Check camera permissions work on real devices
- [ ] Verify data loads correctly from production DB

---

## Update Workflow

### After Initial Install:

**Small Changes (UI, logic updates)**:
```bash
eas update --branch production --message "Fixed search bug"
```
Staff get updates instantly!

**Major Changes (new dependencies, native code)**:
```bash
eas build --platform ios
eas build --platform android
```
Need to reinstall the app.

---

## Production Server Requirements

### 1. HTTPS/SSL Certificate

Your server MUST have HTTPS for production. If not:

**Option A: Let's Encrypt (Free)**
```bash
# On your server
sudo apt-get install certbot
sudo certbot --apache -d yourdomain.com
```

**Option B: Cloudflare (Free)**
- Add your domain to Cloudflare
- Automatic SSL

### 2. CORS Configuration

Update `/snt/api/cors-headers.php`:

```php
<?php
// Allow mobile app origin
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
```

### 3. API Endpoints Check

Ensure these endpoints work:
- `POST /auth/send-otp.php`
- `POST /auth/verify-otp.php`
- `GET /visa/eid-tasks.php`
- `POST /visa/eid-tasks-controller.php`

Test with:
```bash
curl -X POST https://yourdomain.com/snt/api/auth/send-otp.php \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## Staff Installation Instructions

### For iOS Staff:

**Using TestFlight:**

1. **Check email** for TestFlight invite from App Store
2. **Install TestFlight** app from App Store (if not installed)
3. **Open the invite email** on your iPhone
4. **Tap "View in TestFlight"**
5. **Tap "Install"**
6. App appears on home screen as "SN Travels EID Staff"

**Using Direct Install (diawi.com):**

1. Open the link sent to you on your iPhone
2. Tap "Install" button
3. Go to Settings > General > VPN & Device Management
4. Trust the developer certificate
5. App appears on home screen

### For Android Staff:

**Using Google Play Internal Testing:**

1. Check email for Google Play testing invite
2. Open link on Android phone
3. Tap "Download it on Google Play"
4. Install from Play Store

**Using Direct APK:**

1. Open Settings > Security
2. Enable "Install from Unknown Sources" or "Install Unknown Apps"
3. Download APK from link
4. Tap the downloaded file
5. Tap "Install"
6. App appears in app drawer

---

## Troubleshooting

### Issue: "Cannot connect to server"

**Solution**:
- Verify production URL in `src/config/api.ts`
- Check server is running
- Verify SSL certificate is valid
- Test API endpoints with Postman

### Issue: "OTP not sending"

**Solution**:
- Check email configuration in backend
- Test send-otp.php directly
- Check server email logs

### Issue: "App crashes on start"

**Solution**:
- Check expo logs in terminal
- Verify all dependencies installed
- Test in Expo Go first
- Check device logs (Xcode for iOS, Logcat for Android)

---

## Costs Summary

### iOS Deployment:
- **Apple Developer**: $99/year
- **App Store**: Free (included)
- **TestFlight**: Free (included)

### Android Deployment:
- **Google Play**: $25 one-time (optional)
- **Direct APK**: FREE

### Expo Services:
- **Expo Account**: FREE
- **EAS Build**: FREE tier (limited builds/month)
- **EAS Update**: FREE

**Recommended**: Start with FREE options:
- Android: Direct APK distribution
- iOS: TestFlight via EAS Build (free tier)

---

## Quick Deploy Commands

### Test Build:
```bash
cd mobile-app
eas build --platform android --profile preview
```

### Production Build:
```bash
# iOS
eas build --platform ios --profile production
eas submit --platform ios

# Android
eas build --platform android --profile production
eas submit --platform android
```

### Push Updates (After initial install):
```bash
eas update --branch production --message "Your update message"
```

---

## Support Resources

- **EAS Build Docs**: [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction/)
- **TestFlight Guide**: [docs.expo.dev/submit/ios](https://docs.expo.dev/submit/ios/)
- **Android Deploy**: [docs.expo.dev/submit/android](https://docs.expo.dev/submit/android/)
- **Expo Updates**: [docs.expo.dev/eas-update/introduction](https://docs.expo.dev/eas-update/introduction/)

---

## Need Help?

Contact your development team or reference:
- [Expo Community](https://forums.expo.dev/)
- [React Native Docs](https://reactnative.dev/)

**Last Updated**: November 2024




