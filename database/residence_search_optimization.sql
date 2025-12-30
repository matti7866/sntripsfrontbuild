-- =====================================================
-- RESIDENCE SEARCH OPTIMIZATION - DATABASE INDEXES
-- =====================================================
-- This file creates indexes to speed up residence search queries
-- Run this on your production database to improve search performance
-- =====================================================

-- Check if indexes already exist before creating them
-- Run this file with: mysql -u root -p sntravels_prod < residence_search_optimization.sql

USE sntravels_prod;

-- =====================================================
-- RESIDENCE TABLE INDEXES
-- =====================================================

-- Index on commonly searched text fields
-- These are used in the search WHERE clause
ALTER TABLE `residence` 
ADD INDEX IF NOT EXISTS `idx_passenger_name` (`passenger_name`(50)),
ADD INDEX IF NOT EXISTS `idx_passport_number` (`passportNumber`(20)),
ADD INDEX IF NOT EXISTS `idx_uid` (`uid`(20)),
ADD INDEX IF NOT EXISTS `idx_emirates_id` (`EmiratesIDNumber`(20));

-- Index on foreign keys for JOIN performance
ALTER TABLE `residence`
ADD INDEX IF NOT EXISTS `idx_customer_id` (`customer_id`),
ADD INDEX IF NOT EXISTS `idx_company` (`company`),
ADD INDEX IF NOT EXISTS `idx_nationality` (`Nationality`),
ADD INDEX IF NOT EXISTS `idx_visa_type` (`VisaType`),
ADD INDEX IF NOT EXISTS `idx_currency` (`saleCurID`),
ADD INDEX IF NOT EXISTS `idx_position` (`positionID`);

-- Index on filter columns
ALTER TABLE `residence`
ADD INDEX IF NOT EXISTS `idx_completed_step` (`completedStep`),
ADD INDEX IF NOT EXISTS `idx_cancelled` (`cancelled`),
ADD INDEX IF NOT EXISTS `idx_hold` (`hold`),
ADD INDEX IF NOT EXISTS `idx_deleted` (`deleted`),
ADD INDEX IF NOT EXISTS `idx_datetime` (`datetime`),
ADD INDEX IF NOT EXISTS `idx_inside_outside` (`InsideOutside`(10));

-- Composite index for common query patterns
ALTER TABLE `residence`
ADD INDEX IF NOT EXISTS `idx_status_step` (`deleted`, `cancelled`, `hold`, `completedStep`),
ADD INDEX IF NOT EXISTS `idx_customer_deleted` (`customer_id`, `deleted`);

-- =====================================================
-- CUSTOMER TABLE INDEXES
-- =====================================================

ALTER TABLE `customer`
ADD INDEX IF NOT EXISTS `idx_customer_name` (`customer_name`(50)),
ADD INDEX IF NOT EXISTS `idx_customer_phone` (`customer_phone`(20)),
ADD INDEX IF NOT EXISTS `idx_customer_email` (`customer_email`(50));

-- =====================================================
-- COMPANY TABLE INDEXES
-- =====================================================

ALTER TABLE `company`
ADD INDEX IF NOT EXISTS `idx_company_name` (`company_name`(50)),
ADD INDEX IF NOT EXISTS `idx_company_number` (`company_number`(20));

-- =====================================================
-- PAYMENT TABLES INDEXES (for subquery optimization)
-- =====================================================

ALTER TABLE `customer_payments`
ADD INDEX IF NOT EXISTS `idx_payment_for` (`PaymentFor`),
ADD INDEX IF NOT EXISTS `idx_payment_type` (`payment_type`(20)),
ADD INDEX IF NOT EXISTS `idx_residence_fine_payment` (`residenceFinePayment`),
ADD INDEX IF NOT EXISTS `idx_family_res_payment` (`family_res_payment`),
ADD INDEX IF NOT EXISTS `idx_payment_for_type` (`PaymentFor`, `payment_type`(20));

ALTER TABLE `residencefine`
ADD INDEX IF NOT EXISTS `idx_residence_id` (`residenceID`);

ALTER TABLE `residence_charges`
ADD INDEX IF NOT EXISTS `idx_residence_id` (`residence_id`);

ALTER TABLE `residence_custom_charges`
ADD INDEX IF NOT EXISTS `idx_residence_id` (`residence_id`);

-- =====================================================
-- FAMILY RESIDENCE TABLE INDEXES
-- =====================================================

ALTER TABLE `family_residence`
ADD INDEX IF NOT EXISTS `idx_passenger_name` (`passenger_name`(50)),
ADD INDEX IF NOT EXISTS `idx_passport_number` (`passport_number`(20)),
ADD INDEX IF NOT EXISTS `idx_customer_id` (`customer_id`),
ADD INDEX IF NOT EXISTS `idx_residence_id` (`residence_id`),
ADD INDEX IF NOT EXISTS `idx_completed_step` (`completed_step`),
ADD INDEX IF NOT EXISTS `idx_status` (`status`(20)),
ADD INDEX IF NOT EXISTS `idx_nationality` (`nationality`);

-- =====================================================
-- ANALYZE TABLES (Update statistics for query optimizer)
-- =====================================================

ANALYZE TABLE `residence`;
ANALYZE TABLE `customer`;
ANALYZE TABLE `company`;
ANALYZE TABLE `customer_payments`;
ANALYZE TABLE `residencefine`;
ANALYZE TABLE `residence_charges`;
ANALYZE TABLE `residence_custom_charges`;
ANALYZE TABLE `family_residence`;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show all indexes on residence table
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    CARDINALITY
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'sntravels_prod' 
AND TABLE_NAME = 'residence'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Show table statistics
SHOW TABLE STATUS LIKE 'residence';

SELECT 'Indexes created successfully!' as Status;

