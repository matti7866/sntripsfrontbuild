# Go Live Checklist ✅

Follow this checklist to deploy your app to production and install on staff phones.

---

## Before You Start

- [ ] Your production server is online (https://yourdomain.com)
- [ ] Backend API is working (test at https://yourdomain.com/snt/api/auth/send-otp.php)
- [ ] You have access to your server
- [ ] Staff list with email addresses ready

---

## Step 1: Update Configuration (5 minutes)

### A. Set Production API URL

1. Open file: `mobile-app/src/config/api.ts`

2. Change this line:
   ```typescript
   BASE_URL: 'http://localhost/snt/api',  // ❌ Remove this
   ```
   
   To:
   ```typescript
   BASE_URL: 'https://your-actual-domain.com/snt/api',  // ✅ Your real domain
   ```

3. **Example**:
   ```typescript
   // If your website is https://sntravels.ae
   BASE_URL: 'https://sntravels.ae/snt/api',
   ```

4. Save the file

### B. Test API Connection

Open your browser and test:
- https://your-domain.com/snt/api/auth/send-otp.php

Should return: `{"success":false,"message":"Email is required"}`

If you see this, API is working! ✅

---

## Step 2: Choose Distribution Method

Check your needs:

**If you have iOS (iPhone) staff:**
- [ ] Need Apple Developer Account ($99/year)
- [ ] Will use TestFlight for distribution

**If you have Android staff:**
- [ ] Can distribute for FREE using APK
- [ ] No Google account needed

---

## Step 3: Install Required Tools (10 minutes)

### Install EAS CLI (on your Mac):

```bash
npm install -g eas-cli
```

### Login to Expo:

```bash
eas login
```

If you don't have account: Create FREE account at [expo.dev](https://expo.dev)

Enter email and password when prompted.

---

## Step 4: Build the Apps (20-30 minutes)

### Navigate to mobile app:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/snt/react-frontend/mobile-app
```

### For iOS (iPhone staff):

```bash
eas build --platform ios
```

When prompted:
- Enter Apple ID email
- Enter Apple ID password
- Select: **internal** (for TestFlight)
- Wait 15-20 minutes

### For Android:

```bash
eas build --platform android
```

When prompted:
- Select: **APK** (important!)
- Wait 15-20 minutes

---

## Step 5: Distribute to Staff

### For iOS (TestFlight):

1. Submit to TestFlight:
   ```bash
   eas submit --platform ios
   ```

2. Go to [App Store Connect](https://appstoreconnect.apple.com)

3. Click your app → TestFlight tab

4. Add staff emails under "Internal Testing"

5. Staff receive email with install link

### For Android (Direct APK):

1. **Download APK**:
   - EAS shows download link after build
   - Or go to [expo.dev](https://expo.dev) → Projects → Builds
   - Download the .apk file

2. **Share with staff**:
   - Upload to Google Drive/Dropbox
   - Share link via email/WhatsApp
   - Or send APK file directly

---

## Step 6: Staff Installation

Send these instructions to staff:

### iPhone Staff:

```
1. Install "TestFlight" app from App Store
2. Check your email for TestFlight invite
3. Open email on iPhone
4. Tap "View in TestFlight"
5. Tap "Install"
6. App will appear on your home screen
```

### Android Staff:

```
1. Download APK from the link sent to you
2. Open Settings → Security
3. Enable "Install from Unknown Sources"
4. Tap the downloaded APK file
5. Tap "Install"
6. Open app from app drawer
```

---

## Step 7: Verify Everything Works

Ask staff to test:

- [ ] Login with email OTP
- [ ] View Pending Delivery tab
- [ ] View Received tab
- [ ] View Delivered tab
- [ ] Open "Mark as Received" modal
- [ ] See establishment names in dropdown
- [ ] Search in dropdowns works
- [ ] Submit a test (if safe)

---

## Future Updates

When you make changes to the app:

### Small Changes (UI, bug fixes):
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/snt/react-frontend/mobile-app
eas update --branch production --message "Fixed search feature"
```

Staff get updates automatically! No reinstall needed.

### Big Changes (new features, dependencies):
```bash
eas build --platform ios
eas build --platform android
```

Staff need to reinstall.

---

## Quick Reference

| Task | Command |
|------|---------|
| Build iOS | `eas build -p ios` |
| Build Android | `eas build -p android` |
| Submit iOS | `eas submit -p ios` |
| Push Update | `eas update --branch production` |
| Check Builds | `eas build:list` |
| View Dashboard | Visit expo.dev |

---

## Need Help?

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Check `INSTALL_ON_PHONES.md` for installation help
3. Check EAS docs: [docs.expo.dev/build](https://docs.expo.dev/build)
4. Contact your development team

---

## Estimated Timeline

- Configure production: **5 minutes**
- Install EAS CLI: **5 minutes**
- Build iOS: **20 minutes** (automated)
- Build Android: **20 minutes** (automated)
- Submit iOS to TestFlight: **10 minutes**
- Staff install: **5 minutes per person**

**Total**: About **1 hour** from start to finish

---

✅ **You're ready to deploy!** Follow the steps above and your staff will have the app installed within an hour.



