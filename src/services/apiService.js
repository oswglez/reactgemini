import { useAuth0 } from "@auth0/auth0-react";
import { getApiBaseUrl } from './config';
import { useCallback } from "react";

// Hook para fetch autenticado
export const useAuthenticatedFetch = () => {
  const { getAccessTokenSilently } = useAuth0();

  // Memoiza la función para evitar loops en useEffect
  const authenticatedFetch = useCallback(async (endpoint, options = {}) => {
    const token = await getAccessTokenSilently();
    const baseUrl = getApiBaseUrl();
    const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    };

    return fetch(url, config);
  }, [getAccessTokenSilently]);

  return authenticatedFetch;
};

// Utility function to create API URL
export const createApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Common API methods with authentication
export const apiService = {
  get: async (endpoint, getAccessTokenSilently) => {
    const token = await getAccessTokenSilently();
    const url = createApiUrl(endpoint);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  post: async (endpoint, data, getAccessTokenSilently) => {
    const token = await getAccessTokenSilently();
    const url = createApiUrl(endpoint);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  put: async (endpoint, data, getAccessTokenSilently) => {
    const token = await getAccessTokenSilently();
    const url = createApiUrl(endpoint);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  delete: async (endpoint, getAccessTokenSilently) => {
    const token = await getAccessTokenSilently();
    const url = createApiUrl(endpoint);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
}; 