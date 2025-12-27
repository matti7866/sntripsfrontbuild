# Data Corrections Module - Setup Complete ✅

## Overview
A new module has been created for staff to fix passport numbers, passport expiry dates, and visa expiry dates for residence records. The module features FIXED and UNFIXED tabs to track data correction progress.

---

## 📁 Files Created

### Frontend Files
1. **`src/pages/visa/DataCorrections.tsx`** - Main page component with FIXED/UNFIXED tabs
2. **`src/pages/visa/DataCorrections.css`** - Page styling
3. **`src/components/visa/EditDataModal.tsx`** - Modal for editing passport/visa data
4. **`src/components/visa/EditDataModal.css`** - Modal styling

### Backend API Files
1. **`/Applications/XAMPP/xamppfiles/htdocs/snt/api/residence/data-corrections.php`**
   - Fetches residence records filtered by fixed/unfixed status
   - Includes JWT authentication and permission checks

2. **`/Applications/XAMPP/xamppfiles/htdocs/snt/api/residence/update-passport-visa-data.php`**
   - Updates passport number, passport expiry, and visa expiry
   - Marks records as fixed automatically

### Database Migration
1. **`database/add-is-fixed-column.sql`**
   - Adds `is_fixed` column to residence table
   - Includes index for better performance

### Documentation
1. **`DATA_CORRECTIONS_README.md`** - Complete documentation

---

## 🔧 Files Modified

### 1. Service Layer
**File:** `src/services/residenceService.ts`

Added two new methods:
```typescript
async getDataCorrections(params: { 
  status: 'fixed' | 'unfixed'; 
  company_id?: string; 
  search?: string 
})

async updatePassportVisaData(data: {
  residenceID: number;
  passportNumber: string;
  passportExpiryDate: string;
  visaExpiryDate: string;
})
```

### 2. Routing
**File:** `src/App.tsx`

Added import:
```typescript
import DataCorrections from './pages/visa/DataCorrections';
```

Added route:
```typescript
<Route path="visa/data-corrections" element={<DataCorrections />} />
```

### 3. Navigation
**File:** `src/layouts/ColorAdminSidebar.tsx`

Added menu item under Visa section:
```typescript
{ path: '/visa/data-corrections', title: 'Data Corrections' }
```

---

## 🗄️ Database Setup Required

**Run this SQL to add the required column:**

```bash
mysql -u your_username -p your_database < /Applications/XAMPP/xamppfiles/htdocs/snt/database/add-is-fixed-column.sql
```

Or manually execute:
```sql
ALTER TABLE residence ADD COLUMN is_fixed TINYINT(1) DEFAULT 0 
COMMENT 'Indicates if passport/visa data has been corrected';

ALTER TABLE residence ADD INDEX idx_is_fixed (is_fixed);
```

---

## 🚀 Access the Module

### URL
```
http://127.0.0.1:5174/visa/data-corrections
```

### Navigation Path
Dashboard → Visa → Data Corrections

---

## 📋 Features

### UNFIXED Tab
- Shows all records that need data correction
- Default view when page loads
- Records with `is_fixed = 0` or `NULL`

### FIXED Tab
- Shows all records that have been corrected
- Records with `is_fixed = 1`

### Edit Modal
- Update passport number (required)
- Update passport expiry date (required)
- Update visa expiry date (required)
- Automatic validation
- Marks record as FIXED on save

### Search & Filter
- Search by passenger name, customer, passport number, or UID
- Filter by company
- Pagination (10, 25, 50, 100 items per page)

### Visual Indicators
- **Red Badge**: Expired
- **Orange Badge**: Expiring soon (≤30 days)
- **Blue Badge**: Expiring in 31-60 days
- **Green Badge**: Valid (>60 days)
- **Gray Badge**: No date set

---

## 🔐 Permissions

The module respects existing permission system:
- **View**: Requires 'Residence' SELECT permission
- **Edit**: Requires 'Residence' UPDATE permission
- **Authentication**: JWT token required

---

## 🧪 Testing Checklist

Before going live, verify:

- [ ] Database column `is_fixed` added successfully
- [ ] Backend APIs accessible at `/api/residence/data-corrections.php` and `/api/residence/update-passport-visa-data.php`
- [ ] Page loads at `/visa/data-corrections`
- [ ] Menu item appears in sidebar under "Visa"
- [ ] UNFIXED tab shows records with `is_fixed = 0`
- [ ] FIXED tab shows records with `is_fixed = 1`
- [ ] Edit modal opens with correct data
- [ ] Required field validation works
- [ ] Data saves successfully
- [ ] Record moves from UNFIXED to FIXED after save
- [ ] Search functionality works
- [ ] Company filter works
- [ ] Pagination works correctly
- [ ] Permission checks work (try with different roles)

---

## 📊 API Endpoints

### GET `/api/residence/data-corrections.php`
**Query Parameters:**
- `status` - 'fixed' or 'unfixed' (default: 'unfixed')
- `company_id` - Filter by company (optional)
- `search` - Search term (optional)

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...]
}
```

### POST `/api/residence/update-passport-visa-data.php`
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

---

## 🎯 Workflow Example

1. Staff opens **Data Corrections** page
2. **UNFIXED** tab shows all records needing correction
3. Staff clicks **"Fix"** button on a record
4. Modal opens with current data pre-filled
5. Staff updates:
   - Passport Number
   - Passport Expiry Date
   - Visa Expiry Date
6. Staff clicks **"Confirm & Mark as Fixed"**
7. Data is saved
8. Record automatically moves to **FIXED** tab
9. Staff continues with next record

---

## 🆘 Troubleshooting

### Records not showing
- Verify `is_fixed` column exists in database
- Check JWT token validity
- Verify user has Residence SELECT permission

### Cannot save data
- Verify user has Residence UPDATE permission
- Ensure date format is YYYY-MM-DD
- Passport number cannot be empty

### Modal not opening
- Check browser console for errors
- Verify component imports are correct

### Backend API errors
- Check PHP error logs
- Verify database connection in `/Applications/XAMPP/xamppfiles/htdocs/snt/connection.php`
- Ensure CORS headers are properly configured

---

## 📈 Future Enhancements

Possible improvements:
- Bulk edit functionality
- Export to Excel
- Change history/audit log
- Email notifications when data is fixed
- Before/after comparison view
- Dashboard widget showing unfixed count
- Scheduled reports for unfixed records

---

## ✅ Completion Status

**All tasks completed successfully:**
- ✅ Frontend components created
- ✅ Backend API endpoints created
- ✅ Service methods added
- ✅ Routes configured
- ✅ Navigation menu updated
- ✅ Database migration script created
- ✅ Documentation completed

**Next Step:** Run the database migration and test the module!

---

## 📞 Support

For questions or issues, refer to:
- `DATA_CORRECTIONS_README.md` - Full documentation
- Backend API files for endpoint details
- Frontend components for UI logic

**Module is ready for testing and deployment!** 🎉

