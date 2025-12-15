/**
 * Utility function to get airline logo URL from flight number
 * Uses free CDN services for airline logos
 */

/**
 * Extract airline code from flight number
 * Examples: "EK 123" -> "EK", "PK 456" -> "PK", "EK123" -> "EK"
 */
export const getAirlineCode = (flightNumber: string | null | undefined): string | null => {
  if (!flightNumber || flightNumber.trim() === '') return null;
  
  // Remove spaces and extract first 2-3 letters
  const cleaned = flightNumber.trim().replace(/\s+/g, '');
  const match = cleaned.match(/^([A-Z]{2,3})/i);
  return match ? match[1].toUpperCase() : null;
};

/**
 * Get airline logo URL from airline code
 * Uses multiple free CDN sources with fallback
 */
export const getAirlineLogoUrl = (airlineCode: string | null): string | null => {
  if (!airlineCode) return null;
  
  // Using FlightRadar24 CDN - more reliable and free
  // Format: https://www.flightradar24.com/static/images/data/operators/{CODE}_logo0.png
  return `https://www.flightradar24.com/static/images/data/operators/${airlineCode}_logo0.png`;
};

/**
 * Get airline logo with fallback
 * Returns the logo URL or null if not available
 */
export const getAirlineLogo = (flightNumber: string | null | undefined): string | null => {
  const code = getAirlineCode(flightNumber);
  return code ? getAirlineLogoUrl(code) : null;
};

/**
 * Common airline codes mapping for reference
 */
export const COMMON_AIRLINES: Record<string, string> = {
  'EK': 'Emirates',
  'PK': 'Pakistan International Airlines',
  'QR': 'Qatar Airways',
  'EY': 'Etihad Airways',
  'SV': 'Saudi Arabian Airlines',
  'GF': 'Gulf Air',
  'FZ': 'Flydubai',
  'WY': 'Oman Air',
  'KU': 'Kuwait Airways',
  'MS': 'EgyptAir',
  'RJ': 'Royal Jordanian',
  'TK': 'Turkish Airlines',
  'BA': 'British Airways',
  'LH': 'Lufthansa',
  'AF': 'Air France',
  'KL': 'KLM',
  'LX': 'Swiss International Air Lines',
  'OS': 'Austrian Airlines',
  'SN': 'Brussels Airlines',
  'IB': 'Iberia',
  'TP': 'TAP Air Portugal',
  'AA': 'American Airlines',
  'UA': 'United Airlines',
  'DL': 'Delta Air Lines',
  'AC': 'Air Canada',
  'QF': 'Qantas',
  'SQ': 'Singapore Airlines',
  'CX': 'Cathay Pacific',
  'TG': 'Thai Airways',
  'MH': 'Malaysia Airlines',
  'GA': 'Garuda Indonesia',
  'JL': 'Japan Airlines',
  'NH': 'All Nippon Airways',
  'KE': 'Korean Air',
  'OZ': 'Asiana Airlines',
  'CI': 'China Airlines',
  'BR': 'EVA Air',
  'CA': 'Air China',
  'MU': 'China Eastern Airlines',
  'CZ': 'China Southern Airlines',
  'AI': 'Air India',
  '9W': 'Jet Airways',
  '6E': 'IndiGo',
  'SG': 'SpiceJet',
  'UK': 'Vistara',
};

