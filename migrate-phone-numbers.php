<?php
/**
 * Phone Number Migration Script
 * Converts all existing phone numbers to API standard format (971XXXXXXXXX)
 * 
 * IMPORTANT: Run this script ONCE to migrate existing data
 * Backup your database before running this script!
 */

header('Content-Type: text/html; charset=utf-8');

// Include the connection file - it will automatically detect local vs production
// Place this file in the same directory as connection.php or adjust the path
$connectionPath = __DIR__ . '/../connection.php';

if (!file_exists($connectionPath)) {
    die("<h2>❌ Error: connection.php not found at: $connectionPath</h2>");
}

require_once $connectionPath;

if (!isset($pdo) || $pdo === null) {
    die("<h2>❌ Database Connection Failed: PDO object not available</h2>");
}

echo "<h2>✅ Database Connected Successfully</h2>";

/**
 * Format phone number to API standard
 * @param string $phone - Input phone number
 * @return string - Formatted phone number or original if invalid
 */
function formatPhoneNumber($phone) {
    if (empty($phone)) return $phone;
    
    // Remove all non-numeric characters
    $cleaned = preg_replace('/\D/', '', $phone);
    
    if (empty($cleaned)) return $phone;
    
    // Handle different formats
    
    // If starts with 00, remove it (international format)
    if (substr($cleaned, 0, 2) === '00') {
        $cleaned = substr($cleaned, 2);
    }
    
    // If starts with 0 and length suggests local number (e.g., 0501234567)
    if (substr($cleaned, 0, 1) === '0' && strlen($cleaned) >= 10 && strlen($cleaned) <= 11) {
        // Remove leading 0 and add UAE country code
        $cleaned = '971' . substr($cleaned, 1);
    }
    
    // If it doesn't start with a country code, add 971 (UAE)
    if (!preg_match('/^(971|966|965|973|968|974)/', $cleaned)) {
        // If number is 9 digits (UAE local format), add country code
        if (strlen($cleaned) === 9) {
            $cleaned = '971' . $cleaned;
        }
    }
    
    // Validate final format (should be 11-13 digits)
    if (preg_match('/^\d{11,13}$/', $cleaned) && preg_match('/^(971|966|965|973|968|974)/', $cleaned)) {
        return $cleaned;
    }
    
    // Return original if we couldn't format it
    return $phone;
}

echo "<h1>📱 Phone Number Migration Tool</h1>";
echo "<p>This script will convert all phone numbers to the standard format: 971XXXXXXXXX</p>";
echo "<hr>";

// Tables and columns to update
$tables = [
    'customer' => 'customer_phone',
    'staff' => 'staff_phone',
    // Add more tables as needed
    // 'supplier' => 'supp_phone',
    // 'establishments_persons' => 'phone',
];

