export const environments = {
    development: {
      VITE_APP_TITLE: 'React Gemini App (Development)',
      VITE_API_URL: 'http://localhost:5173'
    },
    test: {
      VITE_APP_TITLE: 'React Gemini App (Test)',
      VITE_API_URL: 'http://localhost:8180'
    },
    production: {
      VITE_APP_TITLE: 'React Gemini App (Production)',
      VITE_API_URL: 'http://localhost:8190'
    }
  };
  
  export const getEnvironmentConfig = (env = 'development') => {
    return environments[env] || environments.development;
  };