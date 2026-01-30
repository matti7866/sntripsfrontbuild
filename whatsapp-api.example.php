<?php
/**
 * WhatsApp API Service for SN Travels - EXAMPLE TEMPLATE
 * 
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to whatsapp-api.php
 * 2. Replace YOUR_* placeholders with your actual Twilio credentials
 * 3. Upload whatsapp-api.php to your server
 * 4. NEVER commit whatsapp-api.php to Git (it's in .gitignore)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Require Twilio SDK
require_once __DIR__ . '/vendor/autoload.php';
use Twilio\Rest\Client;

// ============================================
// TWILIO CREDENTIALS - REPLACE WITH YOUR VALUES
// ============================================
define('TWILIO_ACCOUNT_SID', 'YOUR_TWILIO_ACCOUNT_SID');
define('TWILIO_AUTH_TOKEN', 'YOUR_TWILIO_AUTH_TOKEN');
define('TWILIO_WHATSAPP_FROM', 'whatsapp:+YOUR_PHONE_NUMBER');

// WhatsApp Template SIDs
define('TEMPLATE_AUTH', 'YOUR_AUTH_TEMPLATE_SID');
define('TEMPLATE_APPOINTMENT', 'YOUR_APPOINTMENT_TEMPLATE_SID');

/**
 * Log WhatsApp activity
 */
function logWhatsAppActivity($data) {
    $logDir = __DIR__ . '/logs';
    if (!file_exists($logDir)) {
        @mkdir($logDir, 0777, true);
    }
    
    $logFile = $logDir . '/whatsapp-' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] " . json_encode($data) . "\n";
    @file_put_contents($logFile, $logEntry, FILE_APPEND);
}

/**
 * Format phone number for WhatsApp
 */
function formatWhatsAppNumber($phone) {
    $phone = preg_replace('/[^0-9+]/', '', $phone);
    if (substr($phone, 0, 1) !== '+') {
        $phone = '+' . $phone;
    }
    return 'whatsapp:' . $phone;
}

/**
 * Send WhatsApp message using template
 */
function sendWhatsAppMessage($to, $templateSid, $variables = [], $fallbackBody = '') {
    try {
        $twilio = new Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        $toNumber = formatWhatsAppNumber($to);
        
        $messageParams = [
            'from' => TWILIO_WHATSAPP_FROM,
            'contentSid' => $templateSid,
        ];
        
        if (!empty($variables)) {
            $messageParams['contentVariables'] = json_encode($variables);
        }
        
        if (!empty($fallbackBody)) {
            $messageParams['body'] = $fallbackBody;
        }
        
        $message = $twilio->messages->create($toNumber, $messageParams);
        
        logWhatsAppActivity([
            'status' => 'success',
            'to' => $to,
            'message_sid' => $message->sid,
            'template' => $templateSid,
            'variables' => $variables
        ]);
        
        return [
            'success' => true,
            'message_sid' => $message->sid,
            'status' => $message->status,
            'to' => $to
        ];
        
    } catch (Exception $e) {
        logWhatsAppActivity([
            'status' => 'error',
            'to' => $to,
            'error' => $e->getMessage(),
            'template' => $templateSid
        ]);
        
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'to' => $to
        ];
    }
}

/**
 * Send authentication/OTP code via WhatsApp
 */
function sendAuthCode($to, $code) {
    $variables = ['1' => (string)$code];
    $fallbackBody = "$code is your verification code. For your security, do not share this code.";
    return sendWhatsAppMessage($to, TEMPLATE_AUTH, $variables, $fallbackBody);
}

/**
 * Send appointment reminder via WhatsApp
 */
function sendAppointmentReminder($to, $date, $time) {
    $variables = ['1' => (string)$date, '2' => (string)$time];
    $fallbackBody = "Your appointment is coming up on $date at $time";
    return sendWhatsAppMessage($to, TEMPLATE_APPOINTMENT, $variables, $fallbackBody);
}

/**
 * Send custom template message
 */
function sendCustomTemplate($to, $templateSid, $variables = []) {
    return sendWhatsAppMessage($to, $templateSid, $variables);
}

// Handle API Requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }
    
    $action = $input['action'] ?? '';
    $to = $input['to'] ?? $input['phone'] ?? '';
    
    if (empty($to)) {
        echo json_encode(['success' => false, 'error' => 'Phone number is required']);
        exit;
    }
    
    $response = [];
    
    switch ($action) {
        case 'auth_code':
        case 'otp':
        case 'send_otp':
            $code = $input['code'] ?? $input['otp'] ?? '';
            $response = empty($code) 
                ? ['success' => false, 'error' => 'Verification code is required']
                : sendAuthCode($to, $code);
            break;
            
        case 'custom_template':
            $templateSid = $input['template_sid'] ?? '';
            $variables = $input['variables'] ?? [];
            $response = empty($templateSid)
                ? ['success' => false, 'error' => 'Template SID is required']
                : sendCustomTemplate($to, $templateSid, $variables);
            break;
            
        default:
            $response = [
                'success' => false,
                'error' => 'Invalid action. Supported: auth_code, otp, send_otp, custom_template'
            ];
    }
    
    echo json_encode($response);
    exit;
}

// Handle GET requests (for testing)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['test'])) {
        echo json_encode([
            'success' => true,
            'message' => 'WhatsApp API is ready',
            'version' => '1.0.0',
            'from_number' => TWILIO_WHATSAPP_FROM,
            'template_sid' => TEMPLATE_AUTH,
            'actions' => ['auth_code', 'otp', 'send_otp', 'custom_template']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Use POST to send messages or GET with ?test=1 to test'
        ]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
