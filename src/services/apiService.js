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

  // User Hotel Role specific methods
  userHotelRoles: {
    // Get all user hotel roles for a specific user
    getUserRoles: async (userId, getAccessTokenSilently) => {
      return apiService.get(`/user-hotel-roles/user/${userId}`, getAccessTokenSilently);
    },

    // Assign a role using the new hierarchical endpoint
    assignRole: async (assignRoleData, getAccessTokenSilently) => {
      return apiService.post('/user-hotel-roles/assign', assignRoleData, getAccessTokenSilently);
    },

    // Create a user hotel role (legacy method)
    create: async (userHotelRoleData, getAccessTokenSilently) => {
      return apiService.post('/user-hotel-roles', userHotelRoleData, getAccessTokenSilently);
    },

    // Get all user hotel roles
    getAll: async (getAccessTokenSilently) => {
      return apiService.get('/user-hotel-roles', getAccessTokenSilently);
    },

    // Delete a user hotel role
    delete: async (id, getAccessTokenSilently) => {
      return apiService.delete(`/user-hotel-roles/${id}`, getAccessTokenSilently);
    }
  },

  // Chain management methods
  chains: {
    getAll: async (getAccessTokenSilently) => {
      return apiService.get('/chain', getAccessTokenSilently);
    },

    getById: async (id, getAccessTokenSilently) => {
      return apiService.get(`/chain/${id}`, getAccessTokenSilently);
    }
  },

  // Brand management methods
  brands: {
    getAll: async (getAccessTokenSilently) => {
      return apiService.get('/brand', getAccessTokenSilently);
    },

    getById: async (id, getAccessTokenSilently) => {
      return apiService.get(`/brand/${id}`, getAccessTokenSilently);
    }
  },

  // Hotel management methods (enhanced)
  hotels: {
    getAll: async (getAccessTokenSilently) => {
      return apiService.get('/hotels/hotelList?page=0&size=1000', getAccessTokenSilently);
    },

    getById: async (id, getAccessTokenSilently) => {
      return apiService.get(`/hotels/${id}`, getAccessTokenSilently);
    }
  },

  // Role management methods
  roles: {
    getAll: async (getAccessTokenSilently) => {
      return apiService.get('/roles', getAccessTokenSilently);
    },

    getById: async (id, getAccessTokenSilently) => {
      return apiService.get(`/roles/${id}`, getAccessTokenSilently);
    }
  }
}; 