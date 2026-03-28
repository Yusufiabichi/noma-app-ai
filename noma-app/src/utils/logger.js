/**
 * Logger Utility
 * 
 * Centralized logging for the application.
 * Handles different log levels with different formatting.
 */

const isDevelopment = __DEV__; // Expo environment variable

const LOG_LEVEL = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

/**
 * Format log message with timestamp and level
 */
const formatLog = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  
  if (data) {
    return `${prefix} ${message} ${JSON.stringify(data)}`;
  }
  return `${prefix} ${message}`;
};

/**
 * Log debug message (development only)
 */
const debug = (message, data = null) => {
  if (isDevelopment) {
    console.log(formatLog(LOG_LEVEL.DEBUG, message, data));
  }
};

/**
 * Log info message
 */
const info = (message, data = null) => {
  console.log(formatLog(LOG_LEVEL.INFO, message, data));
};

/**
 * Log warning message
 */
const warn = (message, data = null) => {
  console.warn(formatLog(LOG_LEVEL.WARN, message, data));
};

/**
 * Log error message
 */
const error = (message, errorObject = null) => {
  console.error(formatLog(LOG_LEVEL.ERROR, message, errorObject));
};

/**
 * Log API request
 */
const apiRequest = (method, url, data = null) => {
  const logData = { method: method?.toUpperCase(), url };
  if (data && Object.keys(data).length > 0) {
    logData.payload = data;
  }
  debug('API Request', logData);
};

/**
 * Log API response
 */
const apiResponse = (method, url, status, duration) => {
  const logData = {
    method: method?.toUpperCase(),
    url,
    status,
    duration: `${duration}ms`,
  };
  
  const isError = status >= 400;
  const logFn = isError ? warn : debug;
  logFn('API Response', logData);
};

export default {
  debug,
  info,
  warn,
  error,
  apiRequest,
  apiResponse,
};
