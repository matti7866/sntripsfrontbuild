<?php
/**
 * SMS API Proxy Endpoint
 * This file acts as a secure proxy to send SMS via the Nexus API
 * Keeps the Bearer token secure on the server side
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get the request body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validate required fields
if (!isset($data['msg']) || !isset($data['recipient']) || !isset($data['sender']) || !isset($data['category'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// Prepare the SMS API request
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, 'https://nexus.eandenterprise.com/api/v1/sms/send');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'msg' => $data['msg'],
    'recipient' => $data['recipient'],
    'sender' => $data['sender'],
    'category' => $data['category']
]));

$headers = array();
$headers[] = 'Accept: application/json';
$headers[] = 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJpZXlPLUp5Y1ZiREpBNS0yZ0FXVThFNVhwZTdsWTZGV3BpN0l5UldRa3RJIn0.eyJleHAiOjE3NjQzNDI0MTMsImlhdCI6MTc2NDM0MDYxMywianRpIjoiZDYyMzRkZWUtODNmNS00ZWZhLTk2ZDQtZGRlMTZlOWE4ZWE5IiwiaXNzIjoiaHR0cDovL2tleWNsb2FrLjNyZHBhcnR5LnN2Yy5jbHVzdGVyLmxvY2FsOjgwODAvcmVhbG1zL21hc3RlciIsInN1YiI6ImEwNzZiMzMwLTEzZjMtNDNiNy1hZmIyLTdkYTU3ZDkwM2I0NiIsInR5cCI6IkJlYXJlciIsImF6cCI6Im5nYWdlLWNsaWVudCIsInNlc3Npb25fc3RhdGUiOiI4OGZiNmEwNy1mYjk0LTQ0ZGMtYTE5MS1kOGJiODk4NmRiZTQiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsic3lzdGVtZ3JvdXB-RW50ZXJwcmlzZSBBZG1pbn5FbnRlcnByaXNlIEFjY291bnQgQWRtaW4iXX0sInNjb3BlIjoid2FfdG1wX3Igc21zX2NtcGdfZHcgYWxlcnRfYyBudW1sc19kIGNudG1nbXRfZCBlbWFpbF9jbXBnX2Ugc25kX2Fkcl9yIGRzaGJfciB1c3JfciBkbmRfYyBzbXNfY21wZ19yIHNuZF9hZHJfZSB2cl9mbG1ncl9kdyBybGNfZCB2Y19mbG1ncl9yIGVtYWlsdG1wX2QgY2ZnbnVtX2UgZW1haWwgcHJvZmlsZV9kIG1vc3ZjX2UgYXBpa3lfciB3YV90bXBfYyBzdHVkaW9fciB1c3JfZHcgbW9zdmNfciB3YV90bXBfZSB2cl9mbG1ncl9jIHZjX2ZsbWdyX2UgZW1haWxfY2ZnX2R3IHdhX2NtcGdfZSBlbWFpbF9jZmdfZSBzbXN0bXBfZCBibGFja2xpc3RfYyBzZGJ4X2Mgc25kX2Fkcl9jIHNtcHBfZCBhcGlkb2NfciB2Y19mbG1ncl9jIHdhX2NtcGdfZHcgdmNfY21wZ19kdyBzbXN0bXBfZSBybGNfZHcgbnVtbHNfYiBwcm9maWxlIHJvdXRpbmdfZCBjbnRtZ210X2MgY250bWdtdF9yIHNtc3RtcF9jIHdhX2NtcGdfYyBkbG9nX3IgcnNoZWV0X3IgcHJvZmlsZV9jIGFsZXJ0X2UgZW1haWxfY21wZ19kdyBzbXNfY21wZ19jIGNmZ2l2cl9kIG1vc3ZjX2QgY2ZnaXZyX2MgYWxvZ19yIHVzcl9lIHVzcl9jIGNudG1nbXRfZHcgZG5kX3Igc21wcF9jIGVtYWlsX2NtcGdfYyB3bHRtZ210X3QgZW1haWxfY2ZnX2MgZW1haWx0bXBfZSBhbGVydF9yIHZjX2NtcGdfciBwcm9maWxlX2UgcmxjX3IgdXNyX3N1IHdsdG1nbXRfYiBlbWFpbHRtcF9yIHJwdF9kdyBhcGlreV9lIHdhX3RtcF9kIHJsY19lIGVtYWlsdG1wX2R3IG51bWxzX2R3IHNtc19jbXBnX2UgY2ZnaXZyX2UgYmxhY2tsaXN0X2R3IHBja2dfdCBzbXBwX3IgdnJfZmxtZ3JfZSB2Y19mbG1ncl9kIG51bWxzX3IgZW1haWxfY2ZnX3IgcmxjX2MgZW1haWxfY2ZnX2QgdnJfZmxtZ3JfciBzbXN0bXBfciBtb3N2Y19jIHBja2dfYiByb3V0aW5nX2MgZG5kX2R3IGFsZXJ0X2QgdnJfZmxtZ3JfZCBlbWFpbHRtcF9jIHZjX2ZsbWdyX2R3IHdhX3RtcF9kdyBpbnZfZSBpbnZfciBlbWFpbF9jbXBnX3IgdmNfY21wZ19lIHJwdF9yIGNmZ251bV9yIHNkYnhfciBzbXN0bXBfZHcgYmxhY2tsaXN0X2Qgc3R1ZGlvX2MgZG5kX2QgaG1lX3IgcGNrZ19yIGNmZ2l2cl9yIGNudG1nbXRfZSBhcGlreV9jIHNtcHBfZSBwcm9maWxlX3IgdXNyX2Qgd2FfY21wZ19yIGJsYWNrbGlzdF9yIHZjX2NtcGdfYyBpbnZfZHcgcnNoZWV0X2R3IGNmZ251bV9jIiwic2lkIjoiODhmYjZhMDctZmI5NC00NGRjLWExOTEtZDhiYjg5ODZkYmU0IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImdyb3VwSWQiOlsiZjZlNjM4OTktZTY0Yy00Y2M0LWIwNmYtOGZlNTRlOWExNTIzIl0sIm5hbWUiOiJTRUxBQiBOQURJUlkgVE9VUklTTSBMTEMiLCJncm91cHMiOlsic2VsYWJuYWRpcnlkeGJAZ21haWwuY29tIl0sInByZWZlcnJlZF91c2VybmFtZSI6InNlbGFibmFkaXJ5ZHhiQGdtYWlsLmNvbSIsImdpdmVuX25hbWUiOiJTRUxBQiBOQURJUlkgVE9VUklTTSBMTEMiLCJlbWFpbCI6InNlbGFibmFkaXJ5ZHhiQGdtYWlsLmNvbSJ9.dbGQM5O7iSX_SaJazbHJoLhoa-s3if7LRF4tUM1CK1kGBSm3dXFKkZaSB-XskhZIUxHTajXMXIKtHbiIf601aE19j-f57hQZ3UzEbMr_VvsoPVLlIJnxvowH85kZc2uM8jpwGjdTLpp3ij0zTt2Ir-jcTWCHNiyCCz-1DHJFG5efvJmCLTkFXFMuVDkw_H9UTCoHgEO3JJJVWW_bXhkRl87POD9i68pXKrgYHXyD33ARxERVfAxnRZXSJjnytXCm7GBDAAOx-TeDIUR2LGJd1Mj1rqlpJvnucv4rxObbnu5-CYFLeYnQXRxAcpdO_l8id5Gp6u9ZoTE0rMLkGv5aFA';
$headers[] = 'Content-Type: application/json';
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Execute the request
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Check for cURL errors
if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error sending SMS: ' . curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

curl_close($ch);

// Return the API response
http_response_code($httpCode);
if ($httpCode === 200) {
    echo json_encode([
        'success' => true,
        'message' => 'SMS sent successfully',
        'data' => json_decode($result, true)
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to send SMS',
        'data' => json_decode($result, true)
    ]);
}

