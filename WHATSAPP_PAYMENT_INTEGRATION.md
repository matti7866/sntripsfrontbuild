# WhatsApp Payment Confirmation - Integration Guide

## ✅ Status: Ready to Deploy

---

## 📱 Template Details

**Template Name**: `payment_confirmation`  
**Template SID**: `HX03c6da8635f8851ad6ca70325a958ea9`  
**Category**: UTILITY  
**Status**: ✅ Approved

**Message Format**:
```
Payment received! ✓

Ref: #{{1}}
Amount: {{2}} AED  
Method: {{3}}

Thank you - SN Travels
```

**Variables**:
- `{{1}}` = Residence/Reference ID (e.g., "12345")
- `{{2}}` = Payment Amount (e.g., "5000.00")
- `{{3}}` = Payment Method (e.g., "Cash", "Bank Transfer", "Card")

---

## 📁 Files Updated

### 1. Backend API
**File**: `/api/whatsapp-api.php`

**Added**:
- `TEMPLATE_PAYMENT_CONFIRMATION` constant
- `sendPaymentConfirmation()` function
- `payment_confirmation` action handler

### 2. Frontend Service
**File**: `/src/services/whatsappService.ts`

**Added**:
- `PaymentConfirmationParams` interface
- `sendPaymentConfirmation()` function
- Export in default object

### 3. Payment Modal
**File**: `/src/components/residence/PaymentModal.tsx`

**Added**:
- Import `sendPaymentConfirmation` from whatsappService
- WhatsApp notification after email notification
- Reads customer phone from residence data

---

## 🔄 Payment Flow (After Integration)

```
1. Staff clicks "Pay Total Outstanding"
   ↓
2. Payment modal opens
   ↓
3. Staff enters payment details
   ↓
4. Payment processed successfully
   ↓
5. Notifications sent in parallel:
   - ✅ Email to admin (selabnadirydxb@gmail.com)
   - ✅ Email to customer (if email exists)
   - ✅ WhatsApp to customer (if phone exists) ← NEW!
   ↓
6. Customer receives WhatsApp:
   "Payment received! ✓
    Ref: #12345
    Amount: 5000.00 AED
    Method: Cash
    Thank you - SN Travels"
```

---

## 🚀 Deployment Steps

### Step 1: Upload to Server
Upload these files to your server:

```bash
/api/whatsapp-api.php           # Updated with payment template
```

### Step 2: Build & Deploy React Frontend
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/snt/react-frontend
npm run build
# Upload dist/ to Cloudflare
```

### Step 3: Test
1. Go to residence page
2. Click "Pay Total Outstanding"
3. Process a payment
4. Customer should receive:
   - ✅ Email
   - ✅ WhatsApp (if phone number exists)

---

## 📊 Customer Data Requirements

### Database Fields Needed

The system will look for customer phone in these fields (in order):
1. `customer_phone`
2. `customerPhone`
3. `mobile`

**Phone Format**: `971585550045` or `+971585550045`

**Example SQL to check**:
```sql
SELECT residenceID, passenger_name, customer_email, customer_phone, mobile
FROM residence 
WHERE residenceID = 12345;
```

---

## 🧪 Testing

### Test API Directly
```bash
curl -X POST https://admin.sntrips.com/api/whatsapp-api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "payment_confirmation",
    "to": "+971585550045",
    "reference_id": "12345",
    "amount": "5000.00",
    "payment_method": "Cash"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message_sid": "MM...",
  "status": "queued",
  "to": "+971585550045"
}
```

### Test from Frontend
```typescript
import { sendPaymentConfirmation } from '@/services/whatsappService';

const result = await sendPaymentConfirmation({
  to: '+971585550045',
  reference_id: '12345',
  amount: '5000.00',
  payment_method: 'Cash'
});

console.log(result);
```

---

## 📝 Usage Examples

### From PaymentModal (Already Integrated)
```typescript
// In sendPaymentNotifications function
const customerPhone = residence.customer_phone || residence.mobile;

if (customerPhone) {
  await sendPaymentConfirmation({
    to: customerPhone,
    reference_id: residenceID.toString(),
    amount: paymentAmount.toFixed(2),
    payment_method: paymentMethodUsed
  });
}
```

### From Any Component
```typescript
import { sendPaymentConfirmation } from '@/services/whatsappService';

// After processing payment
await sendPaymentConfirmation({
  to: customer.phone,
  reference_id: residence.residenceID,
  amount: '2500.00',
  payment_method: 'Bank Transfer'
});
```

---

## 🔍 Troubleshooting

### WhatsApp not received?
1. Check customer has phone number in database
2. Check logs: `/logs/whatsapp-YYYY-MM-DD.log`
3. Verify template SID is correct: `HX03c6da8635f8851ad6ca70325a958ea9`
4. Check phone format has country code

### API Error?
1. Test API endpoint: `https://admin.sntrips.com/api/whatsapp-api.php?test=1`
2. Check Twilio console for errors
3. Verify template is approved in Twilio

---

## 📊 Success Metrics

**Before**:
- Email to customer: ✅
- Email to admin: ✅

**After**:
- Email to customer: ✅
- Email to admin: ✅
- **WhatsApp to customer: ✅** ← NEW!

---

## 🎯 Benefits

1. **Instant Notification**: Customers get immediate WhatsApp confirmation
2. **Better Reach**: WhatsApp has higher open rates than email
3. **Professional**: Business-branded WhatsApp message
4. **Dual Channel**: Customers get both email and WhatsApp

---

## ✅ Checklist

- [x] Template created and approved
- [x] Backend API updated
- [x] Frontend service updated  
- [x] PaymentModal integrated
- [ ] Upload to server
- [ ] Build and deploy React app
- [ ] Test with real payment
- [ ] Verify customer receives WhatsApp

---

**Status**: Ready for deployment  
**Last Updated**: January 30, 2026  
**Template ID**: HX03c6da8635f8851ad6ca70325a958ea9
