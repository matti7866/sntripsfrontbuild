<?php
/**
 * Emirates ID OCR Service
 * Extracts data from Emirates ID front and back images
 * Uses OCR.space free API
 */

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

/**
 * Extract Emirates ID data from OCR text
 */
function extractEmiratesIDData($text, $side = 'front') {
    $data = [];
    
    if ($side === 'front') {
        // Extract EID Number (format: 784-XXXX-XXXXXXX-X)
        if (preg_match('/784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d/', $text, $matches)) {
            $data['eid_number'] = preg_replace('/\s/', '-', $matches[0]);
        }
        
        // Extract Name (usually in Arabic and English, we want English - all caps line)
        if (preg_match('/Name[:\s]*\n?([A-Z\s]+)/', $text, $matches)) {
            $data['full_name'] = trim($matches[1]);
        } else if (preg_match('/([A-Z]{2,}\s[A-Z\s]+)/', $text, $matches)) {
            $possibleName = trim($matches[1]);
            if (strlen($possibleName) > 10 && strlen($possibleName) < 100) {
                $data['full_name'] = $possibleName;
            }
        }
        
        // Extract Gender
        if (preg_match('/\b(Male|Female|M|F)\b/i', $text, $matches)) {
            $gender = strtolower($matches[1]);
            $data['gender'] = ($gender === 'm' || $gender === 'male') ? 'male' : 'female';
        }
        
        // Extract Date of Birth (DD/MM/YYYY or DD-MM-YYYY)
        if (preg_match('/(?:Date of Birth|DOB|Birth)[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/', $text, $matches)) {
            $data['dob'] = convertToMySQLDate($matches[1]);
        } else if (preg_match('/\b(\d{2}[-\/]\d{2}[-\/]\d{4})\b/', $text, $matches)) {
            // Try to find any date that could be DOB
            $possibleDate = $matches[1];
            $data['dob_raw'] = $possibleDate;
        }
        
        // Extract Issue Date
        if (preg_match('/(?:Issue Date|Issued)[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/', $text, $matches)) {
            $data['issue_date'] = convertToMySQLDate($matches[1]);
        }
        
        // Extract Expiry Date
        if (preg_match('/(?:Expiry Date|Expiry|Valid Until)[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/', $text, $matches)) {
            $data['expiry_date'] = convertToMySQLDate($matches[1]);
        }
    } else if ($side === 'back') {
        // Extract Profession/Occupation
        if (preg_match('/(?:Profession|Occupation)[:\s]*\n?([A-Za-z\s]+)/', $text, $matches)) {
            $data['profession'] = trim($matches[1]);
        }
        
        // Extract Establishment Name
        if (preg_match('/(?:Company|Establishment|Employer|Work Place)[:\s]*\n?([A-Z\s&]+)/', $text, $matches)) {
            $data['establishment'] = trim($matches[1]);
        } else if (preg_match('/([A-Z]{3,}[\sA-Z&]+(?:LLC|LTD|CO|COMPANY|ESTABLISHMENT))/', $text, $matches)) {
            $data['establishment'] = trim($matches[1]);
        }
    }
    
    return $data;
}

/**
 * Convert date from DD/MM/YYYY to YYYY-MM-DD
 */
function convertToMySQLDate($date) {
    $parts = preg_split('/[-\/]/', $date);
    if (count($parts) === 3) {
        return $parts[2] . '-' . $parts[1] . '-' . $parts[0];
    }
    return $date;
}

/**
 * Perform OCR using OCR.space API
 */
function performOCR($imageBase64) {
    $apiKey = 'K88210773288957'; // Free OCR.space API key - replace with your own
    $apiUrl = 'https://api.ocr.space/parse/image';
    
    $postData = [
        'base64Image' => $imageBase64,
        'language' => 'eng',
        'isOverlayRequired' => false,
        'detectOrientation' => true,
        'scale' => true,
        'OCREngine' => 2  // Use Engine2 for better accuracy
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $apiKey
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        throw new Exception('OCR API Error: ' . $curlError);
    }
    
    if ($httpCode !== 200) {
        throw new Exception('OCR API returned error: ' . $httpCode);
    }
    
    $result = json_decode($response, true);
    
    if (!$result || $result['IsErroredOnProcessing']) {
        $errorMsg = $result['ErrorMessage'][0] ?? 'Unknown OCR error';
        throw new Exception('OCR Processing Error: ' . $errorMsg);
    }
    
    return $result['ParsedResults'][0]['ParsedText'] ?? '';
}

try {
    // Check if files were uploaded
    if (!isset($_FILES['front']) && !isset($_FILES['back'])) {
        throw new Exception('No image files provided');
    }
    
    $extractedData = [
        'success' => true,
        'front' => [],
        'back' => []
    ];
    
    // Process front image
    if (isset($_FILES['front']) && $_FILES['front']['error'] === UPLOAD_ERR_OK) {
        $frontImageData = file_get_contents($_FILES['front']['tmp_name']);
        $frontBase64 = 'data:image/jpeg;base64,' . base64_encode($frontImageData);
        
        try {
            $frontText = performOCR($frontBase64);
            $extractedData['front'] = extractEmiratesIDData($frontText, 'front');
            $extractedData['front_raw_text'] = $frontText; // For debugging
        } catch (Exception $e) {
            $extractedData['front_error'] = $e->getMessage();
        }
    }
    
    // Process back image
    if (isset($_FILES['back']) && $_FILES['back']['error'] === UPLOAD_ERR_OK) {
        $backImageData = file_get_contents($_FILES['back']['tmp_name']);
        $backBase64 = 'data:image/jpeg;base64,' . base64_encode($backImageData);
        
        try {
            $backText = performOCR($backBase64);
            $extractedData['back'] = extractEmiratesIDData($backText, 'back');
            $extractedData['back_raw_text'] = $backText; // For debugging
        } catch (Exception $e) {
            $extractedData['back_error'] = $e->getMessage();
        }
    }
    
    echo json_encode($extractedData);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

