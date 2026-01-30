<?php
/**
 * WhatsApp API Configuration Template
 * 
 * INSTRUCTIONS FOR DEPLOYMENT:
 * 1. Copy this file to whatsapp-config.php
 * 2. Fill in your actual Twilio credentials
 * 3. Upload whatsapp-config.php to your server
 * 4. Never commit whatsapp-config.php to Git
 */

return [
    'twilio' => [
        'account_sid' => 'YOUR_TWILIO_ACCOUNT_SID',
        'auth_token' => 'YOUR_TWILIO_AUTH_TOKEN',
        'whatsapp_from' => 'whatsapp:+YOUR_WHATSAPP_NUMBER',
    ],
    'templates' => [
        'auth' => 'YOUR_AUTH_TEMPLATE_SID',
        'appointment' => 'YOUR_APPOINTMENT_TEMPLATE_SID',
    ]
];
