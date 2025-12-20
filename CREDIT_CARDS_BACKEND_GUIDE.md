# Credit Cards Backend Implementation Guide

## Overview
This guide will help you implement the backend PHP code to support the Credit Cards module. Credit cards are integrated as **Account Type 4** in your existing accounts system.

## Database Schema Changes

### 1. Update `accounts` table
Add the following columns to your existing `accounts` table:

```sql
ALTER TABLE `accounts` 
ADD COLUMN `card_holder_name` VARCHAR(255) NULL AFTER `accountNum`,
ADD COLUMN `card_type` ENUM('Visa', 'Mastercard', 'American Express', 'Other') NULL AFTER `card_holder_name`,
ADD COLUMN `bank_name` VARCHAR(255) NULL AFTER `card_type`,
ADD COLUMN `credit_limit` DECIMAL(15,2) DEFAULT 0.00 AFTER `bank_name`,
ADD COLUMN `billing_cycle_day` INT(2) DEFAULT 1 AFTER `credit_limit`,
ADD COLUMN `payment_due_day` INT(2) DEFAULT 21 AFTER `billing_cycle_day`,
ADD COLUMN `interest_rate` DECIMAL(5,2) DEFAULT 0.00 AFTER `payment_due_day`,
ADD COLUMN `expiry_date` VARCHAR(5) NULL AFTER `interest_rate`,
ADD COLUMN `is_active` TINYINT(1) DEFAULT 1 AFTER `expiry_date`,
ADD COLUMN `notes` TEXT NULL AFTER `is_active`;
```

### 2. Update account type enum (if using ENUM)
If your `accountType` column uses ENUM, update it:

```sql
ALTER TABLE `accounts` 
MODIFY COLUMN `accountType` ENUM('1', '2', '3', '4') DEFAULT '1' 
COMMENT '1=Personal, 2=Business, 3=Cash, 4=Credit Card';
```

## Backend PHP Implementation

### Update `accountsController.php`

Add these new actions to your existing `accountsController.php`:

