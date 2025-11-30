<?php
// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// get data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['msg']) || !isset($data['recipient']) || !isset($data['sender']) || !isset($data['category'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// Configuration
$loginApiUrl = 'https://nexus.eandenterprise.com/api/v1/accounts/users/login';
$smsApiUrl = 'https://nexus.eandenterprise.com/api/v1/sms/send';

// Login credentials
$username = 'selabnadirydxb@gmail.com';
$password = 'Uae@2020';

// SMS details
$recipientPhone = $data['recipient'];
$messageText = $data['msg'];

/**
 * Function to get access token from login API
 */
function getAccessToken($url, $username, $password) {
    $loginData = [
        'email' => $username,
        'password' => $password
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        throw new Exception('cURL Error: ' . curl_error($ch));
    }
    
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception('Login failed with HTTP code: ' . $httpCode);
    }
    
    $data = json_decode($response, true);
    
    if (!isset($data['access_token'])) {
        throw new Exception('Access token not found in response');
    }
    
    return $data['access_token'];
}

/**
 * Function to send SMS using access token
 */
function sendSMS($url, $accessToken, $phone, $message, $from, $category) {
    $smsData = [
        "msg" => $message,
        "recipient"=> $phone,
        "sender"=> $from,
        "category"=> $category,
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($smsData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json',
        'Authorization: Bearer ' . $accessToken
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        throw new Exception('cURL Error: ' . curl_error($ch));
    }
    
    curl_close($ch);
    
    if ($httpCode !== 200 && $httpCode !== 201 && $httpCode != 202) {
        throw new Exception('SMS sending failed with HTTP code: ' . $httpCode . '. Response: ' . $response);
    }
    
    return json_decode($response, true);
}

// Main execution
try {
    $accessToken = getAccessToken($loginApiUrl, $username, $password);
    $smsResponse = sendSMS($smsApiUrl, $accessToken, $recipientPhone, $messageText, $data['sender'],$data['category']);
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'SMS Sent Successfully','data'=>$smsResponse]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

?>