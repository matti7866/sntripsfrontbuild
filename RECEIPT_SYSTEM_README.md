# Receipt System Implementation Guide 📄

## Overview
The modern receipt system has been implemented in React with these features:
- ✅ Beautiful professional receipt design
- ✅ Company logo and branding
- ✅ Transaction details table
- ✅ Outstanding balance calculation
- ✅ Digital signatures (company & customer)
- ✅ **QR Code generation** (NEW!)
- ✅ Print functionality (A5 landscape)
- ✅ Gradient borders and professional styling

## Installation

### Step 1: Install Required Packages

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/snt/react-frontend
npm install qrcode.react signature_pad @types/qrcode.react
```

### Step 2: Backend API File

Upload this file to your server:
- `/Applications/XAMPP/xamppfiles/htdocs/snt/api/customers/receipt/get-receipt.php`

## Usage

### Access Receipt

#### Method 1: From Customer Ledger
1. Go to `/ledger/customer`
2. Click "Make Receipt" link for any customer
3. Opens: `/receipt?id=INVOICE_ID&curID=CURRENCY_ID`

#### Method 2: Direct URL
```
http://127.0.0.1:5174/payment/receipt/INVOICE_ID
```

or

```
http://127.0.0.1:5174/receipt?id=INVOICE_ID
```

## Features

### 1. Receipt Header
- Company logo (top left)
- Company name and contact info
- Receipt number
- Customer name
- Date
- Currency
- **QR Code** (scan to verify receipt)

### 2. Transaction Details Table
Shows all transactions included in this receipt:
- Tickets
- Visas
- Residence
- Services
- Payments
- Hotels
- Car Rentals
- Loans
- Date Extensions
- Refunds
- And more...

### 3. Financial Summary
- Total Paid
- Outstanding Balance

### 4. Digital Signatures
- Company Signature (left canvas)
- Customer Signature (right canvas)
- Erase buttons for both

### 5. QR Code Feature (NEW!)
The QR code contains:
```json
{
  "receiptNumber": "INV-2024-001",
  "customerName": "John Doe",
  "date": "27-Nov-2024",
  "amount": 5000,
  "verifyUrl": "https://yoursite.com/payment/receipt/123"
}
```

Scan with any QR code reader to:
- Verify receipt authenticity
- View receipt online
- Check payment details

### 6. Print Functionality
- Click "Print Receipt" button
- Prints in **A5 landscape** format
- Professional styling with gradient borders
- Optimized for thermal/regular printers

## Files Created

### Frontend (React):
1. `/src/pages/payment/Receipt.tsx` - Main receipt component
2. `/src/pages/payment/Receipt.css` - Styling (matches original)
3. `/src/App.tsx` - Added routes

### Backend (PHP):
1. `/api/customers/receipt/get-receipt.php` - API endpoint

## API Endpoints

### Get Receipt Info
```
POST /api/customers/receipt/get-receipt.php
{
  "action": "getReceiptInfo",
  "receiptID": 123
}
```

### Get Receipt Details (Transactions)
```
POST /api/customers/receipt/get-receipt.php
{
  "action": "getReceiptDetails",
  "receiptID": 123
}
```

### Get Outstanding Balance
```
POST /api/customers/receipt/get-receipt.php
{
  "action": "getOutstandingBalance",
  "customerID": 456,
  "currencyID": 1
}
```

## Styling

The receipt uses the exact same styling as the original PHP version:
- Montserrat font for company info
- Red gradient borders
- A5 landscape print format
- Professional table styling
- Signature pads at bottom

## Next Steps

1. ✅ Install npm packages (qrcode.react, signature_pad)
2. ✅ Upload backend PHP file
3. ✅ Test receipt generation from Customer Ledger
4. ✅ Test printing functionality
5. ✅ Test QR code scanning

## Testing

1. Go to Customer Ledger: `http://127.0.0.1:5174/ledger/customer`
2. Select a currency
3. Click "Make Receipt" for any customer with pending payments
4. Receipt should open with all transaction details
5. Sign on both signature pads
6. Click "Print Receipt" to print
7. Scan QR code with phone to verify

## Troubleshooting

### QR Code not showing?
- Run: `npm install qrcode.react`
- Refresh the page

### Signatures not working?
- Run: `npm install signature_pad`
- Refresh the page

### Receipt not loading?
- Check that backend API file is uploaded to server
- Check browser console for errors
- Verify JWT token is valid

## Future Enhancements

- [ ] PDF download button
- [ ] Email receipt to customer
- [ ] WhatsApp share receipt
- [ ] Multiple receipts in one print
- [ ] Custom receipt templates
- [ ] Receipt history view

---

**Created by:** AI Assistant
**Date:** November 27, 2024
**Version:** 1.0.0




