<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../jwt_helper.php';
$jwtHelper = new JWTHelper();
$jwtHelper->validateRequest();

// Database connection
require_once '../db.php';

// Get the action from request
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_POST['action'] ?? null;

if (!$action) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Action is required']);
    exit;
}

// Handle different actions
switch ($action) {
    case 'getReceipts':
        getReceipts($conn, $input);
        break;
    case 'getReceipt':
        getReceipt($conn, $input);
        break;
    case 'createReceipt':
        createReceipt($conn, $_POST, $_FILES);
        break;
    case 'updateReceipt':
        updateReceipt($conn, $_POST, $_FILES);
        break;
    case 'deleteReceipt':
        deleteReceipt($conn, $input);
        break;
    case 'getStats':
        getStats($conn);
        break;
    case 'getDocumentTypeOptions':
        getDocumentTypeOptions($conn);
        break;
    case 'addDocumentTypeOption':
        addDocumentTypeOption($conn, $input);
        break;
    case 'deleteAttachment':
        deleteAttachment($conn, $input);
        break;
    case 'getAvailableForReturn':
        getAvailableForReturn($conn, $input);
        break;
    case 'getReceiptForPrint':
        getReceiptForPrint($conn, $input);
        break;
    case 'getCustomers':
        getCustomers($conn);
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

/**
 * Get all document receipts with filters
 */
function getReceipts($conn, $input) {
    $search = $input['search'] ?? '';
    $transactionType = $input['transaction_type'] ?? null;
    $status = $input['status'] ?? null;
    $fromDate = $input['from_date'] ?? null;
    $toDate = $input['to_date'] ?? null;
    $page = intval($input['page'] ?? 1);
    $limit = intval($input['limit'] ?? 50);
    $offset = ($page - 1) * $limit;

    // Build WHERE clause
    $whereClauses = [];
    $params = [];
    $types = '';

    if (!empty($search)) {
        $whereClauses[] = "(dr.customer_name LIKE ? OR dr.receipt_number LIKE ? OR dr.customer_phone LIKE ? OR dr.customer_email LIKE ?)";
        $searchParam = "%$search%";
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
        $types .= 'ssss';
    }

    if ($transactionType) {
        $whereClauses[] = "dr.transaction_type = ?";
        $params[] = $transactionType;
        $types .= 's';
    }

    if ($status) {
        $whereClauses[] = "dr.status = ?";
        $params[] = $status;
        $types .= 's';
    }

    if ($fromDate) {
        $whereClauses[] = "DATE(dr.transaction_date) >= ?";
        $params[] = $fromDate;
        $types .= 's';
    }

    if ($toDate) {
        $whereClauses[] = "DATE(dr.transaction_date) <= ?";
        $params[] = $toDate;
        $types .= 's';
    }

    $whereSQL = !empty($whereClauses) ? 'WHERE ' . implode(' AND ', $whereClauses) : '';

    // Count total records
    $countSQL = "SELECT COUNT(*) as total FROM document_receipts dr $whereSQL";
    $countStmt = $conn->prepare($countSQL);
    if (!empty($params)) {
        $countStmt->bind_param($types, ...$params);
    }
    $countStmt->execute();
    $total = $countStmt->get_result()->fetch_assoc()['total'];
    $countStmt->close();

    // Get receipts
    $sql = "SELECT 
                dr.*,
                s1.staff_name as received_by_name,
                s2.staff_name as returned_by_name
            FROM document_receipts dr
            LEFT JOIN staff s1 ON dr.received_by_id = s1.id
            LEFT JOIN staff s2 ON dr.returned_by_id = s2.id
            $whereSQL
            ORDER BY dr.created_at DESC
            LIMIT ? OFFSET ?";

    $stmt = $conn->prepare($sql);
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $receipts = [];
    while ($row = $result->fetch_assoc()) {
        // Get document types for this receipt
        $docTypesSQL = "SELECT * FROM document_receipt_items WHERE receipt_id = ?";
        $docStmt = $conn->prepare($docTypesSQL);
        $docStmt->bind_param('i', $row['id']);
        $docStmt->execute();
        $docResult = $docStmt->get_result();
        
        $documentTypes = [];
        while ($docRow = $docResult->fetch_assoc()) {
            $documentTypes[] = [
                'id' => (int)$docRow['id'],
                'document_type_name' => $docRow['document_type_name'],
                'quantity' => (int)$docRow['quantity'],
                'description' => $docRow['description']
            ];
        }
        $docStmt->close();

        // Get attachments
        $attSQL = "SELECT * FROM document_receipt_attachments WHERE receipt_id = ?";
        $attStmt = $conn->prepare($attSQL);
        $attStmt->bind_param('i', $row['id']);
        $attStmt->execute();
        $attResult = $attStmt->get_result();
        
        $attachments = [];
        while ($attRow = $attResult->fetch_assoc()) {
            $attachments[] = [
                'id' => (int)$attRow['id'],
                'file_name' => $attRow['file_name'],
                'file_path' => $attRow['file_path'],
                'file_type' => $attRow['file_type'],
                'file_size' => (int)$attRow['file_size']
            ];
        }
        $attStmt->close();

        $receipts[] = [
            'id' => (int)$row['id'],
            'receipt_number' => $row['receipt_number'],
            'customer_name' => $row['customer_name'],
            'customer_phone' => $row['customer_phone'],
            'customer_email' => $row['customer_email'],
            'transaction_type' => $row['transaction_type'],
            'transaction_date' => $row['transaction_date'],
            'label' => $row['label'],
            'notes' => $row['notes'],
            'status' => $row['status'],
            'received_by' => $row['received_by_name'],
            'received_by_id' => $row['received_by_id'] ? (int)$row['received_by_id'] : null,
            'returned_by' => $row['returned_by_name'],
            'returned_by_id' => $row['returned_by_id'] ? (int)$row['returned_by_id'] : null,
            'original_receipt_id' => $row['original_receipt_id'] ? (int)$row['original_receipt_id'] : null,
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'document_types' => $documentTypes,
            'attachments' => $attachments
        ];
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'data' => $receipts,
        'pagination' => [
            'total' => (int)$total,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => ceil($total / $limit)
        ]
    ]);
}

