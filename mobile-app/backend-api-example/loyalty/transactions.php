<?php
/**
 * Loyalty Card Transactions API Endpoint
 * 
 * This file handles loyalty card transaction operations:
 * - GET: Retrieve transaction history for a card
 * - POST: Add a new transaction (earn/redeem points)
 * 
 * Expected endpoints:
 * GET /api/loyalty/transactions.php?cardId={id}
 * POST /api/loyalty/transactions.php (with action=add)
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
        // Get transactions for a card
        $cardId = $_GET['cardId'] ?? null;
        
        if (!$cardId) {
            throw new Exception('Card ID is required');
        }
        
        $stmt = $db->prepare("
            SELECT 
                transaction_id,
                card_id,
                points,
                type,
                description,
                created_at
            FROM loyalty_transactions
            WHERE card_id = ?
            ORDER BY created_at DESC
            LIMIT 100
        ");
        $stmt->execute([$cardId]);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => array_map(function($t) {
                return [
                    'transaction_id' => (int)$t['transaction_id'],
                    'card_id' => (int)$t['card_id'],
                    'points' => (int)$t['points'],
                    'type' => $t['type'],
                    'description' => $t['description'],
                    'created_at' => $t['created_at']
                ];
            }, $transactions)
        ]);
        
    } elseif ($method === 'POST' && $action === 'add') {
        // Add transaction and update card points
        $cardId = $_POST['card_id'] ?? null;
        $points = $_POST['points'] ?? null;
        $type = $_POST['type'] ?? null;
        $description = $_POST['description'] ?? '';
        
        if (!$cardId || $points === null || !$type) {
            throw new Exception('Card ID, points, and type are required');
        }
        
        if (!in_array($type, ['earned', 'redeemed'])) {
            throw new Exception('Invalid transaction type');
        }
        
        // Start transaction
        $db->beginTransaction();
        
        try {
            // Insert transaction
            $stmt = $db->prepare("
                INSERT INTO loyalty_transactions (card_id, points, type, description)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$cardId, $points, $type, $description]);
            
            // Update card points
            if ($type === 'earned') {
                $updateStmt = $db->prepare("
                    UPDATE loyalty_cards 
                    SET points = points + ?, updated_at = NOW()
                    WHERE card_id = ?
                ");
            } else {
                // For redeemed, subtract points
                $updateStmt = $db->prepare("
                    UPDATE loyalty_cards 
                    SET points = GREATEST(0, points - ?), updated_at = NOW()
                    WHERE card_id = ?
                ");
            }
            $updateStmt->execute([abs($points), $cardId]);
            
            $db->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Transaction recorded successfully'
            ]);
            
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
        
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


