# MOHRE Inquiry Feature - Mobile App Testing Guide

## Overview
The MOHRE Inquiry feature has been successfully implemented in the mobile app with 4 tabs for different inquiry types, matching the web version at `http://127.0.0.1:5174/mohre/inquiry`.

## What Was Implemented

### 1. New Navigation Structure
- Created `MOHRENavigator.tsx` with Material Top Tabs
- Replaced the simple `MOHREScreen` with a tabbed navigation interface
- Updated `AppNavigator.tsx` to use the new MOHRE Navigator

### 2. Four Inquiry Screens

#### Tab 1: Work Permit Inquiry (`WorkPermitInquiryScreen.tsx`)
- **API Endpoint**: `https://api.sntrips.com/trx/ewp.php`
- **Input**: Electronic Work Permit Number
- **Example**: 123217758
- **Shows**: 
  - Company Information
  - Permit Information
  - List of Work Permits

#### Tab 2: Immigration Status (`ImmigrationStatusScreen.tsx`)
- **API Endpoint**: `https://api.sntrips.com/trx/wpricp.php`
- **Input**: MB/Transaction Number
- **Example**: MB295943148AE
- **Shows**:
  - Card Number
  - MOI Company Code
  - File Number
  - Unified Number
  - Application Status

#### Tab 3: Company Info (`CompanyInfoScreen.tsx`)
- **API Endpoint**: `https://api.sntrips.com/trx/company-info.php`
- **Input**: Company Number
- **Example**: 1206022
- **Shows**:
  - Company Name & Details
  - License Information
  - Work Permit Quotas
  - Company Status

#### Tab 4: Application Status (`ApplicationStatusScreen.tsx`)
- **API Endpoint**: `https://api.sntrips.com/trx/application-status.php`
- **Input**: MB/Transaction Number
- **Example**: MB272236740AE
- **Shows**:
  - Transaction Details
  - Application Processing Status

### 3. MOHRE Service (`mohreService.ts`)
- Centralized API calls for all 4 inquiry types
- Helper functions for:
  - HTML entity decoding
  - Arabic to English translation
  - Data formatting

### 4. Features Included
- ✅ Search functionality for each inquiry type
- ✅ Loading states with spinners
- ✅ Error handling with alerts
- ✅ Example data quick-fill buttons
- ✅ Reset functionality
- ✅ Beautiful, mobile-optimized UI
- ✅ Arabic text translation
- ✅ Color-coded tabs and results
- ✅ Responsive design

## How to Test

### Prerequisites
1. Ensure the mobile app is running: `npm start -- --tunnel` (from mobile-app directory)
2. Have the Expo Go app installed on your phone
3. Scan the QR code to open the app

### Testing Steps

1. **Login to the app** with your credentials

2. **Navigate to MOHRE tab** (bottom navigation)

3. **Test Work Permit Tab**:
   - Click "Work Permit" tab
   - Click "Try example: 123217758" or enter a permit number
   - Click "Search"
   - Verify company info, permit info, and work permits list are displayed
   - Click "Reset" to clear results

4. **Test Immigration Tab**:
   - Click "Immigration" tab
   - Click "Try example: MB295943148AE" or enter an MB number
   - Click "Search"
   - Verify immigration status is displayed with file numbers
   - Check that Arabic text is translated to English

5. **Test Company Info Tab**:
   - Click "Company Info" tab
   - Click "Try example: 1206022" or enter a company number
   - Click "Search"
   - Verify company details, quotas, and status are shown
   - Check quota availability displays

6. **Test Application Status Tab**:
   - Click "App Status" tab
   - Click "Try example: MB272236740AE" or enter an MB number
   - Click "Check Status"
   - Verify application status and transaction details are displayed
   - Check status badges (processed/pending)

## UI Features to Verify

### Color Coding
- Work Permit: Blue (#2563eb)
- Immigration: Green (#10b981)
- Company Info: Orange (#f59e0b)
- Application Status: Cyan (#06b6d4)

### UI Elements
- Tab indicator line at the top
- Search input with icons
- Example quick-fill buttons
- Loading spinners during API calls
- Success/error alerts
- Reset buttons after results
- Formatted information cards
- Icon indicators for different data types

## API Integration

All APIs are using the production endpoint:
```
https://api.sntrips.com/trx/
```

### API Files
- `ewp.php` - Electronic Work Permit
- `wpricp.php` - Immigration Status
- `company-info.php` - Company Information
- `application-status.php` - Application Status

## File Structure

```
mobile-app/src/
├── navigation/
│   ├── AppNavigator.tsx (updated)
│   └── MOHRENavigator.tsx (new)
├── screens/
│   ├── WorkPermitInquiryScreen.tsx (new)
│   ├── ImmigrationStatusScreen.tsx (new)
│   ├── CompanyInfoScreen.tsx (new)
│   └── ApplicationStatusScreen.tsx (new)
└── services/
    └── mohreService.ts (new)
```

## Navigation Implementation
- Custom tab navigation using React state
- Scrollable horizontal tabs for better mobile UX
- No additional dependencies required

## Notes
- All screens include comprehensive error handling
- Arabic text is automatically translated to English
- All dates and numbers are properly formatted
- The UI is optimized for mobile viewing
- Scrollable content for long results
- Pull-to-refresh not implemented (can be added if needed)

## Troubleshooting

### If tabs don't show:
- Check that all screens are imported correctly
- Restart the Expo dev server
- Clear the cache: `npx expo start --clear`

### If API calls fail:
- Verify internet connection
- Check API endpoints are accessible
- Ensure the device can reach `https://api.sntrips.com`

### If translations don't work:
- The service includes common Arabic terms
- More terms can be added to `mohreService.ts` translation dictionary

## Success Criteria
✅ All 4 tabs are visible and clickable
✅ Each tab shows appropriate search form
✅ Example data can be auto-filled
✅ Search returns and displays data correctly
✅ Arabic text is translated
✅ Error messages appear for invalid inputs
✅ Reset button clears all data
✅ UI is responsive and mobile-friendly

---

**Implementation Date**: January 31, 2026
**Status**: ✅ Complete and Ready for Testing
