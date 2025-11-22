# Troubleshooting White Screen

If you're seeing a white screen with no errors:

## Quick Fix

1. **Clear cache and restart:**
   ```bash
   cd mobile-app
   npx expo start --clear
   ```

2. **Press 'i' to reload iOS simulator**

3. **Or shake device (Cmd + D) and select "Reload"**

## Common Issues

### 1. White Screen After Login
**Cause**: App initialization issue
**Fix**: Simplified App.tsx to remove splash screen conflicts

### 2. Navigation Not Loading
**Cause**: Navigation containers not properly initialized
**Fix**: Check that all screens are properly exported

### 3. Metro Bundler Issues
**Cause**: Cached files causing problems
**Fix**: 
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

## Development Mode

The app should show:
1. **Login Screen** immediately on load
2. Enter: `501234567`
3. Enter OTP: `123456`
4. Dashboard appears

## Check Console

In the terminal where Expo is running, look for:
- ✅ "Bundled successfully"
- ❌ Any red error messages

## Force Reload

In iOS Simulator:
- Press **Cmd + R** to reload
- Or press **Cmd + D** to open dev menu
- Select "Reload"

## Still Not Working?

Try these steps in order:

1. **Kill Expo and restart:**
   ```bash
   # Press Ctrl+C in terminal
   # Then:
   npx expo start --clear --ios
   ```

2. **Reset iOS Simulator:**
   - Device > Erase All Content and Settings
   - Rerun the app

3. **Check Node version:**
   ```bash
   node --version
   # Should be v16 or higher
   ```

4. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npx expo start --clear
   ```

