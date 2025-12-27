<?php
/**
 * Direct API Test Script
 * Access: http://localhost/test-api-direct.php
 * This tests the document receipts API directly
 */

header('Content-Type: text/html; charset=utf-8');

echo "<html><head><title>API Direct Test</title>";
echo "<style>
body { font-family: Arial; padding: 20px; background: #f5f5f5; }
.test { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
.success { border-left-color: #28a745; background: #d4edda; }
.error { border-left-color: #dc3545; background: #f8d7da; }
h2 { color: #333; }
pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow: auto; }
</style></head><body>";

echo "<h1>Document Receipts API - Direct Test</h1>";

// Include database connection
require_once 'db.php';

// Test 1: Check if database is connected
echo "<div class='test'>";
echo "<h2>Test 1: Database Connection</h2>";
if ($conn) {
    echo "<p class='success'>✅ Database connected successfully</p>";
    echo "<pre>Server: " . $conn->server_info . "</pre>";
} else {
    echo "<p class='error'>❌ Database connection failed</p>";
    die();
}
echo "</div>";

// Test 2: Check if tables exist
echo "<div class='test'>";
echo "<h2>Test 2: Check Tables</h2>";
$tables = ['document_receipts', 'document_receipt_items', 'document_receipt_attachments', 'document_type_options'];
$allTablesExist = true;
foreach ($tables as $table) {
    $result = $conn->query("SHOW TABLES LIKE '$table'");
    if ($result && $result->num_rows > 0) {
        echo "<p class='success'>✅ Table '$table' exists</p>";
    } else {
        echo "<p class='error'>❌ Table '$table' NOT FOUND</p>";
        $allTablesExist = false;
    }
}
if (!$allTablesExist) {
    echo "<p class='error'><strong>⚠️ Some tables are missing! Run: database/FIX_document_receipts_tables.sql</strong></p>";
}
echo "</div>";

// Test 3: Check document_type_options
echo "<div class='test'>";
echo "<h2>Test 3: Document Type Options</h2>";
$result = $conn->query("SELECT COUNT(*) as cnt FROM document_type_options");
if ($result) {
    $row = $result->fetch_assoc();
    if ($row['cnt'] > 0) {
        echo "<p class='success'>✅ Found " . $row['cnt'] . " document types</p>";
        
        // Show sample types
        $sampleResult = $conn->query("SELECT id, type_name, is_active FROM document_type_options LIMIT 5");
        echo "<pre>";
        while ($sampleRow = $sampleResult->fetch_assoc()) {
            echo "ID: " . $sampleRow['id'] . " | Name: " . $sampleRow['type_name'] . " | Active: " . $sampleRow['is_active'] . "\n";
        }
        echo "</pre>";
    } else {
        echo "<p class='error'>❌ No document types found! Table is empty.</p>";
        echo "<p>Run INSERT statements from FIX_document_receipts_tables.sql</p>";
    }
} else {
    echo "<p class='error'>❌ Error querying document_type_options: " . $conn->error . "</p>";
}
echo "</div>";

// Test 4: Try to add a document type
echo "<div class='test'>";
echo "<h2>Test 4: Add Document Type (TEST)</h2>";
$testTypeName = "TEST_TYPE_" . time();
$stmt = $conn->prepare("INSERT INTO document_type_options (type_name) VALUES (?)");
if ($stmt) {
    $stmt->bind_param('s', $testTypeName);
    if ($stmt->execute()) {
        $insertId = $conn->insert_id;
        echo "<p class='success'>✅ Successfully added document type: '$testTypeName' (ID: $insertId)</p>";
        
        // Clean up
        $conn->query("DELETE FROM document_type_options WHERE id = $insertId");
        echo "<p>Test type cleaned up.</p>";
    } else {
        echo "<p class='error'>❌ Failed to insert: " . $stmt->error . "</p>";
    }
    $stmt->close();
} else {
    echo "<p class='error'>❌ Failed to prepare statement: " . $conn->error . "</p>";
}
echo "</div>";

// Test 5: Check customer table
echo "<div class='test'>";
echo "<h2>Test 5: Customer Table</h2>";
$result = $conn->query("SELECT COUNT(*) as cnt FROM customer WHERE is_active = 1");
if ($result) {
    $row = $result->fetch_assoc();
    echo "<p class='success'>✅ Found " . $row['cnt'] . " active customers</p>";
    
    if ($row['cnt'] > 0) {
        // Show sample customers
        $sampleResult = $conn->query("SELECT customer_id, customer_name, customer_phone FROM customer WHERE is_active = 1 LIMIT 5");
        echo "<pre>";
        while ($sampleRow = $sampleResult->fetch_assoc()) {
            echo "ID: " . $sampleRow['customer_id'] . " | Name: " . $sampleRow['customer_name'] . " | Phone: " . ($sampleRow['customer_phone'] ?? 'N/A') . "\n";
        }
        echo "</pre>";
    } else {
        echo "<p class='error'>⚠️ No active customers found.</p>";
    }
} else {
    echo "<p class='error'>❌ Customer table doesn't exist or error: " . $conn->error . "</p>";
}
echo "</div>";

// Test 6: Test the actual API endpoint
echo "<div class='test'>";
echo "<h2>Test 6: API Endpoint Test</h2>";
echo "<p>Testing: /documents/document-receipts.php</p>";

// Simulate API call
$_POST['action'] = 'getDocumentTypeOptions';
ob_start();
include 'documents/document-receipts.php';
$apiResponse = ob_get_clean();

echo "<p><strong>API Response:</strong></p>";
echo "<pre>" . htmlspecialchars($apiResponse) . "</pre>";

$decoded = json_decode($apiResponse, true);
if ($decoded && isset($decoded['success']) && $decoded['success']) {
    echo "<p class='success'>✅ API endpoint working correctly</p>";
} else {
    echo "<p class='error'>❌ API endpoint returned error or invalid response</p>";
}
echo "</div>";

// Test 7: File permissions
echo "<div class='test'>";
echo "<h2>Test 7: Upload Directory</h2>";
$uploadDir = 'uploads/document-receipts/';
if (!is_dir($uploadDir)) {
    echo "<p class='error'>❌ Upload directory doesn't exist: $uploadDir</p>";
    echo "<p>Run: mkdir -p $uploadDir && chmod 777 $uploadDir</p>";
} else {
    echo "<p class='success'>✅ Upload directory exists</p>";
    if (is_writable($uploadDir)) {
        echo "<p class='success'>✅ Upload directory is writable</p>";
    } else {
        echo "<p class='error'>❌ Upload directory is NOT writable</p>";
        echo "<p>Run: chmod 777 $uploadDir</p>";
    }
}
echo "</div>";

// Summary
echo "<div class='test'>";
echo "<h2>Summary</h2>";
echo "<p>If all tests pass ✅, the system should work correctly.</p>";
echo "<p>If any tests fail ❌, follow the instructions above to fix them.</p>";
echo "<p><strong>Next Steps:</strong></p>";
echo "<ul>";
echo "<li>If tables missing: Run database/FIX_document_receipts_tables.sql</li>";
echo "<li>If no document types: Run INSERT statements from fix script</li>";
echo "<li>If upload dir missing: Create it with proper permissions</li>";
echo "<li>Then refresh your React app and try again</li>";
echo "</ul>";
echo "</div>";

$conn->close();
echo "</body></html>";
?>


