-- Quick Database Check and Fix Script
-- Run this to verify and fix any issues with document receipt tables

-- Check if tables exist
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('document_receipts', 'document_receipt_items', 'document_receipt_attachments', 'document_type_options');

-- If tables don't exist or there are issues, run the main migration:
-- SOURCE database/document_receipts_migration.sql;

-- Check document_type_options table
SELECT COUNT(*) as total_document_types FROM document_type_options WHERE is_active = 1;

-- View sample data
SELECT * FROM document_type_options LIMIT 10;

-- Check customer table structure (for dropdown)
DESCRIBE customer;

-- Test customer query
SELECT customer_id, customer_name, customer_phone, customer_email 
FROM customer 
WHERE is_active = 1 
ORDER BY customer_name ASC 
LIMIT 10;

