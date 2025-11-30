/**
 * Phone Number Formatter Utility
 * Formats phone numbers to Etisalat/API standard: 971XXXXXXXXX
 * Country code without + and without leading 0
 */

export interface PhoneFormatOptions {
  defaultCountryCode?: string;
  allowedCountryCodes?: string[];
}

const DEFAULT_COUNTRY_CODE = '971'; // UAE
const ALLOWED_COUNTRY_CODES = ['971', '966', '965', '973', '968', '974']; // GCC countries

/**
 * Format phone number to API standard (971XXXXXXXXX)
 * @param phone - Input phone number (can include +, spaces, dashes, etc.)
 * @param options - Formatting options
 * @returns Formatted phone number or empty string if invalid
 */
export function formatPhoneNumber(
  phone: string,
  options: PhoneFormatOptions = {}
): string {
  if (!phone) return '';

  const { defaultCountryCode = DEFAULT_COUNTRY_CODE } = options;

  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // If empty after cleaning, return empty
  if (!cleaned) return '';

  // Handle different input formats
  
  // If starts with 00, remove it (international format)
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // If starts with 0 and length suggests local number (e.g., 0501234567 for UAE)
  if (cleaned.startsWith('0') && cleaned.length >= 10 && cleaned.length <= 11) {
    // Remove leading 0 and add default country code
    cleaned = defaultCountryCode + cleaned.substring(1);
  }

  // If it doesn't start with a country code, add default
  if (!startsWithCountryCode(cleaned)) {
    // If number is 9 digits (UAE local format), add country code
    if (cleaned.length === 9) {
      cleaned = defaultCountryCode + cleaned;
    }
  }

  // Validate final format
  if (isValidFormattedPhone(cleaned)) {
    return cleaned;
  }

  return '';
}

/**
 * Check if phone starts with a known country code
 */
function startsWithCountryCode(phone: string): boolean {
  return ALLOWED_COUNTRY_CODES.some(code => phone.startsWith(code));
}

/**
 * Validate if phone number is in correct format
 * Should be: country code (3 digits) + phone number (9 digits) = 12 digits total
 */
export function isValidFormattedPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Must be numeric only
  if (!/^\d+$/.test(phone)) return false;

  // Check if it starts with an allowed country code
  const hasValidCountryCode = ALLOWED_COUNTRY_CODES.some(code => 
    phone.startsWith(code)
  );

  if (!hasValidCountryCode) return false;

  // Should be 12 digits total (country code 3 + number 9)
  // Allow some flexibility for different country formats (11-13 digits)
  return phone.length >= 11 && phone.length <= 13;
}

/**
 * Display phone number in a user-friendly format
 * 971XXXXXXXXX -> +971 XX XXX XXXX
 */
export function displayPhoneNumber(phone: string): string {
  if (!phone || !isValidFormattedPhone(phone)) return phone;

  // Extract country code (first 3 digits)
  const countryCode = phone.substring(0, 3);
  const remaining = phone.substring(3);

  // Format remaining digits based on length
  if (remaining.length === 9) {
    // UAE format: +971 XX XXX XXXX
    return `+${countryCode} ${remaining.substring(0, 2)} ${remaining.substring(2, 5)} ${remaining.substring(5)}`;
  }

  // Default format
  return `+${countryCode} ${remaining}`;
}

/**
 * Validate phone number input while typing
 * Returns error message or null if valid
 */
export function validatePhoneInput(phone: string): string | null {
  if (!phone) return 'Phone number is required';

  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 9) {
    return 'Phone number is too short';
  }

  if (cleaned.length > 15) {
    return 'Phone number is too long';
  }

  return null;
}

/**
 * Auto-format phone as user types
 * Provides real-time formatting feedback
 */
export function autoFormatPhone(
  input: string,
  previousValue: string = ''
): string {
  // Remove all non-numeric characters
  let cleaned = input.replace(/\D/g, '');

  // If deleting, allow it
  if (cleaned.length < previousValue.replace(/\D/g, '').length) {
    return input;
  }

  // Auto-add country code if starting fresh
  if (cleaned.length === 1 && cleaned !== '9') {
    // If not starting with 9 (for 971), add 971 prefix
    cleaned = '971' + cleaned;
  }

  // Format as: 971 XX XXX XXXX
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 5) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  } else if (cleaned.length <= 8) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.length <= 12) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 12)}`;
  }

  // Limit to 12 digits
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 12)}`;
}

/**
 * Get country info from phone number
 */
export function getCountryFromPhone(phone: string): { code: string; name: string } | null {
  const cleaned = phone.replace(/\D/g, '');
  
  const countryMap: Record<string, string> = {
    '971': 'UAE',
    '966': 'Saudi Arabia',
    '965': 'Kuwait',
    '973': 'Bahrain',
    '968': 'Oman',
    '974': 'Qatar'
  };

  for (const [code, name] of Object.entries(countryMap)) {
    if (cleaned.startsWith(code)) {
      return { code, name };
    }
  }

  return null;
}

