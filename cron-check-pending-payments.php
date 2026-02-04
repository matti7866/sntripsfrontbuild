    <?php
/**
 * Cron Job: Check Pending Payments for Approved Labour Cards
 * 
 * This script checks for residence records in step 1a (approved labour cards)
 * that have pending payments in the same company.
 * 
 * Matching Strategy:
 * 1. MB Number: Fuzzy matching (±1, ±2, ±3 digits from the end)
 * 2. Transaction Number: Exact match
 * 3. Passenger Name: Partial match (handles Arabic/English name variations)
 * 
 * Run this script via cron (every 15 minutes):
 * crontab -e
 * Then add: 0,15,30,45 * * * * /usr/bin/php /path/to/cron-check-pending-payments.php >> /path/to/logs/pending-payments.log 2>&1
 */

// Load PHPMailer via vendor autoload
if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
    require_once __DIR__ . '/../../vendor/autoload.php';
} else if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require_once __DIR__ . '/../vendor/autoload.php';
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Email configuration
define('ALERT_EMAIL', 'selabnadirydxb@gmail.com'); // Alerts will be sent to this email
define('FROM_EMAIL', 'selabnadirydxb@gmail.com'); // Gmail account
define('FROM_NAME', 'SN Travels System Alert');

// Gmail SMTP Configuration
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'selabnadirydxb@gmail.com');
define('SMTP_PASS', 'zdwefhpewgyqmdkl'); // Gmail App Password (same as used in gmail-api.php)

    // API configuration
    define('PENDING_PAYMENTS_API', 'https://api.sntrips.com/trx/pendingPayments.php');

// Logging
$logFile = __DIR__ . '/logs/pending-payments-' . date('Y-m-d') . '.log';

// Email tracking file (to prevent duplicate emails)
$emailTrackingFile = __DIR__ . '/../../logs/email-sent-tracking.json';

/**
 * Check if email was already sent for this residence
 */
function wasEmailAlreadySent($residenceID) {
    global $emailTrackingFile;
    
    if (!file_exists($emailTrackingFile)) {
        return false;
    }
    
    $tracking = json_decode(file_get_contents($emailTrackingFile), true);
    if (!$tracking) {
        return false;
    }
    
    // Check if this residence ID exists in tracking
    if (isset($tracking[$residenceID])) {
        // Email was sent - check if it's still valid (within 30 days)
        $sentDate = strtotime($tracking[$residenceID]['sent_at']);
        $now = time();
        $daysSince = ($now - $sentDate) / (60 * 60 * 24);
        
        if ($daysSince < 30) {
            return true; // Email was sent recently, don't send again
        }
    }
    
    return false;
}

/**
 * Mark email as sent for this residence
 */
