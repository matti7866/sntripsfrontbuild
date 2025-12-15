# Production Server Fix Guide

## Problem
Your `send-otp.php` file on `rest.sntrips.com` is failing with error:
```
Warning: require_once(): open_basedir restriction in effect
```

## Root Cause
The file had redundant CORS handling that was trying to include `cors-headers.php` twice, causing an `open_basedir` restriction error on your production server.

## Solution

### Option 1: Upload via FTP/SFTP (Recommended)

1. **Connect to your server** using FTP client (FileZilla, Cyberduck, etc.)
   - Host: `rest.sntrips.com` (or your server IP)
   - Username: Your hosting username
   - Password: Your hosting password

2. **Navigate to the API directory** on server:
   ```
   /sntravels/api/auth/
   ```
   (Note: Your production path is `/sntravels/` not `/snt/`)

3. **Upload the fixed file**:
   - Local file: `/Applications/XAMPP/xamppfiles/htdocs/snt/api/auth/send-otp.php`
   - Remote location: `/sntravels/api/auth/send-otp.php`
   - **Make sure to overwrite** the existing file

4. **Test immediately**:
   - Open your app
   - Try to login with your email
   - Should now work! ✅

---

### Option 2: Upload via SSH/Terminal

If you have SSH access to your server:

```bash
# 1. Connect to your server
ssh your-username@rest.sntrips.com

# 2. Navigate to the API directory
cd /sntravels/api/auth/

# 3. Backup the old file (just in case)
cp send-otp.php send-otp.php.backup

# 4. Edit the file
nano send-otp.php

# 5. Find line 47 (around line 47):
# require_once __DIR__ . '/../cors-headers.php';

# 6. Comment it out or delete it:
# require_once __DIR__ . '/../cors-headers.php';  // REMOVED - redundant

# 7. Save and exit (Ctrl+X, then Y, then Enter)

# 8. Verify the fix
cat send-otp.php | grep -n "cors-headers"
# Should show the line is commented out
```

---

### Option 3: Upload via cPanel File Manager

1. **Login to cPanel**:
   - URL: Usually `https://rest.sntrips.com:2083` or `https://yourdomain.com/cpanel`
   - Enter your cPanel username and password

2. **Open File Manager**:
   - Click "File Manager" icon
   - Navigate to: `/sntravels/api/auth/`

3. **Edit the file**:
   - Right-click on `send-otp.php`
   - Select "Edit"
   - Find line 47: `require_once __DIR__ . '/../cors-headers.php';`
   - Comment it out: `// require_once __DIR__ . '/../cors-headers.php';`
   - Click "Save Changes"

4. **Test**: Try logging into your app

---

## What Changed?

### Before (Line 45-51):
```php
});

// Include CORS headers - this handles all CORS logic including OPTIONS requests
require_once __DIR__ . '/../cors-headers.php';  // ❌ This was causing the error

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../../connection.php';
```

### After (Line 45-51):
```php
});

// CORS is already handled above, no need to include cors-headers.php again
// require_once __DIR__ . '/../cors-headers.php';  // REMOVED - redundant, causes issues

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../../connection.php';
```

## Why This Fix Works

1. **Before**: File was handling CORS at the top (lines 1-44), then trying to include `cors-headers.php` again at line 47
2. **Problem**: The second include was hitting `open_basedir` restrictions on production server
3. **After**: Removed the redundant include since CORS is already fully handled at the top
4. **Result**: No more `open_basedir` errors, OTP sends successfully! ✅

---

## Verification Steps

After uploading the fix:

1. **Clear browser cache** (or use Incognito/Private mode)
2. **Open your app** at the login screen
3. **Enter your email**: `mattiullah.nadiry@gmail.com`
4. **Click "Send OTP"**
5. **Check for success**:
   - ✅ You should see "OTP sent successfully"
   - ✅ Check your email inbox for the OTP
   - ✅ No more "500 Internal Server Error"

---

## Need Help?

If you're still seeing errors after applying the fix:

1. **Check the server path**: Make sure you edited the file in `/sntravels/api/auth/` (not `/snt/`)
2. **Clear server cache**: Some servers cache PHP files - restart PHP-FPM or Apache
3. **Check file permissions**: File should be readable (644 or 755)
4. **View server error logs**: Check `/sntravels/logs/` or your hosting control panel

---

## Quick Test Command

Test the API directly in browser:
```
https://rest.sntrips.com/api/auth/send-otp.php
```

Should return:
```json
{"success":false,"message":"Email is required"}
```

If you see this, the file is working! ✅



