<?php
/**
 * Loyalty Card API Endpoint
 * 
 * This file handles loyalty card operations:
 * - GET: Retrieve customer's loyalty card
 * - POST: Create a new loyalty card
 * 
 * Expected endpoints:
 * GET /api/loyalty/card.php?customerId={id}
 * POST /api/loyalty/card.php (with action=create)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../config/auth.php';

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_POST['action'] ?? '';

try {
    $db = getDatabaseConnection();
    
    if ($method === 'GET') {
        // Get loyalty card for customer
        $customerId = $_GET['customerId'] ?? null;
        
        if (!$customerId) {
            throw new Exception('Customer ID is required');
        }
        
        $stmt = $db->prepare("
            SELECT 
                lc.*,
                c.customer_name
            FROM loyalty_cards lc
            LEFT JOIN customers c ON lc.customer_id = c.customer_id
            WHERE lc.customer_id = ?
        ");
        $stmt->execute([$customerId]);
        $card = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($card) {
            echo json_encode([
                'success' => true,
                'data' => [
                    'card_id' => (int)$card['card_id'],
                    'customer_id' => (int)$card['customer_id'],
                    'card_number' => $card['card_number'],
                    'points' => (int)$card['points'],
                    'tier' => $card['tier'],
                    'created_at' => $card['created_at'],
                    'updated_at' => $card['updated_at'],
                    'customer_name' => $card['customer_name']
                ]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'No loyalty card found for this customer'
            ]);
        }
        
    } elseif ($method === 'POST' && $action === 'create') {
        // Create new loyalty card
        $customerId = $_POST['customer_id'] ?? null;
        
        if (!$customerId) {
            throw new Exception('Customer ID is required');
        }
        
        // Check if card already exists
        $checkStmt = $db->prepare("SELECT card_id FROM loyalty_cards WHERE customer_id = ?");
        $checkStmt->execute([$customerId]);
        if ($checkStmt->fetch()) {
            throw new Exception('Loyalty card already exists for this customer');
        }
        
        // Generate unique card number
        $cardNumber = 'SNT' . str_pad(rand(0, 9999999999), 10, '0', STR_PAD_LEFT);
        
        // Verify uniqueness
        $uniqueCheck = $db->prepare("SELECT card_id FROM loyalty_cards WHERE card_number = ?");
        $uniqueCheck->execute([$cardNumber]);
        while ($uniqueCheck->fetch()) {
            $cardNumber = 'SNT' . str_pad(rand(0, 9999999999), 10, '0', STR_PAD_LEFT);
            $uniqueCheck->execute([$cardNumber]);
        }
        
        // Insert new card
        $stmt = $db->prepare("
            INSERT INTO loyalty_cards (customer_id, card_number, points, tier)
            VALUES (?, ?, 0, 'bronze')
        ");
        $stmt->execute([$customerId, $cardNumber]);
        
        $cardId = $db->lastInsertId();
        
        // Fetch created card
        $fetchStmt = $db->prepare("
            SELECT 
                lc.*,
                c.customer_name
            FROM loyalty_cards lc
            LEFT JOIN customers c ON lc.customer_id = c.customer_id
            WHERE lc.card_id = ?
        ");
        $fetchStmt->execute([$cardId]);
        $card = $fetchStmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Loyalty card created successfully',
            'data' => [
                'card_id' => (int)$card['card_id'],
                'customer_id' => (int)$card['customer_id'],
                'card_number' => $card['card_number'],
                'points' => (int)$card['points'],
                'tier' => $card['tier'],
                'created_at' => $card['created_at'],
                'updated_at' => $card['updated_at'],
                'customer_name' => $card['customer_name']
            ]
        ]);
        
    } else {
        throw new Exception('Invalid request method or action');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>


