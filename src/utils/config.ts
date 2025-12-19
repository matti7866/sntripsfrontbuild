// Application Configuration
// Auto-detect development environment
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || (isDevelopment ? 'http://localhost/snt/api' : 'https://app.sntrips.com/api'),
  baseUrl: import.meta.env.VITE_BASE_URL || (isDevelopment ? 'http://localhost/snt' : 'https://app.sntrips.com'),
  appName: import.meta.env.VITE_APP_NAME || 'Selab Nadiry',
  appVersion: import.meta.env.VITE_APP_VERSION || '2.0.0',
  tokenKey: 'snt_auth_token',
  userKey: 'snt_user_data',
  // FlightRadar24 (for live tracking only)
  flightRadar24ApiKey: import.meta.env.VITE_FLIGHTRADAR24_API_KEY || '019ada0d-01b6-7345-90f8-0e34db2dd9a4|bQ9fMxameIRy70eSWy8RsB5niMKChyxb325sKip913459946',
  // Amadeus (for flight schedules)
  amadeusApiKey: import.meta.env.VITE_AMADEUS_API_KEY || 'rA2tBaCri6vD6NryFOnOwrz51Zm3aClC',
  amadeusApiSecret: import.meta.env.VITE_AMADEUS_API_SECRET || 'Yd0BrUEasrEu3YA5',
  // AviationStack (for flight schedules - free tier)
  aviationstackApiKey: import.meta.env.VITE_AVIATIONSTACK_API_KEY || '5f42068dae82e0d9061615522f0209f5',
};

// Log config in development
if (isDevelopment) {
  console.log('🔧 Development Config:', {
    apiBaseUrl: config.apiBaseUrl,
    baseUrl: config.baseUrl,
    isDevelopment
  });
}

export default config;














