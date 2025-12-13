# End-of-Day Account Closure Feature

## Overview
This feature allows you to close daily account balances and receive an email statement of all accounts.

## What It Does

1. **📸 Creates a Snapshot**: Captures all account balances as of the selected date
2. **💾 Stores Record**: Saves the closure data permanently in the database
3. **📧 Emails Statement**: Sends a comprehensive HTML email with all account details
4. **📊 Generates Report**: Shows credits, debits, and final balance for each account

## How to Use

### 1. Navigate to Accounts Report
Go to: `http://127.0.0.1:5174/accounts/report` or `https://app.sntrips.com/accounts/report`

### 2. Click "Close Day & Email" Button
- Located in the action buttons row (dark button)
- Icon: 📅 Calendar Check

### 3. Select Date
- Choose the date you want to close
- Date must be between the reset date (2025-10-01) and today
- Default: Today's date

### 4. Confirm Closure
- Review the warning about ensuring all transactions are entered
- Click "Close Day & Send Email"
- Wait for confirmation

### 5. Check Email
Statement will be sent to: **mattiullah.nadiry@gmail.com**

## Email Content

The email includes:
- **Header**: Date and period covered
- **Summary**: Total accounts and generation time
- **Detailed Table**: All accounts with:
  - Account ID and Name
  - Account Number
  - Total Credits
  - Total Debits
  - Current Balance
  - Currency
  - Status (Positive/Negative)

## Database Setup

### Create Required Table
Run the SQL script located at:
```
/Applications/XAMPP/xamppfiles/htdocs/snt/api/accounts/create-day-closure-table.sql
```

Or run this SQL:
```sql
CREATE TABLE IF NOT EXISTS `account_day_closures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `closure_date` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int(11) DEFAULT NULL,
  `total_accounts` int(11) DEFAULT 0,
  `statement_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `email_sent_to` varchar(255) DEFAULT NULL,
  `email_sent_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_closure_date` (`closure_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Email Configuration

### Using PHP Mail (Default)
The system uses PHP's built-in `mail()` function. Make sure your server is configured to send emails.

### For XAMPP Users
1. Install a mail server (like sendmail or Mercury)
2. Configure `php.ini`:
   ```ini
   [mail function]
   SMTP = smtp.gmail.com
   smtp_port = 587
   sendmail_from = your-email@gmail.com
   ```

### Alternative: Use SMTP
To use SMTP (Gmail, Outlook, etc.), update `/api/accounts/close-day.php` to use PHPMailer:

```php
require 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;

$mail = new PHPMailer(true);
$mail->isSMTP();
$mail->Host = 'smtp.gmail.com';
$mail->SMTPAuth = true;
$mail->Username = 'your-email@gmail.com';
$mail->Password = 'your-app-password';
$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port = 587;
$mail->setFrom('noreply@sntrips.com', 'SN Travels');
$mail->addAddress($email);
$mail->isHTML(true);
$mail->Subject = $emailSubject;
$mail->Body = $emailBody;
$mail->send();
```

## Features

- ✅ **Automatic Calculation**: Computes all credits and debits from reset date to closure date
- ✅ **Multi-Currency Support**: Shows balances in their original currencies
- ✅ **Historical Record**: Stores closure data for audit trail
- ✅ **Beautiful Email**: Professional HTML email with styling
- ✅ **Duplicate Prevention**: Cannot close the same date twice (unique constraint)
- ✅ **Update Support**: Re-closing the same date updates the record

## Files Modified/Created

### Frontend
- `src/pages/accounts/AccountsReport.tsx` - Added UI and functionality
- `src/services/accountsService.ts` - Added API method

### Backend
- `/api/accounts/close-day.php` - Main API endpoint (NEW)
- `/api/accounts/create-day-closure-table.sql` - Database schema (NEW)

## Transaction Sources

The system includes transactions from:
- Customer Payments
- Deposits
- Transfers (both in and out)
- Expenses
- Withdrawals
- Supplier Payments

## Notes

- All balances are calculated from the permanent reset date (2025-10-01)
- Email is sent asynchronously - check spam folder if not received
- Closure records are stored permanently for audit purposes
- You can re-close the same date to update the statement

## Support

For issues or questions, contact the development team or check the application logs.

