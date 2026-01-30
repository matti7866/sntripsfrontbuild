<?php
/**
 * WhatsApp API Service for SN Travels
 * Powered by Twilio
 * 
 * This service handles WhatsApp message sending using Twilio's API
 * with support for approved content templates
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Require Twilio SDK
require_once __DIR__ . '/vendor/autoload.php';
use Twilio\Rest\Client;

// Load configuration from whatsapp-config.php
$configFile = __DIR__ . '/whatsapp-config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Configuration file not found. Please create whatsapp-config.php from whatsapp-config.example.php'
    ]);
    exit;
}

$config = require $configFile;

// Twilio Configuration - Loaded from whatsapp-config.php
define('TWILIO_ACCOUNT_SID', $config['twilio']['account_sid']);
define('TWILIO_AUTH_TOKEN', $config['twilio']['auth_token']);
define('TWILIO_WHATSAPP_FROM', $config['twilio']['whatsapp_from']);

// Template SIDs - Loaded from whatsapp-config.php
define('TEMPLATE_AUTH', $config['templates']['auth']);
define('TEMPLATE_APPOINTMENT', $config['templates']['appointment']);

/**
 * Log WhatsApp activity
 */
function logWhatsAppActivity($data) {
    $logDir = __DIR__ . '/logs';
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }
    
    $logFile = $logDir . '/whatsapp-' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] " . json_encode($data) . "\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

/**
 * Format phone number for WhatsApp
 */
function formatWhatsAppNumber($phone) {
    // Remove all non-numeric characters
    $phone = preg_replace('/[^0-9+]/', '', $phone);
    
    // Add + if not present
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
        
        // Format recipient number
        $toNumber = formatWhatsAppNumber($to);
        
        // Prepare message parameters
        $messageParams = [
            'from' => TWILIO_WHATSAPP_FROM,
            'contentSid' => $templateSid,
        ];
        
        // Add content variables if provided
        if (!empty($variables)) {
            $messageParams['contentVariables'] = json_encode($variables);
        }
        
        // Add fallback body if provided
        if (!empty($fallbackBody)) {
            $messageParams['body'] = $fallbackBody;
        }
        
        // Send message
        $message = $twilio->messages->create($toNumber, $messageParams);
        
        // Log success
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
        // Log error
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
 * Template: "{{1}} is your verification code. For your security, do not share this code."
 */
function sendAuthCode($to, $code) {
    $variables = [
        '1' => (string)$code  // The verification/OTP code
    ];
    
    $fallbackBody = "$code is your verification code. For your security, do not share this code.";
    
    return sendWhatsAppMessage($to, TEMPLATE_AUTH, $variables, $fallbackBody);
}

/**
 * Send appointment reminder via WhatsApp
 * Template: "Your appointment is coming up on {{1}} at {{2}}"
 */
function sendAppointmentReminder($to, $date, $time) {
    $variables = [
        '1' => (string)$date,  // Appointment date
        '2' => (string)$time   // Appointment time
    ];
    
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
    
    // Validate phone number
    if (empty($to)) {
        echo json_encode([
            'success' => false,
            'error' => 'Phone number is required'
        ]);
        exit;
    }
    
    $response = [];
    
    switch ($action) {
        case 'auth_code':
        case 'otp':
        case 'send_otp':
            $code = $input['code'] ?? $input['otp'] ?? '';
            if (empty($code)) {
                $response = [
                    'success' => false,
                    'error' => 'Verification code is required'
                ];
            } else {
                $response = sendAuthCode($to, $code);
            }
            break;
            
        case 'custom_template':
            $templateSid = $input['template_sid'] ?? '';
            $variables = $input['variables'] ?? [];
            
            if (empty($templateSid)) {
                $response = [
                    'success' => false,
                    'error' => 'Template SID is required'
                ];
            } else {
                $response = sendCustomTemplate($to, $templateSid, $variables);
            }
            break;
            
        default:
            $response = [
                'success' => false,
                'error' => 'Invalid action. Supported actions: auth_code, otp, send_otp, custom_template'
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
            'actions' => [
                'auth_code',
                'otp',
                'send_otp',
                'custom_template'
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed. Use POST to send messages or GET with ?test=1 to test the API'
        ]);
    }
    exit;
}

// Method not allowed
http_response_code(405);
echo json_encode([
    'success' => false,
    'error' => 'Method not allowed'
]);
