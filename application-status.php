<?php
/**
 * Application Status API
 * Fetches application status from MOHRE using MB number
 * Inquiry Code: AS (Application Status)
 */

// CORS headers to allow requests from your React app
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 86400");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require 'simple_html_dom.php';

function response_json($output = array())
{
    header("Content-Type: application/json");
    echo json_encode($output);
    exit;
}

// Get MB number from query parameter
$mbNumber = isset($_GET['mbNumber']) ? trim($_GET['mbNumber']) : '';

if ($mbNumber == "") {
    response_json(['status' => "error", 'message' => "MB/Transaction number is required"]);
}

$url = "https://inquiry.mohre.gov.ae/";

// Initialize cURL session - First request to get captcha
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url . 'Home/RC');
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'InquiryCode' => 'AS',
    'InputData' => '',
    'Captcha' => '',
]));
curl_setopt($ch, CURLOPT_COOKIEJAR, dirname(__FILE__) . "/cookies_as.txt");
$response = curl_exec($ch);
curl_close($ch);

$html = str_get_html($response);

// Check if unable to find request 
if (!$html) {
    response_json(['status' => 'error', 'message' => 'Sorry! Unable to serve you at this time']);
}

$otp = $html->find("#captchaValue", 0)->innertext ?? '';
$otpURL = $html->find('input#CaptchaURL', 0)->getAttribute("value") ?? '';
$verificationToken = $html->find('input[name=__RequestVerificationToken]', 0)->getAttribute("value") ?? '';

$formData = [
    'CaptchaURL' => $otpURL,
    'InquiryCode' => 'AS',
    'InputData' => $mbNumber,
    'Captcha' => $otp,
    'InputCaptcha' => $otp,
    'InputLanguge' => 'en',
    '__RequestVerificationToken' => $verificationToken
];

$finalURL = $url . "TransactionInquiry";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $finalURL);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($ch, CURLOPT_POSTFIELDS, $formData);
curl_setopt($ch, CURLOPT_COOKIEFILE, dirname(__FILE__) . '/cookies_as.txt');
$a = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

$final_url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);

$data = file_get_contents($final_url);

$html = str_get_html($data);

if (!$html) {
    response_json(['status' => 'error', 'message' => 'Unable to parse response from MOHRE']);
}

// Application Status typically returns a simple message or alert
// Check for alert messages
$alertWarning = $html->find('div.alert-warning', 0);
$alertSuccess = $html->find('div.alert-success', 0);
$alertDanger = $html->find('div.alert-danger', 0);
$alertInfo = $html->find('div.alert-info', 0);

$statusMessage = '';
$statusType = 'info';

if ($alertWarning) {
    $span = $alertWarning->find('span', 0);
    $statusMessage = $span ? trim($span->plaintext) : trim($alertWarning->plaintext);
    $statusType = 'warning';
} elseif ($alertSuccess) {
    $span = $alertSuccess->find('span', 0);
    $statusMessage = $span ? trim($span->plaintext) : trim($alertSuccess->plaintext);
    $statusType = 'success';
} elseif ($alertDanger) {
    $span = $alertDanger->find('span', 0);
    $statusMessage = $span ? trim($span->plaintext) : trim($alertDanger->plaintext);
    $statusType = 'danger';
} elseif ($alertInfo) {
    $span = $alertInfo->find('span', 0);
    $statusMessage = $span ? trim($span->plaintext) : trim($alertInfo->plaintext);
    $statusType = 'info';
}

// If no alert found, try to find description list
if (empty($statusMessage)) {
    $applicationInfo = [];
    $allListItems = $html->find('li');
    
    foreach ($allListItems as $item) {
        $strong = $item->find('strong', 0);
        $span = $item->find('span', 0);
        
        if ($strong && $span) {
            $label = trim(str_replace(':', '', $strong->plaintext));
            $value = trim($span->plaintext);
            $applicationInfo[$label] = $value;
        }
    }
    
    if (!empty($applicationInfo)) {
        response_json([
            'status' => 'success',
            'message' => 'Application status retrieved successfully',
            'data' => [
                'mb_number' => $mbNumber,
                'application_info' => $applicationInfo,
                'has_details' => true
            ]
        ]);
    }
}

// Check if we got a message
if (empty($statusMessage) && empty($applicationInfo)) {
    response_json(['status' => 'error', 'message' => 'No application status found for this MB number']);
}

$result = [
    'mb_number' => $mbNumber,
    'status_message' => $statusMessage,
    'status_type' => $statusType,
    'has_details' => false
];

response_json(['status' => 'success', 'message' => 'Application status checked successfully', 'data' => $result]);
