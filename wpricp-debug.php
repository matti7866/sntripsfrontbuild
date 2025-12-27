<?php
/**
 * Work Permit Residency In Customer Process API - DEBUG VERSION
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require 'simple_html_dom.php';

$mbNumber = isset($_GET['mbNumber']) ? trim($_GET['mbNumber']) : 'MB295943148AE';

$url = "https://inquiry.mohre.gov.ae/";

// First request
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
curl_setopt($ch, CURLOPT_COOKIEJAR, dirname(__FILE__) . "/cookies_wpricp_debug.txt");
$response = curl_exec($ch);
curl_close($ch);

$html = str_get_html($response);

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
curl_setopt($ch, CURLOPT_COOKIEFILE, dirname(__FILE__) . '/cookies_wpricp_debug.txt');
$a = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$final_url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);

$data = file_get_contents($final_url);

$html = str_get_html($data);

// Debug: Output the HTML structure
header("Content-Type: text/html");
echo "<h2>Debug Information - Immigration Status</h2>";
echo "<h3>MB Number: $mbNumber</h3>";

// Find all h4 headers
echo "<h3>All H4 Headers:</h3>";
$headers = $html->find('h4');
foreach ($headers as $i => $header) {
    echo "<p><strong>H4 $i:</strong> " . $header->plaintext . "</p>";
}

// Find all ul.decription-list
echo "<h3>All Description Lists:</h3>";
$lists = $html->find('ul.decription-list');
echo "<p>Found " . count($lists) . " description lists</p>";

foreach ($lists as $i => $list) {
    echo "<h4>List $i:</h4>";
    $items = $list->find('li');
    foreach ($items as $item) {
        $strong = $item->find('strong', 0);
        $span = $item->find('span', 0);
        if ($strong && $span) {
            echo "<p>" . $strong->plaintext . " => " . $span->plaintext . "</p>";
        }
    }
}

// Find all li elements
echo "<h3>All LI elements with strong and span:</h3>";
$allLi = $html->find('li');
$count = 0;
foreach ($allLi as $item) {
    $strong = $item->find('strong', 0);
    $span = $item->find('span', 0);
    if ($strong && $span) {
        $count++;
        echo "<p><strong>$count:</strong> " . $strong->plaintext . " => " . $span->plaintext . "</p>";
    }
}

// Output raw HTML (first 8000 chars)
echo "<h3>Raw HTML (first 8000 chars):</h3>";
echo "<pre>" . htmlspecialchars(substr($data, 0, 8000)) . "</pre>";


