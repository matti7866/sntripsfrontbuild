<?php
/**
 * Company Information API
 * Fetches company information from MOHRE using company number
 * Inquiry Code: CI (Company Information)
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

// Get company number from query parameter
$companyNumber = isset($_GET['companyNumber']) ? trim($_GET['companyNumber']) : '';

if ($companyNumber == "") {
    response_json(['status' => "error", 'message' => "Company number is required"]);
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
    'InquiryCode' => 'CI',
    'InputData' => '',
    'Captcha' => '',
]));
curl_setopt($ch, CURLOPT_COOKIEJAR, dirname(__FILE__) . "/cookies_ci.txt");
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
    'InquiryCode' => 'CI',
    'InputData' => $companyNumber,
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
curl_setopt($ch, CURLOPT_COOKIEFILE, dirname(__FILE__) . '/cookies_ci.txt');
$a = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

$final_url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);

$data = file_get_contents($final_url);

// Check for error messages
if (strpos($data, 'No Data Found') !== false || strpos($data, 'not available') !== false) {
    response_json(['status' => 'error', 'message' => 'No company information found for this company number']);
}

$html = str_get_html($data);

if (!$html) {
    response_json(['status' => 'error', 'message' => 'Unable to parse response from MOHRE']);
}

// Extract company information
$companyInfo = [];

$allListItems = $html->find('li');
foreach ($allListItems as $item) {
    $strong = $item->find('strong', 0);
    $span = $item->find('span', 0);
    
    if ($strong && $span) {
        $label = trim(str_replace(':', '', $strong->plaintext));
        $value = trim($span->plaintext);
        
        // Company Information fields (Arabic labels from MOHRE) - Using exact matching
        // Note: Some labels use 'Strong' (capital S) in HTML
        if ($label == 'اسم المنشاة' || $label == 'اسم المنشأة') {
            $companyInfo['company_name'] = $value;
        } elseif ($label == 'رقم المنشأة' || $label == 'رقم المنشاة') {
            $companyInfo['company_number'] = $value;
        } elseif ($label == 'الفئة') {
            $companyInfo['category'] = $value;
        } elseif ($label == 'الجنسية') {
            $companyInfo['nationality'] = $value;
        } elseif ($label == 'الدرجة') {
            $companyInfo['class_desc'] = $value;
        } elseif ($label == 'نوع المنشاة' || $label == 'نوع المنشأة') {
            $companyInfo['company_type'] = $value;
        } elseif ($label == 'رقم الرخصة') {
            $companyInfo['license_number'] = $value;
        } elseif ($label == 'نوع الرخصة') {
            $companyInfo['license_type'] = $value;
        } elseif ($label == 'الإمارة') {
            $companyInfo['emirate'] = $value;
        } elseif ($label == 'مكتب العمل') {
            $companyInfo['labour_office'] = $value;
        } elseif ($label == 'حصص تصاريح المهمة') {
            $companyInfo['mission_quota_available'] = $value;
        } elseif ($label == 'حصص تصاريح العمل') {
            $companyInfo['electronic_quota_available'] = $value;
        } elseif ($label == 'حالة المنشأة' || $label == 'حالة المنشاة') {
            $companyInfo['company_status'] = $value;
        }
    }
}

// Check if we got any data
if (empty($companyInfo)) {
    response_json(['status' => 'error', 'message' => 'No company information found for this company number']);
}

$result = [
    'company_info' => $companyInfo
];

response_json(['status' => 'success', 'message' => 'Company information retrieved successfully', 'data' => $result]);

