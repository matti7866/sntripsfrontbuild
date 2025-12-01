// Application Configuration
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://app.sntrips.com/api',
  baseUrl: import.meta.env.VITE_BASE_URL || 'https://app.sntrips.com',
  appName: import.meta.env.VITE_APP_NAME || 'Selab Nadiry',
  appVersion: import.meta.env.VITE_APP_VERSION || '2.0.0',
  tokenKey: 'snt_auth_token',
  userKey: 'snt_user_data',
  flightRadar24ApiKey: import.meta.env.VITE_FLIGHTRADAR24_API_KEY || '019ada0d-01b6-7345-90f8-0e34db2dd9a4|bQ9fMxameIRy70eSWy8RsB5niMKChyxb325sKip913459946',
};

export default config;














