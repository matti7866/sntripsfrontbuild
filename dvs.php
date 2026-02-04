<?php
/**
 * Document Verification Service API
 * Fetches document verification status from MOHRE using passport number and nationality code
 * Inquiry Code: DVS (Document Verification Service)
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

// Get passport number and nationality code from query parameters
$passportNumber = isset($_GET['passportNumber']) ? trim($_GET['passportNumber']) : '';
$nationalityCode = isset($_GET['nationalityCode']) ? trim($_GET['nationalityCode']) : '';

if ($passportNumber == "" || $nationalityCode == "") {
    response_json(['status' => "error", 'message' => "Passport number and nationality code are required"]);
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
    'InquiryCode' => 'DVS',
    'InputData' => '',
    'Captcha' => '',
]));
curl_setopt($ch, CURLOPT_COOKIEJAR, dirname(__FILE__) . "/cookies_dvs.txt");
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
    'InquiryCode' => 'DVS',
    'InputData' => $passportNumber,
    'NationalityCode' => $nationalityCode,
    'Captcha' => $otp,
    'InputCaptcha' => $otp,
    'InputLanguge' => 'en',
    'InputPermitType' => $nationalityCode,
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
curl_setopt($ch, CURLOPT_COOKIEFILE, dirname(__FILE__) . '/cookies_dvs.txt');
$a = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

$final_url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);

$data = file_get_contents($final_url);

$html = str_get_html($data);

if (!$html) {
    response_json(['status' => 'error', 'message' => 'Unable to parse response from MOHRE']);
}

// DVS returns a simple alert message, not detailed fields
// Look for alert-warning or alert-success divs
$alertWarning = $html->find('div.alert-warning', 0);
$alertSuccess = $html->find('div.alert-success', 0);
$alertDanger = $html->find('div.alert-danger', 0);
$alertInfo = $html->find('div.alert-info', 0);

$alertMessage = '';
$alertType = 'info';

if ($alertWarning) {
    $span = $alertWarning->find('span', 0);
    $alertMessage = $span ? trim($span->plaintext) : trim($alertWarning->plaintext);
    $alertType = 'warning';
} elseif ($alertSuccess) {
    $span = $alertSuccess->find('span', 0);
    $alertMessage = $span ? trim($span->plaintext) : trim($alertSuccess->plaintext);
    $alertType = 'success';
} elseif ($alertDanger) {
    $span = $alertDanger->find('span', 0);
    $alertMessage = $span ? trim($span->plaintext) : trim($alertDanger->plaintext);
    $alertType = 'danger';
} elseif ($alertInfo) {
    $span = $alertInfo->find('span', 0);
    $alertMessage = $span ? trim($span->plaintext) : trim($alertInfo->plaintext);
    $alertType = 'info';
}

// Check if we got a message
if (empty($alertMessage)) {
    // Try to find any alert div
    $anyAlert = $html->find('div[role=alert]', 0);
    if ($anyAlert) {
        $span = $anyAlert->find('span', 0);
        $alertMessage = $span ? trim($span->plaintext) : trim($anyAlert->plaintext);
        
        // Determine alert type from class
        $class = $anyAlert->getAttribute('class');
        if (strpos($class, 'warning') !== false) $alertType = 'warning';
        elseif (strpos($class, 'success') !== false) $alertType = 'success';
        elseif (strpos($class, 'danger') !== false) $alertType = 'danger';
    } else {
        response_json(['status' => 'error', 'message' => 'No verification message found for this passport and nationality']);
    }
}

$result = [
    'passport_number' => $passportNumber,
    'nationality_code' => $nationalityCode,
    'verification_message' => $alertMessage,
    'alert_type' => $alertType
];

response_json(['status' => 'success', 'message' => 'Document verification check completed', 'data' => $result]);

