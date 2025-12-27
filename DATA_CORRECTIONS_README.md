# Passport & Visa Data Corrections Module

## Overview
This module provides a dedicated interface for staff to review and fix passport numbers, passport expiry dates, and visa expiry dates for residence records. It features a two-tab system to track UNFIXED and FIXED records.

## Features
- **UNFIXED Tab**: Shows all residence records that haven't been reviewed/corrected yet
- **FIXED Tab**: Shows all residence records that have been corrected and marked as fixed
- **Edit Modal**: Allows staff to update all three fields (passport number, passport expiry, visa expiry) in one go
- **Search & Filter**: Search by passenger name, customer, passport number, or UID
- **Company Filter**: Filter records by company
- **Automatic Status Update**: Once data is corrected and confirmed, records automatically move from UNFIXED to FIXED tab

## Installation

### 1. Database Setup
Run the migration to add the `is_fixed` column to the residence table:

```bash
mysql -u your_username -p your_database < /Applications/XAMPP/xamppfiles/htdocs/snt/database/add-is-fixed-column.sql
```

Or execute the SQL manually in phpMyAdmin/MySQL Workbench.

### 2. Backend API Files
The following API files have been created in `/Applications/XAMPP/xamppfiles/htdocs/snt/api/residence/`:

- `data-corrections.php` - Fetches residence records filtered by fixed/unfixed status
- `update-passport-visa-data.php` - Updates passport and visa data and marks record as fixed

### 3. Frontend Files
The following React components have been created:

- `src/pages/visa/DataCorrections.tsx` - Main page component
- `src/pages/visa/DataCorrections.css` - Page styling
- `src/components/visa/EditDataModal.tsx` - Edit modal component
- `src/components/visa/EditDataModal.css` - Modal styling

### 4. Service Methods
Added to `src/services/residenceService.ts`:

- `getDataCorrections()` - Fetch records by status
- `updatePassportVisaData()` - Update passport/visa data

### 5. Routing
Added route in `src/App.tsx`:

```tsx
<Route path="visa/data-corrections" element={<DataCorrections />} />
```

## Usage

### Accessing the Page
Navigate to: `http://127.0.0.1:5174/visa/data-corrections`

### Workflow
1. **View UNFIXED Records**: Default tab shows all records that need correction
2. **Fix Data**: Click "Fix" button on any record
3. **Edit in Modal**: 
   - Enter/correct passport number
   - Select passport expiry date
   - Select visa expiry date
4. **Confirm**: Click "Confirm & Mark as Fixed"
5. **Result**: Record moves to FIXED tab automatically

### Search & Filter
- **Search Bar**: Type passenger name, customer name, passport number, or UID
- **Company Filter**: Select a specific company to filter records
- **Pagination**: Adjust items per page (10, 25, 50, 100)

## Database Schema

### New Column
```sql
ALTER TABLE residence ADD COLUMN is_fixed TINYINT(1) DEFAULT 0 
COMMENT 'Indicates if passport/visa data has been corrected';

-- Index for performance
ALTER TABLE residence ADD INDEX idx_is_fixed (is_fixed);
```

## API Endpoints

### GET /api/residence/data-corrections.php
Fetches residence records filtered by status.

**Query Parameters:**
- `status` - 'fixed' or 'unfixed' (default: 'unfixed')
- `company_id` - Filter by company ID (optional)
- `search` - Search term (optional)

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [
    {
      "residenceID": 123,
      "passenger_name": "John Doe",
      "passportNumber": "AB123456",
      "passportExpiryDate": "2025-12-31",
      "expiry_date": "2025-06-30",
      "is_fixed": 0,
      ...
    }
  ]
}
```

### POST /api/residence/update-passport-visa-data.php
Updates passport and visa data for a residence record.

**Request Body:**
```json
{
  "residenceID": 123,
  "passportNumber": "AB123456",
  "passportExpiryDate": "2025-12-31",
  "visaExpiryDate": "2025-06-30"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Passport and visa data updated successfully"
}
```

## Permissions
- Requires 'Residence' module SELECT permission to view records
- Requires 'Residence' module UPDATE permission to edit records
- Uses JWT authentication

## UI Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Color-Coded Status Badges**: 
  - Red: Expired
  - Orange: Expiring soon (≤30 days)
  - Blue: Expiring in 31-60 days
  - Green: Valid (>60 days)
  - Gray: No date set
- **Real-time Pagination**: Smooth page transitions
- **Loading States**: Clear loading indicators
- **Error Handling**: User-friendly error messages

## Testing Checklist
- [ ] Database column `is_fixed` added successfully
- [ ] Backend API endpoints accessible
- [ ] Frontend page loads without errors
- [ ] UNFIXED tab shows records with `is_fixed = 0`
- [ ] FIXED tab shows records with `is_fixed = 1`
- [ ] Edit modal opens with correct data
- [ ] Form validation works (required fields)
- [ ] Data saves successfully
- [ ] Record moves from UNFIXED to FIXED after save
- [ ] Search functionality works
- [ ] Company filter works
- [ ] Pagination works correctly
- [ ] Permissions are enforced

## Troubleshooting

### Records not showing
- Check if `is_fixed` column exists in database
- Verify JWT token is valid
- Check user permissions for Residence module

### Cannot save data
- Verify UPDATE permission for Residence module
- Check date format (must be YYYY-MM-DD)
- Ensure passport number is not empty

### Modal not opening
- Check browser console for errors
- Verify EditDataModal component is imported correctly

## Future Enhancements
- Bulk edit functionality
- Export to Excel
- Audit log for changes
- Email notifications for corrections
- Before/after comparison view

## Support
For issues or questions, contact the development team.

