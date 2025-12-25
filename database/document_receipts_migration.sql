-- Document Receipt Management System Database Schema
-- Created: 2025-12-25
-- Description: Tables for managing document receipts (receiving and returning documents)

-- Main document receipts table
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
  KEY `idx_transaction_date` (`transaction_date`),
  KEY `idx_original_receipt` (`original_receipt_id`),
  KEY `fk_received_by` (`received_by_id`),
  KEY `fk_returned_by` (`returned_by_id`),
  CONSTRAINT `fk_document_receipts_received_by` FOREIGN KEY (`received_by_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_document_receipts_returned_by` FOREIGN KEY (`returned_by_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_document_receipts_original` FOREIGN KEY (`original_receipt_id`) REFERENCES `document_receipts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document receipt items (document types and quantities)
CREATE TABLE IF NOT EXISTS `document_receipt_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receipt_id` int(11) NOT NULL,
  `document_type_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL COMMENT 'Additional description of the document',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_receipt_id` (`receipt_id`),
  KEY `idx_document_type` (`document_type_name`),
  CONSTRAINT `fk_receipt_items_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `document_receipts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document receipt attachments (scanned copies, photos, etc.)
CREATE TABLE IF NOT EXISTS `document_receipt_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receipt_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL COMMENT 'File size in bytes',
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_receipt_id` (`receipt_id`),
  CONSTRAINT `fk_receipt_attachments_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `document_receipts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document type options (predefined common document types)
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

-- Insert some common document types
INSERT INTO `document_type_options` (`type_name`) VALUES
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
('Vehicle Registration')
ON DUPLICATE KEY UPDATE type_name = VALUES(type_name);

-- Create indexes for better performance
CREATE INDEX idx_receipt_search ON document_receipts(customer_name, receipt_number, customer_phone, customer_email);
CREATE INDEX idx_receipt_date_range ON document_receipts(transaction_date, transaction_type);

-- Create view for quick stats
CREATE OR REPLACE VIEW document_receipt_stats AS
SELECT 
  COUNT(*) as total_receipts,
  SUM(CASE WHEN transaction_type = 'received' THEN 1 ELSE 0 END) as total_received,
  SUM(CASE WHEN transaction_type = 'returned' THEN 1 ELSE 0 END) as total_returned,
  SUM(CASE WHEN status = 'with_company' THEN 1 ELSE 0 END) as currently_with_company,
  SUM(CASE WHEN status = 'with_customer' THEN 1 ELSE 0 END) as currently_with_customer,
  COUNT(DISTINCT customer_name) as unique_customers,
  DATE(MAX(transaction_date)) as last_transaction_date
FROM document_receipts;

-- Create view for documents currently with company (pending return)
CREATE OR REPLACE VIEW documents_pending_return AS
SELECT 
  dr.id,
  dr.receipt_number,
  dr.customer_name,
  dr.customer_phone,
  dr.customer_email,
  dr.transaction_date as received_date,
  dr.label,
  DATEDIFF(NOW(), dr.transaction_date) as days_with_company,
  GROUP_CONCAT(CONCAT(dri.document_type_name, ' (', dri.quantity, ')') SEPARATOR ', ') as documents,
  s.staff_name as received_by
FROM document_receipts dr
LEFT JOIN document_receipt_items dri ON dr.id = dri.receipt_id
LEFT JOIN staff s ON dr.received_by_id = s.id
WHERE dr.status = 'with_company'
  AND dr.transaction_type = 'received'
GROUP BY dr.id
ORDER BY dr.transaction_date DESC;

-- Create view for document receipt history per customer
CREATE OR REPLACE VIEW customer_document_history AS
SELECT 
  dr.customer_name,
  dr.customer_phone,
  dr.customer_email,
  COUNT(*) as total_transactions,
  SUM(CASE WHEN dr.transaction_type = 'received' THEN 1 ELSE 0 END) as times_received,
  SUM(CASE WHEN dr.transaction_type = 'returned' THEN 1 ELSE 0 END) as times_returned,
  MAX(dr.transaction_date) as last_transaction_date,
  SUM(CASE WHEN dr.status = 'with_company' THEN 1 ELSE 0 END) as currently_with_company_count
FROM document_receipts dr
GROUP BY dr.customer_name, dr.customer_phone, dr.customer_email
ORDER BY last_transaction_date DESC;

-- Sample data for testing (optional - comment out if not needed)
-- INSERT INTO document_receipts 
-- (receipt_number, customer_name, customer_phone, customer_email, transaction_type, transaction_date, label, notes, status, received_by_id)
-- VALUES
-- ('RCV-202501-0001', 'Ahmed Ali Hassan', '+971501234567', 'ahmed@example.com', 'received', '2025-01-15 10:30:00', 'Shelf-A-01', 'Original passport and visa documents', 'with_company', 1),
-- ('RCV-202501-0002', 'Mohammed Khan', '+971502345678', 'mohammed@example.com', 'received', '2025-01-16 14:20:00', 'Box-B-05', 'Educational certificates and passport', 'with_company', 1),
-- ('RET-202501-0001', 'Fatima Abdullah', '+971503456789', 'fatima@example.com', 'returned', '2025-01-17 11:00:00', NULL, 'Documents returned after visa processing', 'with_customer', 2);

DELIMITER //

-- Trigger to automatically update status when returning documents
CREATE TRIGGER `after_receipt_insert_update_status` 
AFTER INSERT ON `document_receipts`
FOR EACH ROW
BEGIN
  IF NEW.transaction_type = 'returned' AND NEW.original_receipt_id IS NOT NULL THEN
    UPDATE document_receipts 
    SET status = 'with_customer' 
    WHERE id = NEW.original_receipt_id;
  END IF;
END//

-- Trigger to prevent deletion of receipts that have return records
CREATE TRIGGER `before_receipt_delete_check` 
BEFORE DELETE ON `document_receipts`
FOR EACH ROW
BEGIN
  DECLARE return_count INT;
  
  SELECT COUNT(*) INTO return_count
  FROM document_receipts
  WHERE original_receipt_id = OLD.id;
  
  IF return_count > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Cannot delete receipt that has associated return records';
  END IF;
END//

DELIMITER ;

-- Grant permissions (adjust as needed for your database users)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON document_receipts TO 'your_app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON document_receipt_items TO 'your_app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON document_receipt_attachments TO 'your_app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON document_type_options TO 'your_app_user'@'localhost';
-- GRANT SELECT ON document_receipt_stats TO 'your_app_user'@'localhost';
-- GRANT SELECT ON documents_pending_return TO 'your_app_user'@'localhost';
-- GRANT SELECT ON customer_document_history TO 'your_app_user'@'localhost';

-- Migration complete
-- Remember to create the uploads/document-receipts/ directory with proper write permissions

