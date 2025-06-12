import { environments } from '../../public/env.config.js';

let currentEnvironment = null;

// Function to get environment from URL
const getEnvironmentFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('env');
  console.log('Environment from URL:', env);
  return env;
};

// Function to get environment from import.meta.env
const getEnvironmentFromVite = () => {
  const env = import.meta.env.VITE_APP_ENV;
  console.log('Environment from Vite:', env);
  return env;
};

// Function to validate environment
const isValidEnvironment = (env) => {
  console.log('Validating environment:', env);
  console.log('Available environments:', environments);
  return env && environments[env];
};

// Function to set current environment
export const setEnvironment = (env) => {
  console.log('Setting environment:', env);
  console.log('Current environments config:', environments);
  if (isValidEnvironment(env)) {
    localStorage.setItem('app_environment', env);
    currentEnvironment = env;
    console.log('Environment set to:', env);
    return env;
  }
  return null;
};

// Function to get current environment
export const getCurrentEnvironment = () => {
  if (currentEnvironment) {
    return currentEnvironment;
  }
  
  // Check URL first
  const urlEnv = getEnvironmentFromUrl();
  if (isValidEnvironment(urlEnv)) {
    console.log('Using environment from URL:', urlEnv);
    return setEnvironment(urlEnv);
  }

  // Check Vite env vars
  const viteEnv = getEnvironmentFromVite();
  if (isValidEnvironment(viteEnv)) {
    console.log('Using environment from Vite:', viteEnv);
    return setEnvironment(viteEnv);
  }

  // Default to development
  console.log('Using default environment: development');
  currentEnvironment = 'development';
  return currentEnvironment;
};

// Function to get API base URL
export const getApiBaseUrl = () => {
  const currentEnv = getCurrentEnvironment();
  console.log('Current environment for API URL:', currentEnv);
  console.log('Available environments:', environments);
  
  if (!environments) {
    console.error('Environments configuration is not loaded!');
    return 'http://localhost:8090'; // Fallback URL
  }

  const config = environments[currentEnv];
  if (!config) {
    console.error(`No configuration found for environment: ${currentEnv}`);
    return 'http://localhost:8090'; // Fallback URL
  }

  console.log('Getting API base URL for environment:', currentEnv);
  console.log('Environment config:', config);
  return config.VITE_HOTEL_API_BASE_URL;
};

// Export available environments for UI selection
export const getAvailableEnvironments = () => {
  return Object.keys(environments || {});
};