/**
 * Get a single document receipt
 */
function getReceipt($conn, $input) {
    $id = intval($input['id'] ?? 0);
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Receipt ID is required']);
        return;
    }

    $sql = "SELECT 
                dr.*,
                s1.staff_name as received_by_name,
                s2.staff_name as returned_by_name
            FROM document_receipts dr
            LEFT JOIN staff s1 ON dr.received_by_id = s1.id
            LEFT JOIN staff s2 ON dr.returned_by_id = s2.id
            WHERE dr.id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Receipt not found']);
        $stmt->close();
        return;
    }

    $row = $result->fetch_assoc();
    $stmt->close();

    // Get document types
    $docTypesSQL = "SELECT * FROM document_receipt_items WHERE receipt_id = ?";
    $docStmt = $conn->prepare($docTypesSQL);
    $docStmt->bind_param('i', $id);
    $docStmt->execute();
    $docResult = $docStmt->get_result();
    
    $documentTypes = [];
    while ($docRow = $docResult->fetch_assoc()) {
        $documentTypes[] = [
            'id' => (int)$docRow['id'],
            'document_type_name' => $docRow['document_type_name'],
            'quantity' => (int)$docRow['quantity'],
            'description' => $docRow['description']
        ];
    }
    $docStmt->close();

    // Get attachments
    $attSQL = "SELECT * FROM document_receipt_attachments WHERE receipt_id = ?";
    $attStmt = $conn->prepare($attSQL);
    $attStmt->bind_param('i', $id);
    $attStmt->execute();
    $attResult = $attStmt->get_result();
    
    $attachments = [];
    while ($attRow = $attResult->fetch_assoc()) {
        $attachments[] = [
            'id' => (int)$attRow['id'],
            'file_name' => $attRow['file_name'],
            'file_path' => $attRow['file_path'],
            'file_type' => $attRow['file_type'],
            'file_size' => (int)$attRow['file_size'],
            'uploaded_at' => $attRow['uploaded_at']
        ];
    }
    $attStmt->close();

    $receipt = [
        'id' => (int)$row['id'],
        'receipt_number' => $row['receipt_number'],
        'customer_name' => $row['customer_name'],
        'customer_phone' => $row['customer_phone'],
        'customer_email' => $row['customer_email'],
        'transaction_type' => $row['transaction_type'],
        'transaction_date' => $row['transaction_date'],
        'label' => $row['label'],
        'notes' => $row['notes'],
        'status' => $row['status'],
        'received_by' => $row['received_by_name'],
        'received_by_id' => $row['received_by_id'] ? (int)$row['received_by_id'] : null,
        'returned_by' => $row['returned_by_name'],
        'returned_by_id' => $row['returned_by_id'] ? (int)$row['returned_by_id'] : null,
        'original_receipt_id' => $row['original_receipt_id'] ? (int)$row['original_receipt_id'] : null,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'document_types' => $documentTypes,
        'attachments' => $attachments
    ];

    echo json_encode(['success' => true, 'data' => $receipt]);
}

