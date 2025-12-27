<?php
/**
 * Electronic Work Permit Information API
 * Fetches electronic work permit information from MOHRE using permit number
 * Inquiry Code: EWPI (Electronic Work Permit Information)
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

// Get electronic permit number from query parameter
$permitNumber = isset($_GET['permitNumber']) ? trim($_GET['permitNumber']) : '';

if ($permitNumber == "") {
    response_json(['status' => "error", 'message' => "Electronic work permit number is required"]);
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
    'InquiryCode' => 'EWPI',
    'InputData' => '',
    'Captcha' => '',
]));
curl_setopt($ch, CURLOPT_COOKIEJAR, dirname(__FILE__) . "/cookies_ewpi.txt"); // Save cookies here
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
    'InquiryCode' => 'EWPI',
    'InputData' => $permitNumber,
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
curl_setopt($ch, CURLOPT_COOKIEFILE, dirname(__FILE__) . '/cookies_ewpi.txt');
$a = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

$final_url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);

$data = file_get_contents($final_url);

// Check for error messages
if (strpos($data, 'No Data Found') !== false || strpos($data, 'not available') !== false) {
    response_json(['status' => 'error', 'message' => 'No electronic work permit information found for this permit number']);
}

$html = str_get_html($data);

if (!$html) {
    response_json(['status' => 'error', 'message' => 'Unable to parse response from MOHRE']);
}

// Extract company and permit information from all li elements
$companyInfo = [];

$allListItems = $html->find('li');
foreach ($allListItems as $item) {
    $strong = $item->find('strong', 0);
    $span = $item->find('span', 0);
    
    if ($strong && $span) {
        $label = trim(str_replace(':', '', $strong->plaintext));
        $value = trim($span->plaintext);
        
        // Company Information fields (Arabic labels)
        if (stripos($label, 'اسم المنشأة') !== false) {
            $companyInfo['company_name'] = $value;
        } elseif (stripos($label, 'رقم المنشأة') !== false) {
            $companyInfo['company_code'] = $value;
        } elseif (stripos($label, 'فئة المنشأة') !== false) {
            $companyInfo['category'] = $value;
        } elseif (stripos($label, 'تصنيف المنشأة') !== false) {
            $companyInfo['classification'] = $value;
        }
    }
}

// Extract electronic work permit information - Using Arabic labels
$permitInfo = [];
foreach ($allListItems as $item) {
    $strong = $item->find('strong', 0);
    $span = $item->find('span', 0);
    
    if ($strong && $span) {
        $label = trim(str_replace(':', '', $strong->plaintext));
        $value = trim($span->plaintext);
        
        // Permit Information fields (Arabic labels)
        if (stripos($label, 'الإسم') !== false) {
            $permitInfo['person_name'] = $value;
        } elseif (stripos($label, 'الوظيفة') !== false) {
            $permitInfo['designation'] = $value;
        } elseif (stripos($label, 'تاريخ الإنتهاء') !== false) {
            $permitInfo['expiry_date'] = $value;
        } elseif (stripos($label, 'تصنيف العامل') !== false) {
            $permitInfo['employee_classification'] = $value;
        } elseif (stripos($label, 'رقم تصريح العمل الكتروني') !== false) {
            $permitInfo['permit_number'] = $value;
        } elseif (stripos($label, 'نوع تصريح العمل الكتروني') !== false) {
            $permitInfo['permit_type'] = $value;
        } elseif (stripos($label, 'حالة تصريح العمل الكتروني') !== false) {
            $permitInfo['permit_active'] = $value;
        } elseif (stripos($label, 'رقم إذن الدفع') !== false) {
            $permitInfo['payment_number'] = $value;
        } elseif (stripos($label, 'رقم بطاقة الدفع') !== false) {
            // Get the full span content including any font tags for checkmark
            $fullValue = $span->innertext;
            $permitInfo['paycard_number'] = $fullValue;
        } elseif (stripos($label, 'رقم العامل') !== false) {
            $permitInfo['person_code'] = $value;
        } elseif (stripos($label, 'رقم المعاملة') !== false && !isset($permitInfo['transaction_number'])) {
            $permitInfo['transaction_number'] = $value;
        }
    }
}

// Extract table data (electronic work permits list if available)
$workPermits = [];
$table = $html->find('table.table', 0);

if ($table) {
    $rows = $table->find('tbody tr');
    foreach ($rows as $row) {
        $cols = $row->find('td');
        
        if (count($cols) >= 4) {
            $workPermits[] = [
                'permit_number' => trim($cols[0]->plaintext),
                'permit_type' => trim($cols[1]->plaintext),
                'status' => trim($cols[2]->plaintext),
                'transaction_number' => trim($cols[3]->plaintext)
            ];
        }
    }
}

$result = [
    'company_info' => $companyInfo,
    'permit_info' => $permitInfo,
    'work_permits' => $workPermits,
    'total_permits' => count($workPermits)
];

response_json(['status' => 'success', 'message' => 'Electronic work permit information retrieved successfully', 'data' => $result]);

