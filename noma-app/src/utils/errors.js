/**
 * Error Handling Utilities
 * 
 * Centralized error handling and normalization for API responses.
 */

/**
 * Error codes standardized across the application
 */
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  NO_INTERNET: 'NO_INTERNET',
  
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  
  // Client errors
  BAD_REQUEST: 'BAD_REQUEST',
  FORBIDDEN: 'FORBIDDEN',
  
  // Unknown
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

/**
 * Custom Error class for application errors
 */
export class AppError extends Error {
  constructor(code, message, statusCode = null, originalError = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.name = 'AppError';
  }
}

/**
 * Custom class for authentication-related errors
 */
export class AuthError extends AppError {
  constructor(message, code = ERROR_CODES.UNAUTHORIZED, statusCode = 401) {
    super(code, message, statusCode);
    this.name = 'AuthError';
  }
}

/**
 * Normalize Axios errors into AppError instances
 * 
 * @param {Error} error - The error from axios
 * @returns {AppError} - Normalized application error
 */
export const normalizeAxiosError = (error) => {
  // Check if error has response (API responded with error status)
  if (error.response) {
    const { status, data } = error.response;
    
    // Extract error code and message from response
    const errorCode = data?.error?.code || data?.code || getErrorCodeFromStatus(status);
    const errorMessage = data?.error?.message || data?.message || getErrorMessageFromStatus(status);
    
    // Handle specific status codes
    if (status === 401) {
      return new AuthError(errorMessage, ERROR_CODES.TOKEN_EXPIRED, status);
    }
    
    if (status === 403) {
      return new AppError(ERROR_CODES.FORBIDDEN, errorMessage, status, error);
    }
    
    if (status === 404) {
      return new AppError(ERROR_CODES.NOT_FOUND, errorMessage, status, error);
    }
    
    if (status === 409) {
      return new AppError(ERROR_CODES.CONFLICT, errorMessage, status, error);
    }
    
    if (status === 422) {
      return new AppError(ERROR_CODES.VALIDATION_ERROR, errorMessage, status, error);
    }
    
    if (status >= 500) {
      return new AppError(ERROR_CODES.SERVER_ERROR, errorMessage, status, error);
    }
    
    if (status >= 400) {
      return new AppError(ERROR_CODES.BAD_REQUEST, errorMessage, status, error);
    }
  }
  
  // Check for timeout
  if (error.code === 'ECONNABORTED' || error.message === 'timeout of 30000ms exceeded') {
    return new AppError(ERROR_CODES.TIMEOUT_ERROR, 'Request timeout', null, error);
  }
  
  // Check for network errors
  if (error.message === 'Network Error' || !error.response) {
    return new AppError(ERROR_CODES.NETWORK_ERROR, 'Network connection failed', null, error);
  }
  
  // Unknown error
  return new AppError(ERROR_CODES.UNKNOWN_ERROR, error.message || 'An unknown error occurred', null, error);
};

/**
 * Get error code from HTTP status
 */
const getErrorCodeFromStatus = (status) => {
  switch (status) {
    case 400:
      return ERROR_CODES.BAD_REQUEST;
    case 401:
      return ERROR_CODES.UNAUTHORIZED;
    case 403:
      return ERROR_CODES.FORBIDDEN;
    case 404:
      return ERROR_CODES.NOT_FOUND;
    case 409:
      return ERROR_CODES.CONFLICT;
    case 422:
      return ERROR_CODES.VALIDATION_ERROR;
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_CODES.SERVER_ERROR;
    default:
      return ERROR_CODES.UNKNOWN_ERROR;
  }
};

/**
 * Get human-readable error message from HTTP status
 */
const getErrorMessageFromStatus = (status) => {
  const statusMessages = {
    400: 'Bad request',
    401: 'Unauthorized - please log in',
    403: 'Forbidden - you do not have access',
    404: 'Resource not found',
    409: 'Conflict - the request conflicts with existing data',
    422: 'Validation error - please check your input',
    500: 'Server error - please try again later',
    502: 'Bad gateway - server temporarily unavailable',
    503: 'Service unavailable - please try again later',
    504: 'Gateway timeout - server took too long to respond',
  };
  
  return statusMessages[status] || 'An error occurred';
};

export default {
  ERROR_CODES,
  AppError,
  AuthError,
  normalizeAxiosError,
};