/**
 * Create a new document receipt
 */
function createReceipt($conn, $post, $files) {
    global $jwtHelper;
    $userData = $jwtHelper->getPayload();
    $staffId = $userData['id'] ?? null;

    $customerName = trim($post['customer_name'] ?? '');
    $customerPhone = trim($post['customer_phone'] ?? '');
    $customerEmail = trim($post['customer_email'] ?? '');
    $transactionType = $post['transaction_type'] ?? '';
    $transactionDate = $post['transaction_date'] ?? date('Y-m-d H:i:s');
    $label = trim($post['label'] ?? '');
    $notes = trim($post['notes'] ?? '');
    $originalReceiptId = !empty($post['original_receipt_id']) ? intval($post['original_receipt_id']) : null;
    $documentTypes = json_decode($post['document_types'] ?? '[]', true);

    // Validation
    if (empty($customerName)) {
        echo json_encode(['success' => false, 'message' => 'Customer name is required']);
        return;
    }

    if (!in_array($transactionType, ['received', 'returned'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid transaction type']);
        return;
    }

    if (empty($documentTypes) || !is_array($documentTypes)) {
        echo json_encode(['success' => false, 'message' => 'At least one document type is required']);
        return;
    }

    // Generate receipt number
    $prefix = $transactionType === 'received' ? 'RCV' : 'RET';
    $year = date('Y');
    $month = date('m');
    
    $countSQL = "SELECT COUNT(*) as count FROM document_receipts WHERE receipt_number LIKE ?";
    $countStmt = $conn->prepare($countSQL);
    $likePattern = "$prefix-$year$month-%";
    $countStmt->bind_param('s', $likePattern);
    $countStmt->execute();
    $count = $countStmt->get_result()->fetch_assoc()['count'];
    $countStmt->close();
    
    $receiptNumber = sprintf("%s-%s%s-%04d", $prefix, $year, $month, $count + 1);

    // Determine status
    $status = $transactionType === 'received' ? 'with_company' : 'with_customer';

    // Start transaction
    $conn->begin_transaction();

    try {
        // Insert receipt
        $sql = "INSERT INTO document_receipts 
                (receipt_number, customer_name, customer_phone, customer_email, 
                 transaction_type, transaction_date, label, notes, status, 
                 received_by_id, returned_by_id, original_receipt_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        $receivedById = $transactionType === 'received' ? $staffId : null;
        $returnedById = $transactionType === 'returned' ? $staffId : null;
        
        $stmt->bind_param(
            'ssssssssssii',
            $receiptNumber,
            $customerName,
            $customerPhone,
            $customerEmail,
            $transactionType,
            $transactionDate,
            $label,
            $notes,
            $status,
            $receivedById,
            $returnedById,
            $originalReceiptId
        );
        
        $stmt->execute();
        $receiptId = $conn->insert_id;
        $stmt->close();

        // Insert document types
        $docSQL = "INSERT INTO document_receipt_items 
                   (receipt_id, document_type_name, quantity, description) 
                   VALUES (?, ?, ?, ?)";
        $docStmt = $conn->prepare($docSQL);
        
        foreach ($documentTypes as $docType) {
            $typeName = trim($docType['document_type_name'] ?? '');
            $quantity = intval($docType['quantity'] ?? 1);
            $description = trim($docType['description'] ?? '');
            
            if (!empty($typeName) && $quantity > 0) {
                $docStmt->bind_param('isis', $receiptId, $typeName, $quantity, $description);
                $docStmt->execute();
            }
        }
        $docStmt->close();

        // Handle file uploads
        if (!empty($files['attachments']['name'][0])) {
            $uploadDir = '../uploads/document-receipts/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $attSQL = "INSERT INTO document_receipt_attachments 
                       (receipt_id, file_name, file_path, file_type, file_size) 
                       VALUES (?, ?, ?, ?, ?)";
            $attStmt = $conn->prepare($attSQL);

            $fileCount = count($files['attachments']['name']);
            for ($i = 0; $i < $fileCount; $i++) {
                if ($files['attachments']['error'][$i] === UPLOAD_ERR_OK) {
                    $fileName = basename($files['attachments']['name'][$i]);
                    $fileSize = $files['attachments']['size'][$i];
                    $fileType = $files['attachments']['type'][$i];
                    $fileExt = pathinfo($fileName, PATHINFO_EXTENSION);
                    
                    $newFileName = uniqid() . '_' . time() . '.' . $fileExt;
                    $filePath = $uploadDir . $newFileName;
                    
                    if (move_uploaded_file($files['attachments']['tmp_name'][$i], $filePath)) {
                        $attStmt->bind_param('isssi', $receiptId, $fileName, $filePath, $fileType, $fileSize);
                        $attStmt->execute();
                    }
                }
            }
            $attStmt->close();
        }

        // If this is a return, update the original receipt status
        if ($transactionType === 'returned' && $originalReceiptId) {
            $updateSQL = "UPDATE document_receipts SET status = 'with_customer' WHERE id = ?";
            $updateStmt = $conn->prepare($updateSQL);
            $updateStmt->bind_param('i', $originalReceiptId);
            $updateStmt->execute();
            $updateStmt->close();
        }

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Document receipt created successfully',
            'receipt_id' => $receiptId,
            'receipt_number' => $receiptNumber
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create receipt: ' . $e->getMessage()]);
    }
}

/**
 * Update a document receipt
 */
function updateReceipt($conn, $post, $files) {
    $id = intval($post['id'] ?? 0);
    
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'Receipt ID is required']);
        return;
    }

    // Check if receipt exists
    $checkSQL = "SELECT id FROM document_receipts WHERE id = ?";
    $checkStmt = $conn->prepare($checkSQL);
    $checkStmt->bind_param('i', $id);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Receipt not found']);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    $conn->begin_transaction();

    try {
        // Update basic info
        $updates = [];
        $params = [];
        $types = '';

        if (isset($post['customer_name'])) {
            $updates[] = "customer_name = ?";
            $params[] = trim($post['customer_name']);
            $types .= 's';
        }
        if (isset($post['customer_phone'])) {
            $updates[] = "customer_phone = ?";
            $params[] = trim($post['customer_phone']);
            $types .= 's';
        }
        if (isset($post['customer_email'])) {
            $updates[] = "customer_email = ?";
            $params[] = trim($post['customer_email']);
            $types .= 's';
        }
        if (isset($post['label'])) {
            $updates[] = "label = ?";
            $params[] = trim($post['label']);
            $types .= 's';
        }
        if (isset($post['notes'])) {
            $updates[] = "notes = ?";
            $params[] = trim($post['notes']);
            $types .= 's';
        }

        if (!empty($updates)) {
            $sql = "UPDATE document_receipts SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
            $params[] = $id;
            $types .= 'i';
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $stmt->close();
        }

        // Update document types if provided
        if (isset($post['document_types'])) {
            $documentTypes = json_decode($post['document_types'], true);
            
            // Delete existing document types
            $delSQL = "DELETE FROM document_receipt_items WHERE receipt_id = ?";
            $delStmt = $conn->prepare($delSQL);
            $delStmt->bind_param('i', $id);
            $delStmt->execute();
            $delStmt->close();

            // Insert new document types
            $docSQL = "INSERT INTO document_receipt_items 
                       (receipt_id, document_type_name, quantity, description) 
                       VALUES (?, ?, ?, ?)";
            $docStmt = $conn->prepare($docSQL);
            
            foreach ($documentTypes as $docType) {
                $typeName = trim($docType['document_type_name'] ?? '');
                $quantity = intval($docType['quantity'] ?? 1);
                $description = trim($docType['description'] ?? '');
                
                if (!empty($typeName) && $quantity > 0) {
                    $docStmt->bind_param('isis', $id, $typeName, $quantity, $description);
                    $docStmt->execute();
                }
            }
            $docStmt->close();
        }

        // Handle new file uploads
        if (!empty($files['attachments']['name'][0])) {
            $uploadDir = '../uploads/document-receipts/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $attSQL = "INSERT INTO document_receipt_attachments 
                       (receipt_id, file_name, file_path, file_type, file_size) 
                       VALUES (?, ?, ?, ?, ?)";
            $attStmt = $conn->prepare($attSQL);

            $fileCount = count($files['attachments']['name']);
            for ($i = 0; $i < $fileCount; $i++) {
                if ($files['attachments']['error'][$i] === UPLOAD_ERR_OK) {
                    $fileName = basename($files['attachments']['name'][$i]);
                    $fileSize = $files['attachments']['size'][$i];
                    $fileType = $files['attachments']['type'][$i];
                    $fileExt = pathinfo($fileName, PATHINFO_EXTENSION);
                    
                    $newFileName = uniqid() . '_' . time() . '.' . $fileExt;
                    $filePath = $uploadDir . $newFileName;
                    
                    if (move_uploaded_file($files['attachments']['tmp_name'][$i], $filePath)) {
                        $attStmt->bind_param('isssi', $id, $fileName, $filePath, $fileType, $fileSize);
                        $attStmt->execute();
                    }
                }
            }
            $attStmt->close();
        }

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Document receipt updated successfully'
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update receipt: ' . $e->getMessage()]);
    }
}

