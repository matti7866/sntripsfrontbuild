# Document Receipt Management System

## Overview
A comprehensive document receipt management system for tracking original documents received from customers and returned back to them. This system provides full accountability and traceability of physical documents.

## Features

### 1. **Receive Documents**
- Record when original documents are received from customers
- Generate unique receipt numbers (RCV-YYYYMM-####)
- Track multiple document types with quantities
- Add optional physical labels for document storage
- Attach scanned copies or photos of documents
- Record customer contact information

### 2. **Return Documents**
- Select from documents currently with the company
- Generate return receipts (RET-YYYYMM-####)
- Automatically update status when documents are returned
- Link return receipts to original receive receipts
- Track who returned the documents and when

### 3. **Document Types**
- Predefined common document types (Passport, Emirates ID, Visa, etc.)
- Add custom document types on demand
- Support for multiple documents in one receipt
- Quantity tracking for each document type
- Optional descriptions for specific documents

### 4. **Label System**
- Physical location tracking (e.g., "Shelf A-1", "Box 5")
- Easy identification of where documents are stored
- Helps with physical document retrieval

### 5. **Attachments**
- Upload scanned copies or photos of documents
- Multiple file attachments per receipt
- Supported formats: Images (JPG, PNG), PDF, DOC, DOCX
- File size tracking and management

### 6. **Search & Filters**
- Search by customer name, receipt number, phone, or email
- Filter by transaction type (Received/Returned)
- Filter by status (With Company/With Customer)
- Date range filtering
- Real-time search

### 7. **Statistics Dashboard**
- Total documents received
- Total documents returned
- Currently with company count
- Currently with customer count
- Visual statistics cards

### 8. **Receipt Printing**
- Print-friendly receipt format
- Complete document details
- Professional layout for record keeping

## Database Schema

### Tables Created:
1. **document_receipts** - Main receipts table
2. **document_receipt_items** - Document types and quantities
3. **document_receipt_attachments** - File attachments
4. **document_type_options** - Predefined document types

### Views Created:
1. **document_receipt_stats** - Quick statistics
2. **documents_pending_return** - Documents currently with company
3. **customer_document_history** - Per-customer transaction history

## Installation

### 1. Database Setup
```bash
# Run the SQL migration
mysql -u your_user -p your_database < database/document_receipts_migration.sql
```

### 2. Create Upload Directory
```bash
# Create directory for document attachments
mkdir -p uploads/document-receipts
chmod 777 uploads/document-receipts
```

### 3. Frontend Access
Navigate to: `/documents/receipts` in your application

## Usage

### Receiving Documents:
1. Click "Receive Documents" button
2. Fill in customer information (name required)
3. Add document types with quantities
4. Optional: Add physical label/location
5. Optional: Attach scanned copies
6. Optional: Add notes
7. Click "Generate Receipt"

### Returning Documents:
1. Click "Return Documents" button
2. Select the original receipt from the list
3. Customer info auto-fills from original receipt
4. Add return date/time
5. Optional: Add return notes
6. Optional: Attach proof of return
7. Click "Generate Return Receipt"

### Managing Document Types:
1. Click "Manage Types" button
2. View existing document types
3. Add new types as needed
4. Types appear in autocomplete when adding documents

## API Endpoints

All endpoints are in `/documents/document-receipts.php`

### Actions:
- `getReceipts` - Get all receipts with filters
- `getReceipt` - Get single receipt details
- `createReceipt` - Create new receipt
- `updateReceipt` - Update existing receipt
- `deleteReceipt` - Delete receipt
- `getStats` - Get statistics
- `getDocumentTypeOptions` - Get document types
- `addDocumentTypeOption` - Add document type
- `deleteAttachment` - Delete file attachment
- `getAvailableForReturn` - Get receipts available for return
- `getReceiptForPrint` - Get receipt data for printing

## File Structure

```
src/
├── types/
│   └── documentReceipt.ts          # TypeScript interfaces
├── services/
│   └── documentReceiptService.ts   # API service layer
├── pages/
│   └── documents/
│       ├── DocumentReceipts.tsx    # Main component
│       └── DocumentReceipts.css    # Styling
└── coloradmin-config/
    └── app-route.jsx               # Route configuration

documents/
└── document-receipts.php           # Backend API

database/
└── document_receipts_migration.sql # Database schema

uploads/
└── document-receipts/              # File storage directory
```

## Key Features Explained

### Receipt Numbering
- **Receive Format**: RCV-YYYYMM-#### (e.g., RCV-202501-0001)
- **Return Format**: RET-YYYYMM-#### (e.g., RET-202501-0001)
- Auto-incremented monthly counter
- Unique per transaction type

### Status Tracking
- **with_company**: Documents are in company possession
- **with_customer**: Documents have been returned to customer
- Status automatically updates when documents are returned

### Linked Receipts
- Return receipts link to original receive receipts
- Prevents accidental deletion of receipts with return records
- Full audit trail of document movement

### Staff Tracking
- Records which staff member received documents
- Records which staff member returned documents
- Links to staff table for accountability

### Attachment Management
- Files stored in `uploads/document-receipts/`
- Unique filenames prevent conflicts
- File metadata stored in database
- Automatic cleanup on receipt deletion

## Security Features
- JWT authentication required for all API calls
- SQL injection protection with prepared statements
- File upload validation
- Transaction rollback on errors
- Foreign key constraints for data integrity

## Responsive Design
- Mobile-friendly interface
- Touch-optimized controls
- Responsive tables and modals
- Adaptive layout for all screen sizes

## Print Functionality
- Clean print layout
- Company information ready
- Professional receipt format
- PDF-ready design

## Future Enhancements (Optional)
- [ ] Email receipt to customer automatically
- [ ] SMS notification when documents ready for return
- [ ] Barcode/QR code for quick receipt lookup
- [ ] Document expiry reminders
- [ ] Bulk document processing
- [ ] Advanced reporting and analytics
- [ ] Export to Excel/PDF
- [ ] Digital signature capture
- [ ] Multi-language support
- [ ] Mobile app integration

## Troubleshooting

### Common Issues:

1. **Upload directory not writable**
   ```bash
   chmod 777 uploads/document-receipts
   ```

2. **Database connection issues**
   - Verify database credentials in `db.php`
   - Ensure database user has proper permissions

3. **File upload fails**
   - Check PHP upload_max_filesize setting
   - Check post_max_size setting
   - Verify directory permissions

4. **Receipt number conflicts**
   - Database automatically handles uniqueness
   - Monthly counter resets each month

## Support & Maintenance

### Regular Maintenance:
- Monitor upload directory size
- Archive old receipts periodically
- Backup database regularly
- Review and clean up old document types

### Database Maintenance:
```sql
-- Check statistics
SELECT * FROM document_receipt_stats;

-- Find documents pending return over 30 days
SELECT * FROM documents_pending_return 
WHERE days_with_company > 30;

-- Customer transaction summary
SELECT * FROM customer_document_history 
WHERE currently_with_company_count > 0;
```

## Credits
Created: December 25, 2025
Version: 1.0.0

## License
Internal use only - SN Travels EID Staff System