function markEmailAsSent($residenceID, $passengerName, $mbNumber) {
    global $emailTrackingFile;
    
    // Create directory if it doesn't exist
    $dir = dirname($emailTrackingFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    // Load existing tracking data
    $tracking = [];
    if (file_exists($emailTrackingFile)) {
        $tracking = json_decode(file_get_contents($emailTrackingFile), true) ?: [];
    }
    
    // Add this residence to tracking
    $tracking[$residenceID] = [
        'passenger_name' => $passengerName,
        'mb_number' => $mbNumber,
        'sent_at' => date('Y-m-d H:i:s'),
        'timestamp' => time()
    ];
    
    // Clean up old entries (older than 30 days)
    $cutoff = time() - (30 * 24 * 60 * 60);
    foreach ($tracking as $id => $data) {
        if (isset($data['timestamp']) && $data['timestamp'] < $cutoff) {
            unset($tracking[$id]);
        }
    }
    
    // Save tracking data
    file_put_contents($emailTrackingFile, json_encode($tracking, JSON_PRETTY_PRINT));
}

/**
 * Log message to file and console
 */
function logMessage($message, $level = 'INFO') {
        global $logFile;
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[{$timestamp}] [{$level}] {$message}\n";
        
        // Create logs directory if it doesn't exist
        $logDir = dirname($logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        // Write to file
        file_put_contents($logFile, $logEntry, FILE_APPEND);
        
        // Also output to console
        echo $logEntry;
    }

    /**
     * Generate MB number variations (±1, ±2, ±3)
     */
    function generateMBVariations($mbNumber) {
        if (empty($mbNumber)) {
            return [];
        }
        
        $variations = [$mbNumber]; // Include original
        
        // Extract the numeric part at the end
        if (preg_match('/^(.*?)(\d+)([A-Z]*)$/i', $mbNumber, $matches)) {
            $prefix = $matches[1];
            $number = intval($matches[2]);
            $suffix = $matches[3];
            
            // Generate variations: -3, -2, -1, +1, +2, +3
            for ($i = -3; $i <= 3; $i++) {
                if ($i == 0) continue; // Skip original
                $newNumber = $number + $i;
                if ($newNumber > 0) { // Ensure positive number
                    // Pad with zeros to match original length
                    $paddedNumber = str_pad($newNumber, strlen($matches[2]), '0', STR_PAD_LEFT);
                    $variations[] = $prefix . $paddedNumber . $suffix;
                }
            }
        }
        
        return array_unique($variations);
    }

    /**
     * Normalize name for comparison (remove special chars, extra spaces)
     */
    function normalizeName($name) {
        // Convert to lowercase
        $name = mb_strtolower($name, 'UTF-8');
        
        // Remove special characters, keep only alphanumeric and spaces
        $name = preg_replace('/[^a-z0-9\s\p{Arabic}]/ui', ' ', $name);
        
        // Remove extra spaces
        $name = preg_replace('/\s+/', ' ', $name);
        
        return trim($name);
    }

    /**
     * Check if two names match (fuzzy matching)
     */
    function namesMatch($name1, $name2, $threshold = 0.6) {
        $normalized1 = normalizeName($name1);
        $normalized2 = normalizeName($name2);
        
        // Exact match
        if ($normalized1 === $normalized2) {
            return true;
        }
        
        // Check if one name contains the other (partial match)
        if (strpos($normalized1, $normalized2) !== false || strpos($normalized2, $normalized1) !== false) {
            return true;
        }
        
        // Use Levenshtein distance for similarity (only for non-Arabic names)
        // For Arabic names, we rely on partial matching above
        if (!preg_match('/\p{Arabic}/u', $normalized1) && !preg_match('/\p{Arabic}/u', $normalized2)) {
            $maxLen = max(strlen($normalized1), strlen($normalized2));
            if ($maxLen > 0) {
                $distance = levenshtein($normalized1, $normalized2);
                $similarity = 1 - ($distance / $maxLen);
                if ($similarity >= $threshold) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Fetch pending payments for a company
     */
    function fetchPendingPayments($companyNumber) {
        $url = PENDING_PAYMENTS_API . '?companyCode=' . urlencode($companyNumber);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            logMessage("cURL Error fetching pending payments for company {$companyNumber}: {$error}", 'ERROR');
            return null;
        }
        
        if ($httpCode !== 200) {
            logMessage("HTTP Error {$httpCode} fetching pending payments for company {$companyNumber}", 'ERROR');
            return null;
        }
        
    $data = json_decode($response, true);
    
    if (!$data || $data['status'] !== 'success') {
        $errorMsg = isset($data['message']) ? $data['message'] : 'Unknown error';
        logMessage("API Error for company {$companyNumber}: {$errorMsg}", 'WARNING');
        return null;
    }
    
    return $data['data']['payments'] ?? [];
    }

    /**
     * Find matching pending payment for a residence record
     */
    function findMatchingPayment($residence, $pendingPayments) {
        if (empty($pendingPayments)) {
            return null;
        }
        
        $mbVariations = generateMBVariations($residence['mb_number']);
        $matches = [];
        
        foreach ($pendingPayments as $payment) {
            $matchReasons = [];
            $matchScore = 0;
            
            // Check MB number variations in transaction_number (where MB number is actually stored)
            if (!empty($residence['mb_number']) && !empty($payment['transaction_number'])) {
                foreach ($mbVariations as $mbVariation) {
                    if (stripos($payment['transaction_number'], $mbVariation) !== false) {
                        $matchReasons[] = 'MB Number variation match';
                        $matchScore += 3;
                        break;
                    }
                }
            }
            
            // Also check pay_card_number as fallback
            if (!empty($residence['mb_number']) && !empty($payment['pay_card_number'])) {
                foreach ($mbVariations as $mbVariation) {
                    if (stripos($payment['pay_card_number'], $mbVariation) !== false) {
                        $matchReasons[] = 'MB Number in pay card match';
                        $matchScore += 3;
                        break;
                    }
                }
            }
            
            // Check transaction number
            if (!empty($residence['transaction_number']) && !empty($payment['transaction_number'])) {
                if (stripos($payment['transaction_number'], $residence['transaction_number']) !== false ||
                    stripos($residence['transaction_number'], $payment['transaction_number']) !== false) {
                    $matchReasons[] = 'Transaction number match';
                    $matchScore += 5;
                }
            }
            
            // Check card number
            if (!empty($residence['LabourCardNumber']) && !empty($payment['card_number'])) {
                if (stripos($payment['card_number'], $residence['LabourCardNumber']) !== false ||
                    stripos($residence['LabourCardNumber'], $payment['card_number']) !== false) {
                    $matchReasons[] = 'Labour card number match';
                    $matchScore += 4;
                }
            }
            
            // Check passenger name (handles Arabic/English)
            if (!empty($residence['passenger_name']) && !empty($payment['person_name'])) {
                if (namesMatch($residence['passenger_name'], $payment['person_name'])) {
                    $matchReasons[] = 'Passenger name match';
                    $matchScore += 2;
                }
            }
            
            // If we have at least one match, consider it
            if ($matchScore > 0) {
                $matches[] = [
                    'payment' => $payment,
                    'score' => $matchScore,
                    'reasons' => $matchReasons
                ];
            }
        }
        
        // Sort by score and return the best match
        if (!empty($matches)) {
            usort($matches, function($a, $b) {
                return $b['score'] - $a['score'];
            });
            return $matches[0]; // Return best match
        }
        
        return null;
    }

/**
 * Send email via PHPMailer (EXACT same code as send-otp.php)
 */
function sendSMTPEmail($to, $subject, $message) {
    $mail = new PHPMailer(true);
    
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'selabnadirydxb@gmail.com';
        $mail->Password = 'zdwefhpewgyqmdkl';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        
        // Add timeout settings to prevent hanging
        $mail->Timeout = 30;
        $mail->SMTPKeepAlive = true;
        
        // Disable SSL verification if server has certificate issues
        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );
        
        $mail->setFrom('selabnadirydxb@gmail.com', FROM_NAME);
        $mail->addAddress($to);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $message;
        
        $mail->send();
        return true;
    } catch (Exception $e) {
        logMessage("PHPMailer Error: " . $mail->ErrorInfo, 'ERROR');
        return false;
    }
}

/**
 * Send email alert
 */
function sendEmailAlert($residence, $matchInfo, $pendingPaymentsCount) {
        $to = ALERT_EMAIL;
        $subject = "LABOUR APPROVED - " . strtoupper($residence['passenger_name']);
        
        $message = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                .header { background-color: #dc3545; color: white; padding: 15px; border-radius: 5px; }
                .content { background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; }
                .info-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                .info-table th { background-color: #007bff; color: white; padding: 10px; text-align: left; }
                .info-table td { padding: 10px; border-bottom: 1px solid #ddd; }
                .info-table tr:nth-child(even) { background-color: #f2f2f2; }
                .match-reasons { background-color: #28a745; color: white; padding: 10px; border-radius: 5px; margin: 10px 0; }
                .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>⚠️ Labour Card Approved - Pending Payment Alert</h2>
                </div>
                
                <div class='content'>
                    <p>A labour card has been approved (Step 1a) but there is a matching pending payment for the same company.</p>
                    
                    <h3>Residence Information</h3>
                    <table class='info-table'>
                        <tr><th>Field</th><th>Value</th></tr>
                        <tr><td><strong>Residence ID</strong></td><td>{$residence['residenceID']}</td></tr>
                        <tr><td><strong>Passenger Name</strong></td><td>{$residence['passenger_name']}</td></tr>
                        <tr><td><strong>Company Name</strong></td><td>{$residence['company_name']}</td></tr>
                        <tr><td><strong>Company Number</strong></td><td>{$residence['company_number']}</td></tr>
                        <tr><td><strong>MB Number</strong></td><td>{$residence['mb_number']}</td></tr>
                        <tr><td><strong>Labour Card Number</strong></td><td>{$residence['LabourCardNumber']}</td></tr>
                        <tr><td><strong>Passport Number</strong></td><td>{$residence['passportNumber']}</td></tr>
                        <tr><td><strong>Customer</strong></td><td>{$residence['customer_name']}</td></tr>
                        <tr><td><strong>Date Created</strong></td><td>{$residence['datetime']}</td></tr>
                    </table>
                    
                    <h3>Matching Pending Payment</h3>
                    <table class='info-table'>
                        <tr><th>Field</th><th>Value</th></tr>
                        <tr><td><strong>Transaction Number</strong></td><td>{$matchInfo['payment']['transaction_number']}</td></tr>
                        <tr><td><strong>Person Name</strong></td><td>{$matchInfo['payment']['person_name']}</td></tr>
                        <tr><td><strong>Pay Card Number</strong></td><td>{$matchInfo['payment']['pay_card_number']}</td></tr>
                        <tr><td><strong>Card Number</strong></td><td>{$matchInfo['payment']['card_number']}</td></tr>
                        <tr><td><strong>Card Expiry Date</strong></td><td>{$matchInfo['payment']['card_expiry_date']}</td></tr>
                    </table>
                    
                    <div class='match-reasons'>
                        <strong>Match Reasons (Score: {$matchInfo['score']}):</strong>
                        <ul>
                            " . implode('', array_map(function($reason) { return "<li>{$reason}</li>"; }, $matchInfo['reasons'])) . "
                        </ul>
                    </div>
                    
                    <p><strong>Total Pending Payments for this Company:</strong> {$pendingPaymentsCount}</p>
                    
                    <h3>Recommended Actions:</h3>
                    <ol>
                        <li>Verify if this is the same person</li>
                        <li>Check if the payment should be processed</li>
                        <li>Update the labour card status accordingly</li>
                        <li>Contact the customer if needed</li>
                    </ol>
                    
                    <p><strong>View in System:</strong> <a href='http://127.0.0.1:5174/residence/tasks?step=1a'>Residence Tasks - Step 1a</a></p>
                </div>
                
                <div class='footer'>
                    <p>This is an automated alert from the SN Travels system.</p>
                    <p>Generated at: " . date('Y-m-d H:i:s') . "</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
    // Try SMTP first
    $result = sendSMTPEmail($to, $subject, $message);
    
    if ($result) {
        logMessage("Email alert sent successfully via SMTP for Residence ID {$residence['residenceID']}", 'SUCCESS');
    } else {
        logMessage("SMTP failed, trying PHP mail() for Residence ID {$residence['residenceID']}", 'WARNING');
        
        // Fallback to PHP mail()
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= "From: " . FROM_NAME . " <" . FROM_EMAIL . ">\r\n";
        $headers .= "Reply-To: " . FROM_EMAIL . "\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();
        
        $result = mail($to, $subject, $message, $headers);
        
        if ($result) {
            logMessage("Email alert sent successfully via PHP mail() for Residence ID {$residence['residenceID']}", 'SUCCESS');
        } else {
            logMessage("Failed to send email alert for Residence ID {$residence['residenceID']}", 'ERROR');
            
            // Save email to file when both methods fail
            $emailFile = __DIR__ . '/../../logs/email-alert-' . $residence['residenceID'] . '-' . date('Y-m-d-His') . '.html';
            $emailDir = dirname($emailFile);
            if (!is_dir($emailDir)) {
                mkdir($emailDir, 0755, true);
            }
            file_put_contents($emailFile, $message);
            logMessage("Email content saved to file: {$emailFile}", 'INFO');
        }
    }
    
    return $result;
    }

    /**
     * Main execution
     */
    function main() {
        logMessage("=== Starting Pending Payments Check ===");
        
        // Include the connection file
        // Path for /snt/api/crons/ directory
        $connectionPath = __DIR__ . '/../../connection.php';
        
        if (!file_exists($connectionPath)) {
            logMessage("Error: connection.php not found at: $connectionPath", 'ERROR');
            exit(1);
        }
        
        require_once $connectionPath;
        
        if (!isset($pdo) || $pdo === null) {
            logMessage("Database Connection Failed: PDO object not available", 'ERROR');
            exit(1);
        }
        
        logMessage("Database connection established");
        
        // Fetch all step 1a residence records
        // Step 1a means completedStep = 2 (offer letter accepted, waiting for MOHRE approval)
        try {
            $stmt = $pdo->prepare("
                SELECT 
                    r.residenceID,
                    r.datetime,
                    r.passenger_name,
                    r.passportNumber,
                    r.mb_number,
                    r.LabourCardNumber,
                    r.completedStep,
                    c.customer_name,
                    comp.company_name,
                    comp.company_number
                FROM residence r
                LEFT JOIN customer c ON r.customer_id = c.customer_id
                LEFT JOIN company comp ON r.company = comp.company_id
                WHERE r.completedStep = 2
                    AND r.hold = 0
                ORDER BY r.datetime DESC
            ");
            
            $stmt->execute();
            $residences = $stmt->fetchAll();
            
            logMessage("Found " . count($residences) . " residence records in step 1a");
        } catch (PDOException $e) {
            logMessage("Error fetching residence records: " . $e->getMessage(), 'ERROR');
            exit(1);
        }
        
        if (empty($residences)) {
            logMessage("No residence records found in step 1a. Exiting.");
            return;
        }
        
        // Group by company to minimize API calls
        $companiesProcessed = [];
        $matchesFound = 0;
        $emailsSent = 0;
        
        foreach ($residences as $residence) {
            $companyNumber = $residence['company_number'];
            
            if (empty($companyNumber)) {
                logMessage("Skipping Residence ID {$residence['residenceID']}: No company number", 'WARNING');
                continue;
            }
            
            // Log which specific record we're checking
            logMessage("Checking Residence ID {$residence['residenceID']}: {$residence['passenger_name']} | MB: {$residence['mb_number']} | Company: {$companyNumber}");
            
            // Fetch pending payments for THIS residence's company (cache results to avoid duplicate API calls)
            if (!isset($companiesProcessed[$companyNumber])) {
                logMessage("  → Fetching pending payments for company: {$companyNumber}");
                $pendingPayments = fetchPendingPayments($companyNumber);
                $companiesProcessed[$companyNumber] = $pendingPayments ?? [];
                logMessage("  → Found " . count($companiesProcessed[$companyNumber]) . " pending payments for company {$companyNumber}");
            }
            
            $pendingPayments = $companiesProcessed[$companyNumber];
            
            if (empty($pendingPayments)) {
                logMessage("  → No pending payments for this company, skipping");
                continue;
            }
            
            // Try to find a matching payment for THIS specific residence's MB number
            logMessage("  → Checking if MB {$residence['mb_number']} matches any pending payment...");
            $matchInfo = findMatchingPayment($residence, $pendingPayments);
            
        if ($matchInfo) {
            $matchesFound++;
            logMessage(
                "  ✅ MATCH FOUND! Residence ID {$residence['residenceID']} - {$residence['passenger_name']} " .
                "matches pending payment (Score: {$matchInfo['score']}, Reasons: " . implode(', ', $matchInfo['reasons']) . ")",
                'ALERT'
            );
            
            // Check if email was already sent for this residence
            if (wasEmailAlreadySent($residence['residenceID'])) {
                logMessage("  → Email already sent for this residence (within last 30 days), skipping", 'INFO');
            } else {
                // Send email alert
                if (sendEmailAlert($residence, $matchInfo, count($pendingPayments))) {
                    $emailsSent++;
                    // Mark as sent to prevent duplicates
                    markEmailAsSent($residence['residenceID'], $residence['passenger_name'], $residence['mb_number']);
                }
            }
        } else {
            logMessage("  → No match found for this residence");
        }
        }
        
        logMessage("=== Pending Payments Check Completed ===");
        logMessage("Total residences checked: " . count($residences));
        logMessage("Total matches found: {$matchesFound}");
        logMessage("Total emails sent: {$emailsSent}");
    }

    // Run the script
    try {
        main();
    } catch (Exception $e) {
        logMessage("Fatal error: " . $e->getMessage(), 'ERROR');
        logMessage("Stack trace: " . $e->getTraceAsString(), 'ERROR');
        exit(1);
    }

    exit(0);