/**
 * Delete a document receipt
 */
function deleteReceipt($conn, $input) {
    $id = intval($input['id'] ?? 0);
    
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'Receipt ID is required']);
        return;
    }

    $conn->begin_transaction();

    try {
        // Get attachments to delete files
        $attSQL = "SELECT file_path FROM document_receipt_attachments WHERE receipt_id = ?";
        $attStmt = $conn->prepare($attSQL);
        $attStmt->bind_param('i', $id);
        $attStmt->execute();
        $attResult = $attStmt->get_result();
        
        $filesToDelete = [];
        while ($attRow = $attResult->fetch_assoc()) {
            $filesToDelete[] = $attRow['file_path'];
        }
        $attStmt->close();

        // Delete attachments records
        $delAttSQL = "DELETE FROM document_receipt_attachments WHERE receipt_id = ?";
        $delAttStmt = $conn->prepare($delAttSQL);
        $delAttStmt->bind_param('i', $id);
        $delAttStmt->execute();
        $delAttStmt->close();

        // Delete document items
        $delItemsSQL = "DELETE FROM document_receipt_items WHERE receipt_id = ?";
        $delItemsStmt = $conn->prepare($delItemsSQL);
        $delItemsStmt->bind_param('i', $id);
        $delItemsStmt->execute();
        $delItemsStmt->close();

        // Delete receipt
        $delReceiptSQL = "DELETE FROM document_receipts WHERE id = ?";
        $delReceiptStmt = $conn->prepare($delReceiptSQL);
        $delReceiptStmt->bind_param('i', $id);
        $delReceiptStmt->execute();
        $delReceiptStmt->close();

        $conn->commit();

        // Delete physical files
        foreach ($filesToDelete as $filePath) {
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Document receipt deleted successfully'
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete receipt: ' . $e->getMessage()]);
    }
}

