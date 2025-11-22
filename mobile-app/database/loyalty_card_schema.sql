-- Loyalty Card Database Schema
-- Run this SQL script in your database to create the loyalty card tables

-- Create loyalty_cards table
CREATE TABLE IF NOT EXISTS loyalty_cards (
  card_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  card_number VARCHAR(50) UNIQUE NOT NULL,
  points INT DEFAULT 0,
  tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
  INDEX idx_customer_id (customer_id),
  INDEX idx_card_number (card_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  transaction_id INT AUTO_INCREMENT PRIMARY KEY,
  card_id INT NOT NULL,
  points INT NOT NULL,
  type ENUM('earned', 'redeemed') NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES loyalty_cards(card_id) ON DELETE CASCADE,
  INDEX idx_card_id (card_id),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Function to generate unique card number
DELIMITER //
CREATE FUNCTION IF NOT EXISTS generate_card_number() RETURNS VARCHAR(50)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE new_card_number VARCHAR(50);
  DECLARE card_exists INT DEFAULT 1;
  
  WHILE card_exists > 0 DO
    SET new_card_number = CONCAT('SNT', LPAD(FLOOR(RAND() * 9999999999), 10, '0'));
    SELECT COUNT(*) INTO card_exists FROM loyalty_cards WHERE card_number = new_card_number;
  END WHILE;
  
  RETURN new_card_number;
END//
DELIMITER ;

-- Trigger to update tier based on points
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_loyalty_tier
BEFORE UPDATE ON loyalty_cards
FOR EACH ROW
BEGIN
  IF NEW.points >= 10000 THEN
    SET NEW.tier = 'platinum';
  ELSEIF NEW.points >= 5000 THEN
    SET NEW.tier = 'gold';
  ELSEIF NEW.points >= 2000 THEN
    SET NEW.tier = 'silver';
  ELSE
    SET NEW.tier = 'bronze';
  END IF;
END//
DELIMITER ;

-- Sample PHP API endpoint structure (for reference)
-- You'll need to create these endpoints in your backend:

-- GET /api/loyalty/card.php
-- POST /api/loyalty/card.php (action=create)
-- GET /api/loyalty/transactions.php
-- POST /api/loyalty/transactions.php (action=add)

