-- ========================================
-- DOCUMENT RECEIPTS - DATABASE FIX SCRIPT
-- Run this in phpMyAdmin or MySQL console
-- ========================================

-- Step 1: Check current database
SELECT DATABASE() as current_database;

-- Step 2: Check if tables exist
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('document_receipts', 'document_receipt_items', 'document_receipt_attachments', 'document_type_options')
ORDER BY TABLE_NAME;

-- Step 3: DROP existing tables if they have issues (CAREFUL - this deletes data!)
-- Uncomment these lines if you need to recreate tables:
-- DROP TABLE IF EXISTS document_receipt_attachments;
-- DROP TABLE IF EXISTS document_receipt_items;
-- DROP TABLE IF EXISTS document_receipts;
-- DROP TABLE IF EXISTS document_type_options;

-- Step 4: Create document_type_options table (for document types)
CREATE TABLE IF NOT EXISTS `document_type_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type_name` varchar(255) NOT NULL UNIQUE,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type_name` (`type_name`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Insert default document types
INSERT IGNORE INTO `document_type_options` (`type_name`) VALUES
('Passport'),
('Emirates ID'),
('Visa Copy'),
('Entry Permit'),
('Labour Contract'),
('Establishment Card'),
('Trade License'),
('Bank Guarantee'),
('Insurance Certificate'),
('Medical Certificate'),
('Educational Certificates'),
('Experience Certificates'),
('Tenancy Contract'),
('Ejari Certificate'),
('Power of Attorney'),
('Company Agreement'),
('Birth Certificate'),
('Marriage Certificate'),
('Driving License'),
('Vehicle Registration'),
('NOC Letter'),
('Salary Certificate'),
('Bank Statement'),
('Original Degree'),
('Attested Documents');

-- Step 6: Create document_receipts table
CREATE TABLE IF NOT EXISTS `document_receipts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receipt_number` varchar(50) NOT NULL UNIQUE,
  `customer_name` varchar(255) NOT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `transaction_type` enum('received','returned') NOT NULL,
  `transaction_date` datetime NOT NULL,
  `label` varchar(100) DEFAULT NULL COMMENT 'Physical location/label for document storage',
  `notes` text DEFAULT NULL,
  `status` enum('with_company','with_customer') NOT NULL DEFAULT 'with_company',
  `received_by_id` int(11) DEFAULT NULL COMMENT 'Staff who received the documents',
  `returned_by_id` int(11) DEFAULT NULL COMMENT 'Staff who returned the documents',
  `original_receipt_id` int(11) DEFAULT NULL COMMENT 'Link to original receipt when returning documents',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_receipt_number` (`receipt_number`),
  KEY `idx_customer_name` (`customer_name`),
  KEY `idx_transaction_type` (`transaction_type`),
  KEY `idx_status` (`status`),
  KEY `idx_transaction_date` (`transaction_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 7: Create document_receipt_items table
CREATE TABLE IF NOT EXISTS `document_receipt_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receipt_id` int(11) NOT NULL,
  `document_type_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL COMMENT 'Additional description of the document',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_receipt_id` (`receipt_id`),
  KEY `idx_document_type` (`document_type_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 8: Create document_receipt_attachments table
CREATE TABLE IF NOT EXISTS `document_receipt_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receipt_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL COMMENT 'File size in bytes',
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_receipt_id` (`receipt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 9: Verify tables were created
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('document_receipts', 'document_receipt_items', 'document_receipt_attachments', 'document_type_options')
ORDER BY TABLE_NAME;

-- Step 10: Check document_type_options data
SELECT COUNT(*) as total_document_types FROM document_type_options WHERE is_active = 1;

-- Step 11: View sample document types
SELECT id, type_name, is_active, created_at FROM document_type_options ORDER BY type_name LIMIT 10;

-- Step 12: Check customer table (needed for dropdown)
SELECT 
    COUNT(*) as total_customers 
FROM customer 
WHERE is_active = 1;

-- Step 13: If customer table doesn't exist or has no data, check this:
SHOW TABLES LIKE 'customer%';

-- Step 14: Describe customer table structure
DESCRIBE customer;

-- ========================================
-- EXPECTED RESULTS:
-- ========================================
-- ✅ 4 tables should exist (document_receipts, document_receipt_items, document_receipt_attachments, document_type_options)
-- ✅ document_type_options should have 25 rows
-- ✅ customer table should exist and have data
-- ========================================

-- Step 15: Test adding a document type manually
-- This tests if the table structure is correct
INSERT INTO document_type_options (type_name) 
VALUES ('TEST_TYPE_12345') 
ON DUPLICATE KEY UPDATE type_name = type_name;

-- Step 16: Check if it was added
SELECT * FROM document_type_options WHERE type_name = 'TEST_TYPE_12345';

-- Step 17: Clean up test
DELETE FROM document_type_options WHERE type_name = 'TEST_TYPE_12345';

-- ========================================
-- TROUBLESHOOTING:
-- ========================================
-- If tables don't exist: Run this entire script
-- If foreign keys fail: Make sure staff table exists
-- If customer query fails: Make sure customer table exists
-- ========================================

SELECT 'DATABASE CHECK COMPLETE' as status;

