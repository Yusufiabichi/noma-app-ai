/**
 * Auth API
 * Authentication-related API endpoints
 * 
 * Endpoints:
 * - POST /auth/register
 * - POST /auth/login
 * - POST /auth/change-password
 * - GET /auth/me
 */

import client from './client';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's full name
 * @param {string} userData.phone - User's phone number
 * @param {string} userData.password - User password
 * @param {string} userData.role - User role (farmer, expert, supplier)
 * @returns {Promise<{user: Object, token: string}>}
 */
export const register = async (userData) => {
  const response = await client.post('/auth/register', userData);
  return response.data;
};

/**
 * Login user
 * @param {string} phone - User phone
 * @param {string} password - User password
 * @returns {Promise<{user: Object, token: string}>}
 */
export const login = async (phone, password) => {
  const response = await client.post('/auth/login', { phone, password });
  return response.data;
};

/**
 * Change user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<{token: string}>}
 */
export const changePassword = async (currentPassword, newPassword) => {
  const response = await client.post('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};

/**
 * Get current authenticated user
 * @returns {Promise<{user: Object}>}
 */
export const getCurrentUser = async () => {
  const response = await client.get('/auth/me');
  return response.data;
};

export default {
  register,
  login,
  changePassword,
  getCurrentUser,
};
