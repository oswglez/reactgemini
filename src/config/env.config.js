export const environments = {
  development: {
    VITE_APP_TITLE: 'React Gemini App (Development)',
    VITE_API_URL: 'http://localhost:5173',
    VITE_HOTEL_API_BASE_URL: 'http://localhost:8090'
  },
  test: {
    VITE_APP_TITLE: 'React Gemini App (Test)',
    VITE_API_URL: 'http://localhost:8180',
    VITE_HOTEL_API_BASE_URL: 'http://localhost:8090'
  },
  production: {
    VITE_APP_TITLE: 'React Gemini App (Production)',
    VITE_API_URL: 'http://localhost:8190',
    VITE_HOTEL_API_BASE_URL: 'https://expectraai.com'
  }
};

export const getEnvironmentConfig = (env = 'development') => {
  return environments[env] || environments.development;
}; 