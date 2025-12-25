# Document Receipt System - Quick Installation Guide

## Step-by-Step Installation

### Step 1: Run Database Migration

Open your MySQL client (phpMyAdmin, MySQL Workbench, or command line) and run:

```bash
mysql -u your_username -p your_database_name < database/document_receipts_migration.sql
```

Or copy the contents of `database/document_receipts_migration.sql` and run it in phpMyAdmin.

This will create:
- 4 tables (document_receipts, document_receipt_items, document_receipt_attachments, document_type_options)
- 3 views for quick statistics
- Triggers for automatic status updates
- 20 pre-populated common document types

### Step 2: Create Upload Directory

```bash
# Navigate to your project root
cd /Applications/XAMPP/xamppfiles/htdocs/snt/react-frontend

# Create the uploads directory
mkdir -p uploads/document-receipts

# Set proper permissions (for development)
chmod -R 777 uploads/document-receipts

# For production, use more restrictive permissions:
# chmod -R 755 uploads/document-receipts
# chown -R www-data:www-data uploads/document-receipts
```

### Step 3: Verify Backend API File

Ensure the PHP API file exists at:
```
/Applications/XAMPP/xamppfiles/htdocs/snt/react-frontend/documents/document-receipts.php
```

This file should already be created by the setup.

### Step 4: Restart Your Development Server (if running)

If you have the React development server running:
```bash
# Stop it (Ctrl+C)
# Then restart
npm run dev
```

### Step 5: Access the Feature

Navigate to:
```
http://localhost:3000/documents/receipts
```

Or click on "Document Receipts" in your application menu (if you've added it to the sidebar).

## Quick Test

### Test Receiving Documents:
1. Click "Receive Documents"
2. Fill in:
   - Customer Name: "Test Customer"
   - Phone: "+971501234567"
   - Add Document Type: "Passport"
   - Quantity: 1
3. Click "Generate Receipt"
4. You should see a success message with receipt number like "RCV-202512-0001"

### Test Returning Documents:
1. Click "Return Documents"
2. Select the receipt you just created
3. Click "Generate Return Receipt"
4. The original receipt status should change to "With Customer"

## Verify Installation

### Check Database:
```sql
-- Should return stats
SELECT * FROM document_receipt_stats;

-- Should show your test receipt
SELECT * FROM document_receipts;

-- Should show 20 predefined document types
SELECT COUNT(*) FROM document_type_options;
```

### Check File System:
```bash
# Should exist
ls -la uploads/document-receipts/

# Should show write permissions
ls -ld uploads/document-receipts/
```

## Common Issues & Solutions

### Issue 1: "Failed to fetch receipts"
**Solution:** 
- Check database connection in `db.php`
- Verify database tables were created
- Check browser console for errors

### Issue 2: File upload fails
**Solution:**
```bash
# Check directory exists
ls uploads/document-receipts/

# Fix permissions
chmod 777 uploads/document-receipts/

# Check PHP settings
php -i | grep upload_max_filesize
php -i | grep post_max_size
```

### Issue 3: Page shows 404
**Solution:**
- Clear browser cache
- Restart development server
- Check that route was added to app-route.jsx

### Issue 4: Authentication error
**Solution:**
- Ensure you're logged in
- Check JWT token in localStorage
- Try logging out and back in

## Configuration

### Adjust Upload Limits (if needed)

Edit your `php.ini` file:
```ini
upload_max_filesize = 20M
post_max_size = 25M
max_file_uploads = 20
```

Restart Apache after changes.

### Add to Sidebar Menu (Optional)

Edit your sidebar configuration file to add a menu item:

```javascript
{
  path: '/documents/receipts',
  icon: 'fa fa-file-contract',
  title: 'Document Receipts'
}
```

## Testing Checklist

- [ ] Database tables created successfully
- [ ] Upload directory exists with proper permissions
- [ ] Can access the page at /documents/receipts
- [ ] Can receive documents and generate receipt
- [ ] Can return documents
- [ ] Can upload file attachments
- [ ] Can search and filter receipts
- [ ] Can view receipt details
- [ ] Can print receipt
- [ ] Statistics cards show correct numbers
- [ ] Can add new document types

## Production Deployment

Before deploying to production:

1. **Secure file permissions:**
   ```bash
   chmod 755 uploads/document-receipts/
   chown www-data:www-data uploads/document-receipts/
   ```

2. **Adjust PHP settings:**
   - Set appropriate upload limits
   - Enable error logging
   - Disable display_errors

3. **Database backup:**
   ```bash
   mysqldump -u username -p database_name > backup_before_migration.sql
   ```

4. **Test thoroughly:**
   - Test all features
   - Test with different user roles
   - Test file uploads
   - Test search and filters

5. **Monitor:**
   - Watch disk space for uploads directory
   - Monitor database size
   - Check error logs

## Need Help?

If you encounter any issues:
1. Check the browser console for JavaScript errors
2. Check PHP error logs
3. Check database connection
4. Verify all files are in correct locations
5. Ensure proper permissions on upload directory

## Quick Reference

**Access URL:** `/documents/receipts`

**Database Tables:**
- document_receipts
- document_receipt_items  
- document_receipt_attachments
- document_type_options

**API Endpoint:** `/documents/document-receipts.php`

**Upload Directory:** `uploads/document-receipts/`

**Receipt Format:**
- Receive: RCV-YYYYMM-#### (e.g., RCV-202512-0001)
- Return: RET-YYYYMM-#### (e.g., RET-202512-0001)

---

Installation Date: December 25, 2025
Version: 1.0.0

