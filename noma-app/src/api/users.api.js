/**
 * Users API
 * User profile management endpoints
 * 
 * Endpoints:
 * - GET /users/profile
 * - PUT /users/profile
 * - DELETE /users/account
 */

import client from './client';

/**
 * Get current user's profile
 * @returns {Promise<{user: Object}>}
 */
export const getProfile = async () => {
  const response = await client.get('/users/profile');
  return response.data;
};

/**
 * Update current user's profile
 * @param {Object} profileData - Profile data to update
 * @param {string} [profileData.name] - User's name
 * @param {string} [profileData.phone] - User's phone number
 * @returns {Promise<{user: Object}>}
 */
export const updateProfile = async (profileData) => {
  const response = await client.put('/users/profile', profileData);
  return response.data;
};

/**
 * Deactivate current user's account
 * @returns {Promise<void>}
 */
export const deactivateAccount = async () => {
  const response = await client.del('/users/account');
  return response.data;
};

export default {
  getProfile,
  updateProfile,
  deactivateAccount,
};
