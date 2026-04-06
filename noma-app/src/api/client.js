/**
 * API Client - Single Source of Truth for Network Requests
 * 
 * This is the centralized Axios client that ALL network requests must go through.
 * NO SCREEN OR COMPONENT should call Axios or fetch directly.
 * 
 * Features:
 * - Automatic JWT token attachment
 * - Request/response interceptors
 * - Error normalization
 * - Token expiry handling
 * - Request timing for debugging
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../config/env';
import logger from '../utils/logger';
import { normalizeAxiosError, AuthError, ERROR_CODES } from '../utils/errors';

// Storage keys
const TOKEN_KEY = '@nomaapp_token';
const REFRESH_TOKEN_KEY = '@nomaapp_refresh_token';

// Create Axios instance with base configuration
const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: env.REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Token management
let authToken = null;
let tokenRefreshPromise = null;
let onTokenExpiredCallback = null;


// Set callback for token expiration (used by auth service)

export const setOnTokenExpired = (callback) => {
  onTokenExpiredCallback = callback;
};


//  Set the authentication token

export const setAuthToken = async (token) => {
  authToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    logger.debug('Auth token set');
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
    logger.debug('Auth token cleared');
  }
};


// Get the current authentication token
 
export const getAuthToken = async () => {
  if (authToken) return authToken;
  
  try {
    const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      authToken = storedToken;
    }
    return authToken;
  } catch (error) {
    logger.error('Failed to get auth token', error);
    return null;
  }
};


//  Clear all authentication tokens
 
export const clearAuthTokens = async () => {
  authToken = null;
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
    logger.debug('Auth tokens cleared');
  } catch (error) {
    logger.error('Failed to clear auth tokens', error);
  }
};


//  Initialize client (call on app startup)

export const initializeClient = async () => {
  await getAuthToken();
  logger.info('API client initialized', { 
    baseURL: env.API_BASE_URL,
    hasToken: !!authToken 
  });
};

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Add request timing metadata
    config.metadata = { startTime: Date.now() };
    
    // Attach auth token if available
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request
    logger.apiRequest(config.method, config.url, config.data);
    
    return config;
  },
  (error) => {
    logger.error('Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = Date.now() - (response.config.metadata?.startTime || 0);
    
    // Log response
    logger.apiResponse(
      response.config.method,
      response.config.url,
      response.status,
      duration
    );
    
    // Return normalized data
    return response;
  },
  async (error) => {
    // Calculate request duration
    const duration = Date.now() - (error.config?.metadata?.startTime || 0);
    
    // Log error
    logger.apiResponse(
      error.config?.method || 'unknown',
      error.config?.url || 'unknown',
      error.response?.status || 0,
      duration
    );
    
    // Handle token expiration
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.error?.code;
      
      if (errorCode === 'TOKEN_EXPIRED' && onTokenExpiredCallback) {
        logger.warn('Token expired, triggering callback');
        await clearAuthTokens();
        onTokenExpiredCallback();
      }
    }
    
    // Normalize and reject with AppError
    const normalizedError = normalizeAxiosError(error);
    return Promise.reject(normalizedError);
  }
);


//  Make a GET request

export const get = async (url, config = {}) => {
  const response = await apiClient.get(url, config);
  return response.data;
};


//  Make a POST request

export const post = async (url, data = {}, config = {}) => {
  const response = await apiClient.post(url, data, config);
  return response.data;
};


//  Make a PUT request

export const put = async (url, data = {}, config = {}) => {
  const response = await apiClient.put(url, data, config);
  return response.data;
};


//  Make a PATCH request

export const patch = async (url, data = {}, config = {}) => {
  const response = await apiClient.patch(url, data, config);
  return response.data;
};


//  Make a DELETE request

export const del = async (url, config = {}) => {
  const response = await apiClient.delete(url, config);
  return response.data;
};


//  Upload file with multipart/form-data

export const uploadFile = async (url, formData, onProgress = null) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  
  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percentCompleted);
    };
  }
  
  const response = await apiClient.post(url, formData, config);
  return response.data;
};

// Export the raw client for special cases (use sparingly)
export const rawClient = apiClient;

export default {
  get,
  post,
  put,
  patch,
  del,
  uploadFile,
  setAuthToken,
  getAuthToken,
  clearAuthTokens,
  initializeClient,
  setOnTokenExpired,
};
