<?php
/**
 * Debug script to compare Residence Report vs Ledger calculations
 * 
 * Usage: Place this file in your backend API folder and access via:
 * http://your-api-domain/debug-residence-calculations.php?customerID=573&currencyID=1
 */

header('Content-Type: text/html; charset=utf-8');

// Include your database connection
// require_once 'path/to/your/db-connection.php';
// For now, create a simple connection
$host = 'localhost';
$dbname = 'your_database';
$username = 'your_username';
$password = 'your_password';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Get parameters
$customerID = isset($_GET['customerID']) ? (int)$_GET['customerID'] : 573;
$currencyID = isset($_GET['currencyID']) ? (int)$_GET['currencyID'] : 1;

echo "<!DOCTYPE html>
<html>
<head>
    <title>Residence Calculation Debug</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; }
        .container { display: flex; gap: 20px; margin-top: 20px; }
        .panel { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1; }
        .panel h3 { margin-top: 0; color: #444; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .total-row { background: #e7f3ff; font-weight: bold; }
        .difference { background: #fff3cd; }
        .match { background: #d4edda; }
        .error { background: #f8d7da; }
        .info { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .query-box { background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; overflow-x: auto; }
        pre { margin: 0; white-space: pre-wrap; }
        .highlight { color: #d63384; font-weight: bold; }
    </style>
</head>
<body>
    <h1>🔍 Residence Calculation Debug Tool</h1>
    <div class='info'>
        <strong>Comparing calculations for:</strong><br>
        Customer ID: <span class='highlight'>$customerID</span> | 
        Currency ID: <span class='highlight'>$currencyID</span>
    </div>";

// ============================================================================
// QUERY 1: LEDGER QUERY (Backend calculation)
// ============================================================================
echo "<h2>📊 Query 1: Ledger Query (Backend)</h2>";
echo "<div class='panel'>";
echo "<h3>Used by: /residence/residence-ledger-report.php</h3>";

$ledgerQuery = "
    SELECT 
        r.residenceID,
        r.passenger_name as main_passenger,
        r.sale_price,
        COALESCE(SUM(rf.fine_amount), 0) as fine,
        COALESCE(r.cancellation_charges, 0) as cancellation_charges,
        COALESCE(
            CASE 
                WHEN r.tawjeehIncluded = 0 THEN r.tawjeeh_amount
                ELSE 0 
            END, 0
        ) as tawjeeh_charges,
        COALESCE(
            CASE 
                WHEN r.insuranceIncluded = 0 THEN r.insuranceAmount
                ELSE 0 
            END, 0
        ) as iloe_charges,
        COALESCE(SUM(cc.sale_price), 0) as custom_charges,
        COALESCE(SUM(rp.payment_amount), 0) as residencePayment,
        COALESCE(SUM(rfp.payment_amount), 0) as finePayment,
        COALESCE(SUM(tp.payment_amount), 0) as tawjeeh_payments,
        COALESCE(SUM(ip.payment_amount), 0) as iloe_payments
    FROM residence r
    LEFT JOIN residence_fines rf ON r.residenceID = rf.residenceID
    LEFT JOIN residence_payments rp ON r.residenceID = rp.residenceID AND rp.payment_type = 'residence'
    LEFT JOIN residence_payments rfp ON r.residenceID = rfp.residenceID AND rfp.payment_type = 'fine'
    LEFT JOIN residence_payments tp ON r.residenceID = tp.residenceID AND tp.payment_type = 'tawjeeh'
    LEFT JOIN residence_payments ip ON r.residenceID = ip.residenceID AND ip.payment_type = 'iloe'
    LEFT JOIN custom_charges cc ON r.residenceID = cc.residenceID
    WHERE r.customer_id = :customerID 
    AND r.saleCurID = :currencyID
    AND r.sale_price > 0
    GROUP BY r.residenceID
";

echo "<div class='query-box'><pre>" . htmlspecialchars($ledgerQuery) . "</pre></div>";

try {
    $stmt = $pdo->prepare($ledgerQuery);
    $stmt->execute(['customerID' => $customerID, 'currencyID' => $currencyID]);
    $ledgerRecords = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p><strong>Records found:</strong> " . count($ledgerRecords) . "</p>";
    
    // Calculate totals
    $ledgerTotals = [
        'totalCharges' => 0,
        'totalPaid' => 0,
        'outstandingBalance' => 0
    ];
    
    echo "<table>";
    echo "<tr>
            <th>ID</th>
            <th>Passenger</th>
            <th>Sale</th>
            <th>Fine</th>
            <th>Cancel</th>
            <th>Tawjeeh</th>
            <th>ILOE</th>
            <th>Custom</th>
            <th>Total Charges</th>
            <th>Paid</th>
            <th>Balance</th>
          </tr>";
    
    foreach ($ledgerRecords as $record) {
        $charges = $record['sale_price'] + $record['fine'] + $record['cancellation_charges'] + 
                   $record['tawjeeh_charges'] + $record['iloe_charges'] + $record['custom_charges'];
        $paid = $record['residencePayment'] + $record['finePayment'] + 
                $record['tawjeeh_payments'] + $record['iloe_payments'];
        $balance = $charges - $paid;
        
        $ledgerTotals['totalCharges'] += $charges;
        $ledgerTotals['totalPaid'] += $paid;
        $ledgerTotals['outstandingBalance'] += $balance;
        
        echo "<tr>
                <td>{$record['residenceID']}</td>
                <td>{$record['main_passenger']}</td>
                <td>" . number_format($record['sale_price'], 2) . "</td>
                <td>" . number_format($record['fine'], 2) . "</td>
                <td>" . number_format($record['cancellation_charges'], 2) . "</td>
                <td>" . number_format($record['tawjeeh_charges'], 2) . "</td>
                <td>" . number_format($record['iloe_charges'], 2) . "</td>
                <td>" . number_format($record['custom_charges'], 2) . "</td>
                <td><strong>" . number_format($charges, 2) . "</strong></td>
                <td>" . number_format($paid, 2) . "</td>
                <td><strong>" . number_format($balance, 2) . "</strong></td>
              </tr>";
    }
    
    echo "<tr class='total-row'>
            <td colspan='8'><strong>TOTALS</strong></td>
            <td><strong>" . number_format($ledgerTotals['totalCharges'], 2) . "</strong></td>
            <td><strong>" . number_format($ledgerTotals['totalPaid'], 2) . "</strong></td>
            <td><strong>" . number_format($ledgerTotals['outstandingBalance'], 2) . "</strong></td>
          </tr>";
    echo "</table>";
    
} catch (PDOException $e) {
    echo "<div class='error'>Error: " . $e->getMessage() . "</div>";
}

echo "</div>";

// ============================================================================
// QUERY 2: REPORT QUERY (Frontend calculation from list API)
// ============================================================================
echo "<h2>📋 Query 2: Report Query (Frontend)</h2>";
echo "<div class='panel'>";
echo "<h3>Used by: /residence/list.php</h3>";

$reportQuery = "
    SELECT 
        r.residenceID,
        r.passenger_name,
        r.sale_price,
        r.tawjeehIncluded,
        r.tawjeeh_amount,
        r.insuranceIncluded,
        r.insuranceAmount,
        r.iloe_fine,
        r.cancellation_charges,
        COALESCE(SUM(rf.fine_amount), 0) as total_Fine,
        COALESCE(SUM(rfp.payment_amount), 0) as totalFinePaid,
        COALESCE(SUM(cc.sale_price), 0) as custom_charges_total,
        COALESCE(rp_sum.total_paid, 0) as total_paid,
        COALESCE(tp_sum.tawjeeh_payments, 0) as tawjeeh_payments,
        COALESCE(ip_sum.iloe_payments, 0) as iloe_payments
    FROM residence r
    LEFT JOIN residence_fines rf ON r.residenceID = rf.residenceID
    LEFT JOIN residence_payments rfp ON r.residenceID = rfp.residenceID AND rfp.payment_type = 'fine'
    LEFT JOIN custom_charges cc ON r.residenceID = cc.residenceID
    LEFT JOIN (
        SELECT residenceID, SUM(payment_amount) as total_paid 
        FROM residence_payments 
        WHERE payment_type = 'residence'
        GROUP BY residenceID
    ) rp_sum ON r.residenceID = rp_sum.residenceID
    LEFT JOIN (
        SELECT residenceID, SUM(payment_amount) as tawjeeh_payments 
        FROM residence_payments 
        WHERE payment_type = 'tawjeeh'
        GROUP BY residenceID
    ) tp_sum ON r.residenceID = tp_sum.residenceID
    LEFT JOIN (
        SELECT residenceID, SUM(payment_amount) as iloe_payments 
        FROM residence_payments 
        WHERE payment_type = 'iloe'
        GROUP BY residenceID
    ) ip_sum ON r.residenceID = ip_sum.residenceID
    WHERE r.customer_id = :customerID 
    AND r.saleCurID = :currencyID
    AND r.sale_price > 0
    GROUP BY r.residenceID
";

echo "<div class='query-box'><pre>" . htmlspecialchars($reportQuery) . "</pre></div>";

try {
    $stmt = $pdo->prepare($reportQuery);
    $stmt->execute(['customerID' => $customerID, 'currencyID' => $currencyID]);
    $reportRecords = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p><strong>Records found:</strong> " . count($reportRecords) . "</p>";
    
    // Calculate totals using frontend logic
    $reportTotals = [
        'totalCharges' => 0,
        'totalPaid' => 0,
        'outstandingBalance' => 0
    ];
    
    echo "<table>";
    echo "<tr>
            <th>ID</th>
            <th>Passenger</th>
            <th>Sale</th>
            <th>Tawjeeh</th>
            <th>ILOE</th>
            <th>ILOE Fine</th>
            <th>E-Visa Fine</th>
            <th>Custom</th>
            <th>Total Charges</th>
            <th>Paid</th>
            <th>Balance</th>
          </tr>";
    
    foreach ($reportRecords as $record) {
        // Frontend calculation logic
        $tawjeehCharges = ($record['tawjeehIncluded'] == 0 && $record['tawjeeh_amount']) 
            ? $record['tawjeeh_amount'] : 0;
        $iloeCharges = ($record['insuranceIncluded'] == 0 && $record['insuranceAmount']) 
            ? $record['insuranceAmount'] : 0;
        
        $charges = $record['sale_price'] + $tawjeehCharges + $iloeCharges + 
                   $record['iloe_fine'] + $record['total_Fine'] + 
                   $record['custom_charges_total'] + $record['cancellation_charges'];
        
        $paid = $record['total_paid'] + $record['totalFinePaid'] + 
                $record['tawjeeh_payments'] + $record['iloe_payments'];
        
        $balance = $charges - $paid;
        
        $reportTotals['totalCharges'] += $charges;
        $reportTotals['totalPaid'] += $paid;
        $reportTotals['outstandingBalance'] += $balance;
        
        echo "<tr>
                <td>{$record['residenceID']}</td>
                <td>{$record['passenger_name']}</td>
                <td>" . number_format($record['sale_price'], 2) . "</td>
                <td>" . number_format($tawjeehCharges, 2) . "</td>
                <td>" . number_format($iloeCharges, 2) . "</td>
                <td>" . number_format($record['iloe_fine'], 2) . "</td>
                <td>" . number_format($record['total_Fine'], 2) . "</td>
                <td>" . number_format($record['custom_charges_total'], 2) . "</td>
                <td><strong>" . number_format($charges, 2) . "</strong></td>
                <td>" . number_format($paid, 2) . "</td>
                <td><strong>" . number_format($balance, 2) . "</strong></td>
              </tr>";
    }
    
    echo "<tr class='total-row'>
            <td colspan='8'><strong>TOTALS</strong></td>
            <td><strong>" . number_format($reportTotals['totalCharges'], 2) . "</strong></td>
            <td><strong>" . number_format($reportTotals['totalPaid'], 2) . "</strong></td>
            <td><strong>" . number_format($reportTotals['outstandingBalance'], 2) . "</strong></td>
          </tr>";
    echo "</table>";
    
} catch (PDOException $e) {
    echo "<div class='error'>Error: " . $e->getMessage() . "</div>";
}

echo "</div>";

// ============================================================================
// COMPARISON
// ============================================================================
echo "<h2>⚖️ Comparison</h2>";
echo "<div class='panel'>";

$chargesDiff = abs($ledgerTotals['totalCharges'] - $reportTotals['totalCharges']);
$paidDiff = abs($ledgerTotals['totalPaid'] - $reportTotals['totalPaid']);
$balanceDiff = abs($ledgerTotals['outstandingBalance'] - $reportTotals['outstandingBalance']);

$chargesMatch = $chargesDiff < 0.01;
$paidMatch = $paidDiff < 0.01;
$balanceMatch = $balanceDiff < 0.01;

echo "<table>";
echo "<tr>
        <th>Metric</th>
        <th>Ledger</th>
        <th>Report</th>
        <th>Difference</th>
        <th>Status</th>
      </tr>";

echo "<tr class='" . ($chargesMatch ? 'match' : 'difference') . "'>
        <td><strong>Total Charges</strong></td>
        <td>" . number_format($ledgerTotals['totalCharges'], 2) . "</td>
        <td>" . number_format($reportTotals['totalCharges'], 2) . "</td>
        <td>" . number_format($chargesDiff, 2) . "</td>
        <td>" . ($chargesMatch ? '✅ Match' : '❌ Different') . "</td>
      </tr>";

echo "<tr class='" . ($paidMatch ? 'match' : 'difference') . "'>
        <td><strong>Total Paid</strong></td>
        <td>" . number_format($ledgerTotals['totalPaid'], 2) . "</td>
        <td>" . number_format($reportTotals['totalPaid'], 2) . "</td>
        <td>" . number_format($paidDiff, 2) . "</td>
        <td>" . ($paidMatch ? '✅ Match' : '❌ Different') . "</td>
      </tr>";

echo "<tr class='" . ($balanceMatch ? 'match' : 'difference') . "'>
        <td><strong>Outstanding Balance</strong></td>
        <td>" . number_format($ledgerTotals['outstandingBalance'], 2) . "</td>
        <td>" . number_format($reportTotals['outstandingBalance'], 2) . "</td>
        <td>" . number_format($balanceDiff, 2) . "</td>
        <td>" . ($balanceMatch ? '✅ Match' : '❌ Different') . "</td>
      </tr>";

echo "</table>";

if (!$chargesMatch || !$paidMatch || !$balanceMatch) {
    echo "<div class='error' style='margin-top: 20px; padding: 15px;'>";
    echo "<strong>⚠️ Discrepancies Found!</strong><br><br>";
    echo "Possible causes:<br>";
    echo "<ul>";
    echo "<li>Different aggregation logic (SUM vs individual calculations)</li>";
    echo "<li>Missing JOIN conditions</li>";
    echo "<li>Tawjeeh/ILOE charge calculation differences</li>";
    echo "<li>Payment type filtering differences</li>";
    echo "<li>NULL handling differences (COALESCE vs ||)</li>";
    echo "</ul>";
    echo "</div>";
} else {
    echo "<div class='match' style='margin-top: 20px; padding: 15px;'>";
    echo "<strong>✅ All Calculations Match!</strong>";
    echo "</div>";
}

echo "</div>";

echo "</body></html>";
?>