```php
<?php
// ... existing includes and session checks ...

// Get all credit cards (accountType = 4)
if (isset($_POST['GetCreditCards'])) {
    try {
        $query = "SELECT 
            a.account_ID,
            a.account_Name,
            a.accountNum,
            a.card_holder_name,
            a.card_type,
            a.bank_name,
            a.credit_limit,
            a.billing_cycle_day,
            a.payment_due_day,
            a.interest_rate,
            a.expiry_date,
            a.is_active,
            a.notes,
            a.accountType,
            a.curID,
            c.currencyName,
            COALESCE((
                SELECT SUM(CASE 
                    WHEN transactionType = 'debit' THEN amount 
                    WHEN transactionType = 'credit' THEN -amount 
                    ELSE 0 
                END)
                FROM account_transactions 
                WHERE account_id = a.account_ID
            ), 0) as current_balance
        FROM accounts a
        LEFT JOIN currency c ON a.curID = c.currencyID
        WHERE a.accountType = 4
        ORDER BY a.account_Name ASC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $creditCards = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate available credit for each card
        foreach ($creditCards as &$card) {
            $card['current_balance'] = (float)$card['current_balance'];
            $card['credit_limit'] = (float)$card['credit_limit'];
            $card['available_credit'] = $card['credit_limit'] - $card['current_balance'];
        }
        
        echo json_encode($creditCards);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// Get single credit card
if (isset($_POST['GetSingleCreditCard'])) {
    try {
        $accountID = $_POST['accountID'];
        
        $query = "SELECT 
            a.*,
            c.currencyName,
            COALESCE((
                SELECT SUM(CASE 
                    WHEN transactionType = 'debit' THEN amount 
                    WHEN transactionType = 'credit' THEN -amount 
                    ELSE 0 
                END)
                FROM account_transactions 
                WHERE account_id = a.account_ID
            ), 0) as current_balance
        FROM accounts a
        LEFT JOIN currency c ON a.curID = c.currencyID
        WHERE a.account_ID = ? AND a.accountType = 4";
        
        $stmt = $conn->prepare($query);
        $stmt->execute([$accountID]);
        $card = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($card) {
            $card['current_balance'] = (float)$card['current_balance'];
            $card['credit_limit'] = (float)$card['credit_limit'];
            $card['available_credit'] = $card['credit_limit'] - $card['current_balance'];
            echo json_encode($card);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Credit card not found']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// Save new credit card
if (isset($_POST['SaveCreditCard'])) {
    try {
        $account_name = $_POST['account_name'];
        $account_number = $_POST['account_number'] ?? '';
        $card_holder_name = $_POST['card_holder_name'];
        $card_type = $_POST['card_type'] ?? 'Visa';
        $bank_name = $_POST['bank_name'] ?? '';
        $credit_limit = $_POST['credit_limit'] ?? 0;
        $billing_cycle_day = $_POST['billing_cycle_day'] ?? 1;
        $payment_due_day = $_POST['payment_due_day'] ?? 21;
        $interest_rate = $_POST['interest_rate'] ?? 0;
        $currency_type = $_POST['currency_type'];
        $expiry_date = $_POST['expiry_date'] ?? '';
        $notes = $_POST['notes'] ?? '';
        $accountType = 4; // Credit Card
        
        $query = "INSERT INTO accounts (
            account_Name, 
            accountNum, 
            card_holder_name,
            card_type,
            bank_name,
            credit_limit,
            billing_cycle_day,
            payment_due_day,
            interest_rate,
            expiry_date,
            notes,
            accountType, 
            curID,
            is_active,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())";
        
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $account_name,
            $account_number,
            $card_holder_name,
            $card_type,
            $bank_name,
            $credit_limit,
            $billing_cycle_day,
            $payment_due_day,
            $interest_rate,
            $expiry_date,
            $notes,
            $accountType,
            $currency_type
        ]);
        
        echo "Success";
    } catch (Exception $e) {
        http_response_code(500);
        echo $e->getMessage();
    }
    exit;
}

// Update credit card
if (isset($_POST['UpdateCreditCard'])) {
    try {
        $accountID = $_POST['accountID'];
        $updates = [];
        $params = [];
        
        if (isset($_POST['updaccount_name'])) {
            $updates[] = "account_Name = ?";
            $params[] = $_POST['updaccount_name'];
        }
        if (isset($_POST['updaccount_number'])) {
            $updates[] = "accountNum = ?";
            $params[] = $_POST['updaccount_number'];
        }
        if (isset($_POST['card_holder_name'])) {
            $updates[] = "card_holder_name = ?";
            $params[] = $_POST['card_holder_name'];
        }
        if (isset($_POST['card_type'])) {
            $updates[] = "card_type = ?";
            $params[] = $_POST['card_type'];
        }
        if (isset($_POST['bank_name'])) {
            $updates[] = "bank_name = ?";
            $params[] = $_POST['bank_name'];
        }
        if (isset($_POST['credit_limit'])) {
            $updates[] = "credit_limit = ?";
            $params[] = $_POST['credit_limit'];
        }
        if (isset($_POST['billing_cycle_day'])) {
            $updates[] = "billing_cycle_day = ?";
            $params[] = $_POST['billing_cycle_day'];
        }
        if (isset($_POST['payment_due_day'])) {
            $updates[] = "payment_due_day = ?";
            $params[] = $_POST['payment_due_day'];
        }
        if (isset($_POST['interest_rate'])) {
            $updates[] = "interest_rate = ?";
            $params[] = $_POST['interest_rate'];
        }
        if (isset($_POST['updcurrency_type'])) {
            $updates[] = "curID = ?";
            $params[] = $_POST['updcurrency_type'];
        }
        if (isset($_POST['expiry_date'])) {
            $updates[] = "expiry_date = ?";
            $params[] = $_POST['expiry_date'];
        }
        if (isset($_POST['is_active'])) {
            $updates[] = "is_active = ?";
            $params[] = $_POST['is_active'];
        }
        if (isset($_POST['notes'])) {
            $updates[] = "notes = ?";
            $params[] = $_POST['notes'];
        }
        
        if (empty($updates)) {
            echo "No fields to update";
            exit;
        }
        
        $updates[] = "updated_at = NOW()";
        $params[] = $accountID;
        
        $query = "UPDATE accounts SET " . implode(", ", $updates) . " WHERE account_ID = ? AND accountType = 4";
        
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        
        echo "Success";
    } catch (Exception $e) {
        http_response_code(500);
        echo $e->getMessage();
    }
    exit;
}

// Delete credit card
if (isset($_POST['DeleteCreditCard'])) {
    try {
        $accountID = $_POST['accountID'];
        
        // Check if there are transactions
        $checkQuery = "SELECT COUNT(*) as count FROM account_transactions WHERE account_id = ?";
        $stmt = $conn->prepare($checkQuery);
        $stmt->execute([$accountID]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] > 0) {
            echo "Cannot delete credit card with existing transactions. Please deactivate it instead.";
            exit;
        }
        
        $query = "DELETE FROM accounts WHERE account_ID = ? AND accountType = 4";
        $stmt = $conn->prepare($query);
        $stmt->execute([$accountID]);
        
        echo "Success";
    } catch (Exception $e) {
        http_response_code(500);
        echo $e->getMessage();
    }
    exit;
}

// Get credit card transactions
if (isset($_POST['GetCreditCardTransactions'])) {
    try {
        $accountID = $_POST['accountID'];
        $startDate = $_POST['start_date'] ?? null;
        $endDate = $_POST['end_date'] ?? null;
        
        $query = "SELECT * FROM account_transactions WHERE account_id = ?";
        $params = [$accountID];
        
        if ($startDate) {
            $query .= " AND transaction_date >= ?";
            $params[] = $startDate;
        }
        if ($endDate) {
            $query .= " AND transaction_date <= ?";
            $params[] = $endDate;
        }
        
        $query .= " ORDER BY transaction_date DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($transactions);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// ... rest of your existing controller code ...
?>
```

