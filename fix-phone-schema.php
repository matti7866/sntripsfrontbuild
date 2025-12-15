<?php
/**
 * Schema Fix for Phone Number Columns
 * This script updates phone number columns from INT to VARCHAR(20)
 * Run this BEFORE running the phone number migration
 */

header('Content-Type: text/html; charset=utf-8');

// Include the connection file
$connectionPath = __DIR__ . '/../connection.php';

if (!file_exists($connectionPath)) {
    die("<h2>❌ Error: connection.php not found at: $connectionPath</h2>");
}

require_once $connectionPath;

if (!isset($pdo) || $pdo === null) {
    die("<h2>❌ Database Connection Failed: PDO object not available</h2>");
}

echo "<h1>🔧 Phone Column Schema Fix</h1>";
echo "<p>This script will update phone columns from INT to VARCHAR(20)</p>";
echo "<hr>";

// Tables and columns to check/fix
$phoneColumns = [
    'staff' => 'staff_phone',
    'supplier' => 'supp_phone',
    'establishments_persons' => 'phone',
];

$totalFixed = 0;
$totalSkipped = 0;
$totalErrors = 0;

foreach ($phoneColumns as $table => $column) {
    echo "<h3>🔍 Checking table: <strong>$table</strong>, column: <strong>$column</strong></h3>";
    
    try {
        // Check if table exists
        $tableExists = $pdo->query("SHOW TABLES LIKE '$table'")->fetch();
        
        if (!$tableExists) {
            echo "<p style='color: orange;'>⚠️ Table '$table' does not exist - skipping</p>";
            $totalSkipped++;
            echo "<hr>";
            continue;
        }
        
        // Check column type
        $columnInfo = $pdo->query("SHOW COLUMNS FROM $table LIKE '$column'")->fetch(PDO::FETCH_ASSOC);
        
        if (!$columnInfo) {
            echo "<p style='color: orange;'>⚠️ Column '$column' does not exist in table '$table' - skipping</p>";
            $totalSkipped++;
            echo "<hr>";
            continue;
        }
        
        $currentType = strtolower($columnInfo['Type']);
        echo "<p><strong>Current type:</strong> <code>$currentType</code></p>";
        
        // Check if it's already VARCHAR
        if (strpos($currentType, 'varchar') !== false) {
            echo "<p style='color: green;'>✅ Already VARCHAR - no changes needed</p>";
            $totalSkipped++;
        } else {
            // Need to convert
            echo "<p style='color: blue;'>🔄 Converting to VARCHAR(20)...</p>";
            
            $nullable = $columnInfo['Null'] === 'YES' ? 'NULL' : 'NOT NULL';
            $default = '';
            if ($columnInfo['Default'] !== null) {
                $default = "DEFAULT '" . $columnInfo['Default'] . "'";
            }
            
            $sql = "ALTER TABLE $table MODIFY COLUMN $column VARCHAR(20) $nullable $default";
            
            $pdo->exec($sql);
            
            // Verify the change
            $newColumnInfo = $pdo->query("SHOW COLUMNS FROM $table LIKE '$column'")->fetch(PDO::FETCH_ASSOC);
            $newType = $newColumnInfo['Type'];
            
            echo "<p style='color: green;'>✅ Successfully converted to: <code>$newType</code></p>";
            $totalFixed++;
        }
        
    } catch(PDOException $e) {
        echo "<p style='color: red;'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
        $totalErrors++;
    }
    
    echo "<hr>";
}

echo "<h2>📊 Schema Fix Summary</h2>";
echo "<ul>";
echo "<li><strong style='color: green;'>Columns Fixed:</strong> $totalFixed</li>";
echo "<li><strong style='color: gray;'>Already Correct:</strong> $totalSkipped</li>";
echo "<li><strong style='color: red;'>Errors:</strong> $totalErrors</li>";
echo "</ul>";

if ($totalFixed > 0 && $totalErrors === 0) {
    echo "<h3 style='color: green;'>✅ Schema fix completed successfully!</h3>";
    echo "<p>You can now run <code>migrate-phone-numbers.php</code> to update the phone numbers.</p>";
} else if ($totalErrors > 0) {
    echo "<h3 style='color: red;'>⚠️ Some errors occurred. Please review and fix before continuing.</h3>";
} else {
    echo "<h3 style='color: green;'>✅ All columns are already in the correct format!</h3>";
    echo "<p>You can proceed with running <code>migrate-phone-numbers.php</code>.</p>";
}

echo "<hr>";
echo "<h3 style='color: orange;'>⚠️ Important:</h3>";
echo "<ul>";
echo "<li>After running this script successfully, run <code>migrate-phone-numbers.php</code></li>";
echo "<li>You can delete both scripts after the migration is complete</li>";
echo "</ul>";

?>


