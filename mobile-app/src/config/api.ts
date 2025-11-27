// API Configuration
export const API_CONFIG = {
  // PRODUCTION - Using Cloudflare protected domain with real data
  BASE_URL: 'https://rest.sntrips.com/api',
  
  // ALTERNATIVE PRODUCTION URLs (comment/uncomment as needed):
  // BASE_URL: 'https://app.sntrips.com/api',
  // BASE_URL: 'https://admin.sntrips.com/api',
  
  // LOCAL DEVELOPMENT - For testing with XAMPP on same Mac:
  // BASE_URL: 'http://admin.sntrips.com/api',
  // BASE_URL: 'http://localhost/snt/api',

  // For physical device on same network, use your Mac's IP address:
  // BASE_URL: 'http://192.168.1.149/snt/api',

  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;
