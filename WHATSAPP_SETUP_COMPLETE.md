# WhatsApp API Integration - Complete Setup Guide
## Selab Nadiry Travel & Tourism L.L.C

✅ **Setup Status: COMPLETE & WORKING**

---

## 📋 Configuration Details

### Twilio Credentials
- **Account SID**: `AC***************************` (Set via environment variable)
- **Auth Token**: `***************************` (Set via environment variable)
- **WhatsApp Business Number**: `+15557264154`
- **Business Display Name**: Selab Nadiry Travel & Tourism L.L.C

### Approved Templates

#### 1. Authentication/OTP Template
- **Template SID**: `HXbdf0a398ea64d6e74e202ee591970178`
- **Type**: WhatsApp Authentication
- **Language**: English
- **Message Format**: `{{1}} is your verification code. For your security, do not share this code.`
- **Variables**:
  - `{{1}}`: The OTP/verification code
- **Features**: Includes "Copy OTP" button and 5-minute expiration notice

#### 2. Appointment Reminder Template
- **Template SID**: `HXb5b62575e6e4ff6129ad7c8efe1f983e`
- **Type**: Appointment Reminder
- **Language**: English
- **Message Format**: `Your appointment is coming up on {{1}} at {{2}}`
- **Variables**:
  - `{{1}}`: Appointment date
  - `{{2}}`: Appointment time

---

## 🚀 Usage

### Backend API (PHP)

**Endpoint**: `/whatsapp-api.php`

#### Send OTP/Verification Code

```bash
curl -X POST http://localhost/snt/react-frontend/whatsapp-api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "auth_code",
    "to": "+971501234567",
    "code": "123456"
  }'
```

**PHP Example:**
```php
<?php
$data = [
    'action' => 'auth_code',
    'to' => '+971501234567',
    'code' => '123456'
];

$ch = curl_init('http://localhost/snt/react-frontend/whatsapp-api.php');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if ($result['success']) {
    echo "Message sent! SID: " . $result['message_sid'];
}
?>
```

#### Send Appointment Reminder

```bash
curl -X POST http://localhost/snt/react-frontend/whatsapp-api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "custom_template",
    "to": "+971501234567",
    "template_sid": "HXb5b62575e6e4ff6129ad7c8efe1f983e",
    "variables": {
      "1": "February 5, 2026",
      "2": "3:00 PM"
    }
  }'
```

---

### Frontend Service (TypeScript/React)

**File**: `src/services/whatsappService.ts`

#### Send OTP

```typescript
import { sendAuthCode } from '@/services/whatsappService';

// Send verification code
const result = await sendAuthCode({
  to: '+971501234567',
  code: '123456'
});

if (result.success) {
  console.log('WhatsApp OTP sent!', result.message_sid);
} else {
  console.error('Failed:', result.error);
}
```

#### Send Custom Template

```typescript
import { sendCustomTemplate } from '@/services/whatsappService';

// Send appointment reminder
const result = await sendCustomTemplate({
  to: '+971501234567',
  template_sid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
  variables: {
    '1': 'February 5, 2026',
    '2': '3:00 PM'
  }
});
```

#### Generate Random OTP

```typescript
import { generateOTP } from '@/services/whatsappService';

const otp = generateOTP(6); // Generates 6-digit OTP
console.log(otp); // e.g., "847392"
```

---

## 🧪 Testing

### Test Files Available

1. **Simple HTML Test Page**
   - URL: `http://localhost/snt/react-frontend/test-whatsapp-simple.html`
   - Features: Easy form-based testing

2. **Advanced Test Page**
   - URL: `http://localhost/snt/react-frontend/test-whatsapp.html`
   - Features: Comprehensive testing with all options

3. **Direct PHP Test Script**
   - File: `test-whatsapp-send.php`
   - Run: `php test-whatsapp-send.php`

### Quick Test Command

```bash
curl -X POST http://localhost/snt/react-frontend/whatsapp-api.php \
  -H "Content-Type: application/json" \
  -d '{"action":"auth_code","to":"+971585550045","code":"999888"}'
```

---

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "message_sid": "MM...",
  "status": "queued",
  "to": "+971501234567"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here",
  "to": "+971501234567"
}
```

---

## 📁 Files Created

```
/whatsapp-api.php                           # Main API endpoint
/src/services/whatsappService.ts            # Frontend TypeScript service
/test-whatsapp.html                         # Advanced test page
/test-whatsapp-simple.html                  # Simple test page
/test-whatsapp-send.php                     # CLI test script
/composer.json                              # Composer dependencies
/vendor/                                    # Twilio SDK
/logs/whatsapp-YYYY-MM-DD.log              # Activity logs (auto-created)
```

---

## 🔒 Security Notes

1. **Never commit credentials** to version control
2. Move credentials to environment variables in production:
   ```php
   define('TWILIO_ACCOUNT_SID', getenv('TWILIO_ACCOUNT_SID'));
   define('TWILIO_AUTH_TOKEN', getenv('TWILIO_AUTH_TOKEN'));
   ```
3. Add rate limiting to prevent abuse
4. Validate phone numbers before sending
5. Store message logs for audit trails

---

## 📝 Logging

All WhatsApp activity is logged to:
```
/logs/whatsapp-YYYY-MM-DD.log
```

Log format:
```
[2026-01-30 15:30:45] {"status":"success","to":"+971501234567","message_sid":"MM...","template":"...","variables":{"1":"..."}}
```

---

## 🎯 Common Use Cases

### 1. User Login OTP
```typescript
// Generate and send OTP for user login
const otp = generateOTP(6);
await sendAuthCode({
  to: user.phone,
  code: otp
});
// Store OTP in session/database for verification
```

### 2. Booking Confirmation
```typescript
await sendCustomTemplate({
  to: customer.phone,
  template_sid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
  variables: {
    '1': booking.date,
    '2': booking.time
  }
});
```

### 3. Password Reset
```typescript
const resetCode = generateOTP(6);
await sendAuthCode({
  to: user.phone,
  code: resetCode
});
```

---

## ✅ Next Steps

1. **Integrate into your application** using the examples above
2. **Test thoroughly** with real phone numbers
3. **Monitor logs** in `/logs/` directory
4. **Set up environment variables** for production
5. **Add more templates** in Twilio as needed
6. **Consider rate limiting** for production use

---

## 🆘 Troubleshooting

### Messages not received?
- ✅ Check phone number format (include country code)
- ✅ Verify template SID is correct
- ✅ Check Twilio console for error messages
- ✅ Ensure WhatsApp Business number is active
- ✅ Verify phone number can receive WhatsApp messages

### API returns error?
- Check `/logs/whatsapp-YYYY-MM-DD.log` for details
- Verify Twilio credentials are correct
- Ensure template variables match template structure
- Check Twilio account balance (if applicable)

### Need help?
- Twilio Console: https://console.twilio.com
- Twilio Docs: https://www.twilio.com/docs/whatsapp
- Check logs: `/logs/whatsapp-*.log`

---

## 📞 Support

**Twilio Support**: https://support.twilio.com
**Documentation**: https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates

---

**Last Updated**: January 30, 2026
**Status**: ✅ Production Ready
**Version**: 1.0.0