/**
 * Get statistics
 */
function getStats($conn) {
    $sql = "SELECT 
                COUNT(*) as total_receipts,
                SUM(CASE WHEN transaction_type = 'received' THEN 1 ELSE 0 END) as total_received,
                SUM(CASE WHEN transaction_type = 'returned' THEN 1 ELSE 0 END) as total_returned,
                SUM(CASE WHEN status = 'with_company' THEN 1 ELSE 0 END) as currently_with_company,
                SUM(CASE WHEN status = 'with_customer' THEN 1 ELSE 0 END) as currently_with_customer
            FROM document_receipts";
    
    $result = $conn->query($sql);
    $stats = $result->fetch_assoc();

    echo json_encode([
        'success' => true,
        'data' => [
            'total_received' => (int)$stats['total_received'],
            'total_returned' => (int)$stats['total_returned'],
            'currently_with_company' => (int)$stats['currently_with_company'],
            'currently_with_customer' => (int)$stats['currently_with_customer']
        ]
    ]);
}

/**
 * Get document type options
 */
function getDocumentTypeOptions($conn) {
    $sql = "SELECT * FROM document_type_options WHERE is_active = 1 ORDER BY type_name ASC";
    $result = $conn->query($sql);

    $options = [];
    while ($row = $result->fetch_assoc()) {
        $options[] = [
            'id' => (int)$row['id'],
            'type_name' => $row['type_name'],
            'is_active' => (bool)$row['is_active'],
            'created_at' => $row['created_at']
        ];
    }

    echo json_encode(['success' => true, 'data' => $options]);
}

/**
 * Add document type option
 */
