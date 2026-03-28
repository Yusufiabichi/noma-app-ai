/**
 * Environment Configuration
 * 
 * Centralized environment variables and configuration for the NOMA app.
 * Adjust based on development, staging, and production environments.
 */

const API_BASE_URL = 'http://localhost:3000/api';
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

export default {
  API_BASE_URL,
  REQUEST_TIMEOUT_MS,
};