## Integration with Payment Systems

### Update Payment Forms
When displaying account dropdowns in payment forms, credit cards (accountType = 4) will automatically appear since they're stored in the accounts table. You can optionally add visual indicators:

```php
// In your payment controller dropdowns
$query = "SELECT 
    account_ID, 
    account_Name,
    accountType,
    CASE 
        WHEN accountType = 4 THEN CONCAT('💳 ', account_Name, ' (Credit Card)')
        ELSE account_Name 
    END as display_name
FROM accounts 
WHERE is_active = 1 
ORDER BY accountType, account_Name";
```

## Best Practices

1. **Security**: Never store full credit card numbers or CVV codes in plain text
2. **Validation**: Validate expiry dates on the frontend and backend
3. **Permissions**: Restrict credit card management to admin/finance roles
4. **Audit Trail**: Log all credit card modifications
5. **Balance Tracking**: Use existing account_transactions table for credit card expenses

## Testing Checklist

- [ ] Add a new credit card
- [ ] Edit credit card details
- [ ] Delete credit card (without transactions)
- [ ] View credit card list
- [ ] Use credit card in payment forms
- [ ] Check credit limit warnings
- [ ] Verify balance calculations
- [ ] Test search/filter functionality
- [ ] Verify currency handling

## Next Steps

1. Run the database ALTER statements
2. Add the PHP code to `accountsController.php`
3. Test adding a credit card through the UI
4. Verify credit cards appear in payment dropdowns
5. Test making payments using credit cards

## Notes

- Credit cards are treated as accounts (Type 4), so all existing account reports and transactions automatically include them
- The frontend is fully implemented and ready to use
- You can extend this by adding:
  - Payment reminders based on billing cycle
  - Interest calculations
  - Statement generation
  - Credit card reconciliation features

## Support

If you need help with:
- Database migration
- PHP implementation
- Adding custom features
- Integration issues

Please refer to your existing `accountManagementService.ts` and `AccountManagement.tsx` for pattern reference.

