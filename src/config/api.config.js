import { environments } from './env.config';

// Obtener el ambiente actual
const getCurrentEnvironment = () => {
  return import.meta.env.MODE || 'development';
};

// Obtener la configuración del ambiente actual
const getConfig = () => {
  const env = getCurrentEnvironment();
  return environments[env] || environments.development;
};

// Configuración de endpoints por módulo
export const API_ENDPOINTS = {
  amenities: {
    base: '/api/amenities',
    getAll: (page, size, sort) => `/api/amenities?page=${page}&size=${size}${sort ? `&sort=${sort}` : ''}`,
    getById: (id) => `/api/amenities/${id}`,
    create: '/api/amenities',
    update: (id) => `/api/amenities/${id}`,
    delete: (id) => `/api/amenities/${id}`,
  },
  amenityTypes: {
    base: '/api/amenityType',
    getAll: (page, size) => `/api/amenityType?page=${page}&size=${size}`,
    getById: (id) => `/api/amenityType/${id}`,
    create: '/api/amenityType',
    update: (id) => `/api/amenityType/${id}`,
    delete: (id) => `/api/amenityType/${id}`,
  },
  hotels: {
    base: '/api/hotels',
    getAll: (page, size, sort) => `/api/hotels?page=${page}&size=${size}${sort ? `&sort=${sort}` : ''}`,
    getById: (id) => `/api/hotels/${id}`,
    create: '/api/hotels',
    update: (id) => `/api/hotels/${id}`,
    delete: (id) => `/api/hotels/${id}`,
  }
};

// Función para obtener la URL completa de un endpoint
export const getApiUrl = (endpoint) => {
  const config = getConfig();
  const baseUrl = config.VITE_HOTEL_API_BASE_URL;
  return `${baseUrl}${endpoint}`;
};

// Configuración por defecto para fetch
export const DEFAULT_FETCH_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Función helper para hacer llamadas a la API
export const apiCall = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const config = {
    ...DEFAULT_FETCH_CONFIG,
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'API Error'}. Body: ${errorBody}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

// Funciones específicas para cada módulo
export const amenitiesApi = {
  getAll: async (page = 0, size = 25, sort = '') => {
    return apiCall(API_ENDPOINTS.amenities.getAll(page, size, sort));
  },
  getById: async (id) => {
    return apiCall(API_ENDPOINTS.amenities.getById(id));
  },
  create: async (data) => {
    return apiCall(API_ENDPOINTS.amenities.create, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return apiCall(API_ENDPOINTS.amenities.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id) => {
    return apiCall(API_ENDPOINTS.amenities.delete(id), {
      method: 'DELETE',
    });
  },
};

export const amenityTypesApi = {
  getAll: async (page = 0, size = 25) => {
    return apiCall(API_ENDPOINTS.amenityTypes.getAll(page, size));
  },
  getById: async (id) => {
    return apiCall(API_ENDPOINTS.amenityTypes.getById(id));
  },
  create: async (data) => {
    return apiCall(API_ENDPOINTS.amenityTypes.create, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return apiCall(API_ENDPOINTS.amenityTypes.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id) => {
    return apiCall(API_ENDPOINTS.amenityTypes.delete(id), {
      method: 'DELETE',
    });
  },
}; 