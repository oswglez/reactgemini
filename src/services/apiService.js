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
    
    console.log('=== API SERVICE - POST REQUEST ===');
    console.log('URL:', url);
    console.log('Endpoint:', endpoint);
    console.log('Data being sent:', data);
    console.log('Data type:', typeof data);
    console.log('Data stringified:', JSON.stringify(data, null, 2));
    console.log('=== END API SERVICE LOGGING ===');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      console.error('=== API SERVICE - ERROR RESPONSE ===');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('URL:', response.url);
      try {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
      } catch {
        console.error('Could not read error response body');
      }
      console.error('=== END ERROR LOGGING ===');
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
    // Solo intenta parsear JSON si hay contenido
    if (response.status !== 204 && response.headers.get('content-length') !== '0') {
      try {
        return await response.json();
      } catch {
        // Si no hay JSON, retorna null
        return null;
      }
    }
    return null;
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

  // User context and permissions methods
  userContext: {
    // Get user context for a specific hotel
    getForHotel: async (hotelId, getAccessTokenSilently) => {
      return apiService.get(`/auth/user-context?hotelId=${hotelId}`, getAccessTokenSilently);
    },

    // Get current user context
    getCurrent: async (getAccessTokenSilently) => {
      return apiService.get('/auth/user-context', getAccessTokenSilently);
    },

    // Check if user can edit hotels based on their roles
    canEditHotel: (userContext) => {
      if (!userContext || !userContext.currentRoles || userContext.currentRoles.length === 0) {
        return false;
      }

      // Define roles that can edit hotels (HOTEL_ADMIN and above)
      const editableRoles = ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN', 'HOTEL_ADMIN'];
      
      // Check if user has any of the editable roles
      return userContext.currentRoles.some(role => 
        editableRoles.includes(role.roleName)
      );
    },

    // Check if user can delete hotels based on their roles
    canDeleteHotel: (userContext) => {
      if (!userContext || !userContext.currentRoles || userContext.currentRoles.length === 0) {
        return false;
      }

      // Define roles that can delete hotels (HOTEL_ADMIN and above)
      const deletableRoles = ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN', 'HOTEL_ADMIN'];
      
      // Check if user has any of the deletable roles
      return userContext.currentRoles.some(role => 
        deletableRoles.includes(role.roleName)
      );
    },

    // Get the highest role level for display purposes
    getHighestRoleLevel: (userContext) => {
      if (!userContext || !userContext.currentRoles || userContext.currentRoles.length === 0) {
        return 'NO_ROLE';
      }

      const roleHierarchy = {
        'SUPER_USER': 7,
        'CHAIN_ADMIN': 6,
        'BRAND_ADMIN': 5,
        'HOTEL_ADMIN': 4,
        'HOTEL_MANAGER': 3,
        'HOTEL_STAFF': 2,
        'HOTEL_VIEWER': 1
      };

      let highestRole = 'HOTEL_VIEWER';
      let highestLevel = 1;

      userContext.currentRoles.forEach(role => {
        const level = roleHierarchy[role.roleName] || 0;
        if (level > highestLevel) {
          highestLevel = level;
          highestRole = role.roleName;
        }
      });

      return highestRole;
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
    getAll: async (page = 0, size = 1000, getAccessTokenSilently) => {
      return apiService.get(`/hotels/hotelList?page=${page}&size=${size}`, getAccessTokenSilently);
    },

    getById: async (id, getAccessTokenSilently) => {
      return apiService.get(`/hotels/${id}`, getAccessTokenSilently);
    }
  },

  // Role management methods
  roles: {
    getAll: async (page = 0, size = 25, getAccessTokenSilently) => {
      return apiService.get(`/roles?page=${page}&size=${size}`, getAccessTokenSilently);
    },

    getById: async (id, getAccessTokenSilently) => {
      return apiService.get(`/roles/${id}`, getAccessTokenSilently);
    },

    create: async (roleData, getAccessTokenSilently) => {
      return apiService.post('/roles', roleData, getAccessTokenSilently);
    },

    update: async (id, roleData, getAccessTokenSilently) => {
      return apiService.put(`/roles/${id}`, roleData, getAccessTokenSilently);
    },

    delete: async (id, getAccessTokenSilently) => {
      return apiService.delete(`/roles/${id}`, getAccessTokenSilently);
    }
  },

  // Media Type management methods
  mediaTypes: {
    getAll: async (page = 0, size = 25, getAccessTokenSilently) => {
      return apiService.get(`/mediaType?page=${page}&size=${size}`, getAccessTokenSilently);
    },
    delete: async (id, getAccessTokenSilently) => {
      return apiService.delete(`/mediaType/${id}`, getAccessTokenSilently);
    }
  },

  // Amenity Type management methods
  amenityTypes: {
    getAll: async (page = 0, size = 25, getAccessTokenSilently) => {
      return apiService.get(`/amenityType?page=${page}&size=${size}`, getAccessTokenSilently);
    },
    delete: async (id, getAccessTokenSilently) => {
      return apiService.delete(`/amenityType/${id}`, getAccessTokenSilently);
    }
  },

  // Room Type management methods
  roomTypes: {
    getAll: async (page = 0, size = 25, getAccessTokenSilently) => {
      return apiService.get(`/roomType?page=${page}&size=${size}`, getAccessTokenSilently);
    },
    delete: async (id, getAccessTokenSilently) => {
      return apiService.delete(`/roomType/${id}`, getAccessTokenSilently);
    }
  },

  // Amenities management methods
  amenities: {
    getAll: async (page = 0, size = 25, getAccessTokenSilently) => {
      return apiService.get(`/amenities?page=${page}&size=${size}`, getAccessTokenSilently);
    },

    getById: async (id, getAccessTokenSilently) => {
      return apiService.get(`/amenities/${id}`, getAccessTokenSilently);
    },

    getByType: async (type, page = 0, size = 25, getAccessTokenSilently) => {
      return apiService.get(`/amenities/type/${type}?page=${page}&size=${size}`, getAccessTokenSilently);
    },

    create: async (amenityData, getAccessTokenSilently) => {
      return apiService.post('/amenities', amenityData, getAccessTokenSilently);
    },

    update: async (id, amenityData, getAccessTokenSilently) => {
      return apiService.put(`/amenities/${id}`, amenityData, getAccessTokenSilently);
    },

    delete: async (id, getAccessTokenSilently) => {
      return apiService.delete(`/amenities/${id}`, getAccessTokenSilently);
    }
  },

  // Room Units management methods
  roomUnits: {
    // Get all rooms with pagination
    getAll: async (page = 0, size = 25, getAccessTokenSilently) => {
      return apiService.get(`/rooms?page=${page}&size=${size}`, getAccessTokenSilently);
    },

    // Get all rooms for a specific hotel with pagination
    getByHotel: async (hotelId, page = 0, size = 25, getAccessTokenSilently) => {
      return apiService.get(`/rooms/hotel/${hotelId}?page=${page}&size=${size}`, getAccessTokenSilently);
    },

    // Get all rooms for a specific hotel with DTO format
    getByHotelId: async (hotelId, getAccessTokenSilently) => {
      return apiService.get(`/hotels/${hotelId}/roomsDTO`, getAccessTokenSilently);
    },

    // Get all rooms for a hotel with pagination
    getByHotelIdPaginated: async (hotelId, page = 0, size = 25, getAccessTokenSilently) => {
      return apiService.get(`/rooms/hotel/${hotelId}?page=${page}&size=${size}`, getAccessTokenSilently);
    },

    // Get a specific room by ID
    getById: async (roomId, getAccessTokenSilently) => {
      return apiService.get(`/rooms/${roomId}`, getAccessTokenSilently);
    },

    // Create a new room for a hotel
    // FIXED: Use the correct endpoint that exists in the backend
    create: async (hotelId, roomData, getAccessTokenSilently) => {
      return apiService.post(`/rooms/${hotelId}`, roomData, getAccessTokenSilently);
    },

    // Update a room
    update: async (roomId, roomData, getAccessTokenSilently) => {
      return apiService.put(`/rooms/${roomId}`, roomData, getAccessTokenSilently);
    },

    // Delete a room
    delete: async (roomId, getAccessTokenSilently) => {
      return apiService.delete(`/rooms/${roomId}`, getAccessTokenSilently);
    },

    // Get room amenities
    getAmenities: async (hotelId, roomId, getAccessTokenSilently) => {
      return apiService.get(`/rooms/${hotelId}/roomId/${roomId}/amenities`, getAccessTokenSilently);
    },

    // Get room media
    getMedia: async (hotelId, roomId, getAccessTokenSilently) => {
      return apiService.get(`/rooms/${hotelId}/roomId/${roomId}/media`, getAccessTokenSilently);
    }
  },

  // Users management methods
  users: {
    getAll: async (page = 0, size = 25, getAccessTokenSilently) => {
      return apiService.get(`/users?page=${page}&size=${size}`, getAccessTokenSilently);
    },

    getById: async (id, getAccessTokenSilently) => {
      return apiService.get(`/users/${id}`, getAccessTokenSilently);
    },

    create: async (userData, getAccessTokenSilently) => {
      return apiService.post('/users', userData, getAccessTokenSilently);
    },

    update: async (id, userData, getAccessTokenSilently) => {
      return apiService.put(`/users/${id}`, userData, getAccessTokenSilently);
    },

    delete: async (id, getAccessTokenSilently) => {
      return apiService.delete(`/users/${id}`, getAccessTokenSilently);
    }
  },


}; 