function addDocumentTypeOption($conn, $input) {
    $typeName = trim($input['type_name'] ?? '');
    
    if (empty($typeName)) {
        echo json_encode(['success' => false, 'message' => 'Document type name is required']);
        return;
    }

    // Check if already exists
    $checkSQL = "SELECT id FROM document_type_options WHERE type_name = ?";
    $checkStmt = $conn->prepare($checkSQL);
    $checkStmt->bind_param('s', $typeName);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Document type already exists']);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    $sql = "INSERT INTO document_type_options (type_name) VALUES (?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $typeName);
    $stmt->execute();
    $typeId = $conn->insert_id;
    $stmt->close();

    echo json_encode([
        'success' => true,
        'message' => 'Document type added successfully',
        'type_id' => $typeId
    ]);
}

/**
 * Delete an attachment
 */
function deleteAttachment($conn, $input) {
    $attachmentId = intval($input['attachment_id'] ?? 0);
    
    if (!$attachmentId) {
        echo json_encode(['success' => false, 'message' => 'Attachment ID is required']);
        return;
    }

    // Get file path
    $sql = "SELECT file_path FROM document_receipt_attachments WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $attachmentId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Attachment not found']);
        $stmt->close();
        return;
    }

    $filePath = $result->fetch_assoc()['file_path'];
    $stmt->close();

    // Delete from database
    $delSQL = "DELETE FROM document_receipt_attachments WHERE id = ?";
    $delStmt = $conn->prepare($delSQL);
    $delStmt->bind_param('i', $attachmentId);
    $delStmt->execute();
    $delStmt->close();

    // Delete physical file
    if (file_exists($filePath)) {
        unlink($filePath);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Attachment deleted successfully'
    ]);
}

/**
 * Get receipts available for return (currently with company)
 */
function getAvailableForReturn($conn, $input) {
    $customerName = $input['customer_name'] ?? null;

    $sql = "SELECT 
                dr.*,
                s.staff_name as received_by_name
            FROM document_receipts dr
            LEFT JOIN staff s ON dr.received_by_id = s.id
            WHERE dr.status = 'with_company' 
            AND dr.transaction_type = 'received'";
    
    $params = [];
    $types = '';
    
    if ($customerName) {
        $sql .= " AND dr.customer_name LIKE ?";
        $params[] = "%$customerName%";
        $types = 's';
    }
    
    $sql .= " ORDER BY dr.created_at DESC";

    $stmt = $conn->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $receipts = [];
    while ($row = $result->fetch_assoc()) {
        // Get document types
        $docTypesSQL = "SELECT * FROM document_receipt_items WHERE receipt_id = ?";
        $docStmt = $conn->prepare($docTypesSQL);
        $docStmt->bind_param('i', $row['id']);
        $docStmt->execute();
        $docResult = $docStmt->get_result();
        
        $documentTypes = [];
        while ($docRow = $docResult->fetch_assoc()) {
            $documentTypes[] = [
                'id' => (int)$docRow['id'],
                'document_type_name' => $docRow['document_type_name'],
                'quantity' => (int)$docRow['quantity'],
                'description' => $docRow['description']
            ];
        }
        $docStmt->close();

        $receipts[] = [
            'id' => (int)$row['id'],
            'receipt_number' => $row['receipt_number'],
            'customer_name' => $row['customer_name'],
            'customer_phone' => $row['customer_phone'],
            'customer_email' => $row['customer_email'],
            'transaction_date' => $row['transaction_date'],
            'label' => $row['label'],
            'received_by' => $row['received_by_name'],
            'document_types' => $documentTypes
        ];
    }
    $stmt->close();

    echo json_encode(['success' => true, 'data' => $receipts]);
}

/**
 * Get receipt for printing
 */
function getReceiptForPrint($conn, $input) {
    // For now, just call getReceipt
    // In future, you can add company info here
    getReceipt($conn, $input);
}

/**
 * Get customers for dropdown
 */
function getCustomers($conn) {
    $sql = "SELECT customer_id, customer_name, customer_phone, customer_email 
            FROM customer 
            WHERE status = 1 
            ORDER BY customer_name ASC 
            LIMIT 500";
    
    $result = $conn->query($sql);
    
    $customers = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $customers[] = [
                'customer_id' => (int)$row['customer_id'],
                'customer_name' => $row['customer_name'],
                'customer_phone' => $row['customer_phone'],
                'customer_email' => $row['customer_email']
            ];
        }
    }
    
    echo json_encode(['success' => true, 'data' => $customers]);
}

$conn->close();
?>

