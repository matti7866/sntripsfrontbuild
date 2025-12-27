<?php
/**
 * Residence Card Information API
 * Fetches residence card information from MOHRE using company code
 * Inquiry Code: RC (Residence Card)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get company code from query parameter
$companyCode = isset($_GET['companyCode']) ? trim($_GET['companyCode']) : '';

if (empty($companyCode)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Company code is required'
    ]);
    exit;
}

// Initialize cURL session for getting captcha
$captchaUrl = 'https://eservices.mohre.gov.ae/enetwasal/TransactionInquiry/GetCaptcha';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $captchaUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_COOKIEJAR, '/tmp/mohre_cookies_' . $companyCode . '.txt');
curl_setopt($ch, CURLOPT_COOKIEFILE, '/tmp/mohre_cookies_' . $companyCode . '.txt');

$captchaResponse = curl_exec($ch);
$captchaHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($captchaHttpCode !== 200) {
    curl_close($ch);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fetch captcha from MOHRE'
    ]);
    exit;
}

$captchaData = json_decode($captchaResponse, true);

if (!isset($captchaData['captchaURL']) || !isset($captchaData['inputCaptcha'])) {
    curl_close($ch);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid captcha response from MOHRE'
    ]);
    exit;
}

$captchaURL = $captchaData['captchaURL'];
$inputCaptcha = $captchaData['inputCaptcha'];

// Now make the inquiry request
$inquiryUrl = 'https://eservices.mohre.gov.ae/enetwasal/TransactionInquiry/ResidenceCardInformation';

// Prepare POST data
$postData = http_build_query([
    'CaptchaURL' => $captchaURL,
    'InquiryCode' => 'RC',
    'InputData' => $companyCode,
    'InputCaptcha' => $inputCaptcha,
    'InputLanguge' => 'en',
    'Captcha' => $inputCaptcha
]);

// Make the inquiry request
curl_setopt($ch, CURLOPT_URL, $inquiryUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fetch residence card information from MOHRE',
        'http_code' => $httpCode
    ]);
    exit;
}

// Parse the HTML response
$dom = new DOMDocument();
@$dom->loadHTML($response);
$xpath = new DOMXPath($dom);

// Extract company information
$companyInfo = [];
$companyListItems = $xpath->query("//h4[contains(text(), 'Company Information')]/following-sibling::div[@class='application-particulars']//ul[@class='decription-list']/li");

foreach ($companyListItems as $item) {
    $strong = $xpath->query(".//strong", $item);
    $span = $xpath->query(".//span", $item);
    
    if ($strong->length > 0 && $span->length > 0) {
        $label = trim(str_replace(':', '', $strong->item(0)->textContent));
        $value = trim($span->item(0)->textContent);
        
        // Map to clean field names
        switch ($label) {
            case 'Est Name':
                $companyInfo['company_name'] = $value;
                break;
            case 'Company Code':
                $companyInfo['company_code'] = $value;
                break;
            case 'Category':
                $companyInfo['category'] = $value;
                break;
            case 'Classification':
                $companyInfo['classification'] = $value;
                break;
        }
    }
}

// Extract residence card information
$residenceInfo = [];
$residenceListItems = $xpath->query("//h4[contains(text(), 'Residence Card Information')]/following-sibling::div[@class='application-particulars']//ul[@class='decription-list']/li");

foreach ($residenceListItems as $item) {
    $strong = $xpath->query(".//strong", $item);
    $span = $xpath->query(".//span", $item);
    
    if ($strong->length > 0 && $span->length > 0) {
        $label = trim(str_replace(':', '', $strong->item(0)->textContent));
        $value = trim($span->item(0)->textContent);
        
        // Map to clean field names
        switch ($label) {
            case 'Name':
                $residenceInfo['person_name'] = $value;
                break;
            case 'Designation':
                $residenceInfo['designation'] = $value;
                break;
            case 'Expiry Date':
                $residenceInfo['expiry_date'] = $value;
                break;
            case 'Employee Classification':
                $residenceInfo['employee_classification'] = $value;
                break;
            case 'Residence Card Number':
                $residenceInfo['card_number'] = $value;
                break;
            case 'Residence Card Type':
                $residenceInfo['card_type'] = $value;
                break;
            case 'Residence Card Active':
                $residenceInfo['card_active'] = $value;
                break;
            case 'Payment Number':
                $residenceInfo['payment_number'] = $value;
                break;
            case 'Paycard Number':
                $residenceInfo['paycard_number'] = $value;
                break;
            case 'Person Code':
                $residenceInfo['person_code'] = $value;
                break;
            case 'Transaction Number':
                $residenceInfo['transaction_number'] = $value;
                break;
        }
    }
}

// Extract table data (residence cards list if available)
$residenceCards = [];
$tableRows = $xpath->query("//table[@class='table table-striped text-center']//tbody/tr");

foreach ($tableRows as $row) {
    $cells = $xpath->query(".//td", $row);
    if ($cells->length >= 4) {
        $residenceCards[] = [
            'card_number' => trim($cells->item(0)->textContent),
            'card_type' => trim($cells->item(1)->textContent),
            'status' => trim($cells->item(2)->textContent),
            'transaction_number' => trim($cells->item(3)->textContent)
        ];
    }
}

// Check if we got any data
if (empty($companyInfo) && empty($residenceInfo)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'No residence card information found for this company code. Please verify the company code is correct.'
    ]);
    exit;
}

// Return the parsed data
echo json_encode([
    'status' => 'success',
    'message' => 'Residence card information retrieved successfully',
    'data' => [
        'company_info' => $companyInfo,
        'residence_info' => $residenceInfo,
        'residence_cards' => $residenceCards,
        'total_cards' => count($residenceCards)
    ]
]);

// Clean up cookie file
@unlink('/tmp/mohre_cookies_' . $companyCode . '.txt');

