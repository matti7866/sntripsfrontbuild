<?php
/**
 * Work Permit Residency In Customer Process API
 * Fetches work permit status in immigration from MOHRE using MB number
 * Inquiry Code: WPRICP (Work Permit Residency In Customer Process)
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

// Get MB number (transaction number) from query parameter
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
    'InquiryCode' => 'WPRICP',
    'InputData' => '',
    'Captcha' => '',
]));
curl_setopt($ch, CURLOPT_COOKIEJAR, dirname(__FILE__) . "/cookies_wpricp.txt"); // Save cookies here
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
    'InquiryCode' => 'WPRICP',
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
curl_setopt($ch, CURLOPT_COOKIEFILE, dirname(__FILE__) . '/cookies_wpricp.txt');
$a = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

$final_url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);

$data = file_get_contents($final_url);

// Check for error messages
if (strpos($data, 'No Data Found') !== false || strpos($data, 'not available') !== false) {
    response_json(['status' => 'error', 'message' => 'No immigration status found for this MB number']);
}

$html = str_get_html($data);

if (!$html) {
    response_json(['status' => 'error', 'message' => 'Unable to parse response from MOHRE']);
}

// Extract immigration status information - Using Arabic labels
$immigrationStatus = [];

$allListItems = $html->find('li');
foreach ($allListItems as $item) {
    $strong = $item->find('strong', 0);
    $span = $item->find('span', 0);
    
    if ($strong && $span) {
        $label = trim(str_replace(':', '', $strong->plaintext));
        $value = trim($span->plaintext);
        
        // Immigration Status fields (Arabic labels)
        if (stripos($label, 'رقم البطاقة') !== false) {
            $immigrationStatus['card_number'] = $value;
        } elseif (stripos($label, 'رقم المنشأة لدى وزارة الداخلية') !== false) {
            $immigrationStatus['moi_company_code'] = $value;
        } elseif (stripos($label, 'تاريخ الإضافة') !== false) {
            $immigrationStatus['date_added'] = $value;
        } elseif (stripos($label, 'تاريخ الارسال') !== false) {
            $immigrationStatus['send_date'] = $value;
        } elseif (stripos($label, 'حالة الطلب') !== false) {
            // Get the full application status including nested strong tags
            $statusSpan = $item->find('span', 0);
            if ($statusSpan) {
                $statusText = '';
                $strongTags = $statusSpan->find('strong');
                foreach ($strongTags as $strong) {
                    $statusText .= trim($strong->plaintext) . ' ';
                }
                
                // Extract file number and unified number from text-info spans
                $infoSpans = $statusSpan->find('span.text-info');
                if (count($infoSpans) >= 1) {
                    $immigrationStatus['file_number'] = trim($infoSpans[0]->plaintext);
                }
                if (count($infoSpans) >= 2) {
                    $immigrationStatus['unified_number'] = trim($infoSpans[1]->plaintext);
                }
                
                $immigrationStatus['application_status'] = trim($statusText);
            }
        }
    }
}

// Check if we got any data
if (empty($immigrationStatus)) {
    response_json(['status' => 'error', 'message' => 'No immigration status information found for this MB number']);
}

$result = [
    'immigration_status' => $immigrationStatus
];

response_json(['status' => 'success', 'message' => 'Immigration status retrieved successfully', 'data' => $result]);