// Auto-fix schema: Check and convert INT columns to VARCHAR(20)
echo "<h2>🔧 Checking Schema...</h2>";
foreach ($tables as $table => $column) {
    try {
        $tableExists = $pdo->query("SHOW TABLES LIKE '$table'")->fetch();
        if (!$tableExists) {
            continue;
        }
        
        $columnInfo = $pdo->query("SHOW COLUMNS FROM $table LIKE '$column'")->fetch(PDO::FETCH_ASSOC);
        if (!$columnInfo) {
            continue;
        }
        
        $currentType = strtolower($columnInfo['Type']);
        
        // If it's INT or numeric type, convert to VARCHAR
        if (strpos($currentType, 'int') !== false || strpos($currentType, 'bigint') !== false) {
            echo "<p>🔄 Converting <strong>$table.$column</strong> from <code>$currentType</code> to <code>VARCHAR(20)</code>...</p>";
            
            $nullable = $columnInfo['Null'] === 'YES' ? 'NULL' : 'NOT NULL';
            $default = $columnInfo['Default'] !== null ? "DEFAULT '" . $columnInfo['Default'] . "'" : '';
            
            $sql = "ALTER TABLE $table MODIFY COLUMN $column VARCHAR(20) $nullable $default";
            $pdo->exec($sql);
            
            echo "<p style='color: green;'>✅ Successfully converted!</p>";
        } else {
            echo "<p style='color: gray;'>✓ <strong>$table.$column</strong> is already VARCHAR - OK</p>";
        }
    } catch(PDOException $e) {
        echo "<p style='color: red;'>❌ Error fixing $table.$column: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
}
echo "<hr>";

$totalUpdated = 0;
$totalSkipped = 0;
$totalErrors = 0;

foreach ($tables as $table => $column) {
    echo "<h3>🔄 Processing table: <strong>$table</strong></h3>";
    
    try {
        // Get all records with phone numbers
        $stmt = $pdo->prepare("SELECT * FROM $table WHERE $column IS NOT NULL AND $column != ''");
        $stmt->execute();
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<p>Found " . count($records) . " records with phone numbers</p>";
        
        $updated = 0;
        $skipped = 0;
        
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse; margin: 10px 0;'>";
        echo "<tr><th>ID</th><th>Original</th><th>Formatted</th><th>Status</th></tr>";
        
        foreach ($records as $record) {
            // Get primary key (assume it's the first column or common names)
            $idColumn = array_keys($record)[0]; // First column is usually the ID
            $id = $record[$idColumn];
            $originalPhone = $record[$column];
            $formattedPhone = formatPhoneNumber($originalPhone);
            
            if ($originalPhone !== $formattedPhone) {
                // Update the record
                $updateStmt = $pdo->prepare("UPDATE $table SET $column = ? WHERE $idColumn = ?");
                if ($updateStmt->execute([$formattedPhone, $id])) {
                    echo "<tr>";
                    echo "<td>$id</td>";
                    echo "<td>$originalPhone</td>";
                    echo "<td><strong>$formattedPhone</strong></td>";
                    echo "<td style='color: green;'>✅ Updated</td>";
                    echo "</tr>";
                    $updated++;
                } else {
                    echo "<tr>";
                    echo "<td>$id</td>";
                    echo "<td>$originalPhone</td>";
                    echo "<td>$formattedPhone</td>";
                    echo "<td style='color: red;'>❌ Error</td>";
                    echo "</tr>";
                    $totalErrors++;
                }
            } else {
                echo "<tr>";
                echo "<td>$id</td>";
                echo "<td colspan='2'>$originalPhone</td>";
                echo "<td style='color: gray;'>⏭️ Skipped (already correct)</td>";
                echo "</tr>";
                $skipped++;
            }
        }
        
        echo "</table>";
        echo "<p><strong>Updated:</strong> $updated | <strong>Skipped:</strong> $skipped</p>";
        
        $totalUpdated += $updated;
        $totalSkipped += $skipped;
        
    } catch(PDOException $e) {
        echo "<p style='color: red;'>❌ Error processing table $table: " . $e->getMessage() . "</p>";
        $totalErrors++;
    }
    
    echo "<hr>";
}

echo "<h2>📊 Migration Summary</h2>";
echo "<ul>";
echo "<li><strong style='color: green;'>Total Updated:</strong> $totalUpdated</li>";
echo "<li><strong style='color: gray;'>Total Skipped:</strong> $totalSkipped</li>";
echo "<li><strong style='color: red;'>Total Errors:</strong> $totalErrors</li>";
echo "</ul>";

echo "<h3 style='color: orange;'>⚠️ Important Notes:</h3>";
echo "<ul>";
echo "<li>Review the changes above to ensure they look correct</li>";
echo "<li>If everything looks good, the migration is complete!</li>";
echo "<li>You can now delete this script for security reasons</li>";
echo "<li>All new phone numbers entered through the app will automatically be formatted correctly</li>";
echo "</ul>";

?>

