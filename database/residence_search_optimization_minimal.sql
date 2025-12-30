-- =====================================================
-- RESIDENCE SEARCH OPTIMIZATION - MINIMAL CRITICAL INDEXES
-- =====================================================
-- This adds only the most critical indexes for search performance
-- Run: /Applications/XAMPP/xamppfiles/bin/mysql -u root sntravels_prod < this_file.sql
-- =====================================================

USE sntravels_prod;

-- First, check existing indexes
SELECT DISTINCT TABLE_NAME, INDEX_NAME, COLUMN_NAME
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'sntravels_prod' 
AND TABLE_NAME = 'residence'
ORDER BY INDEX_NAME;

-- Add only the most critical indexes if they don't exist

-- 1. Search field indexes (most important for LIKE queries)
ALTER TABLE `residence` 
ADD INDEX `idx_passenger_name` (`passenger_name`(50));

ALTER TABLE `residence`
ADD INDEX `idx_passport_number` (`passportNumber`(20));

ALTER TABLE `residence`
ADD INDEX `idx_uid` (`uid`(20));

-- 2. Foreign key indexes for JOINs
ALTER TABLE `residence`
ADD INDEX `idx_customer_id` (`customer_id`);

-- 3. Filter indexes
ALTER TABLE `residence`
ADD INDEX `idx_completed_step` (`completedStep`);

ALTER TABLE `residence`
ADD INDEX `idx_deleted` (`deleted`);

-- 4. Customer table indexes
ALTER TABLE `customer`
ADD INDEX `idx_customer_name` (`customer_name`(50));

-- 5. Company table indexes
ALTER TABLE `company`
ADD INDEX `idx_company_name` (`company_name`(50));

-- 6. Payment table indexes (for aggregations)
ALTER TABLE `customer_payments`
ADD INDEX `idx_payment_for_type` (`PaymentFor`, `payment_type`(20));

-- Analyze tables to update statistics
ANALYZE TABLE `residence`;
ANALYZE TABLE `customer`;
ANALYZE TABLE `company`;
ANALYZE TABLE `customer_payments`;

SELECT 'Critical indexes added successfully! Search should be much faster now.' as Status;

