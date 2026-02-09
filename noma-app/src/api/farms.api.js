/**
 * Farms API
 * Farm management endpoints
 * 
 * Endpoints:
 * - POST /farms
 * - GET /farms
 * - GET /farms/:id
 * - PUT /farms/:id
 * - DELETE /farms/:id
 */

import client from './client';

/**
 * Create a new farm
 * @param {Object} farmData - Farm data
 * @param {string} farmData.name - Farm name
 * @param {string} [farmData.region] - Farm region
 * @param {string} [farmData.district] - Farm district
 * @param {string[]} [farmData.crops] - List of crops grown
 * @param {Object} [farmData.size] - Farm size
 * @param {number} [farmData.size.value] - Size value
 * @param {string} [farmData.size.unit] - Size unit (hectares, acres, sqm)
 * @param {string} [farmData.notes] - Additional notes
 * @returns {Promise<{farm: Object}>}
 */
export const createFarm = async (farmData) => {
  const response = await client.post('/farms', farmData);
  return response.data;
};

/**
 * Get all farms for current user
 * @param {Object} [params] - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.search] - Search term
 * @returns {Promise<{data: Object[], pagination: Object}>}
 */
export const getFarms = async (params = {}) => {
  const response = await client.get('/farms', { params });
  return {
    farms: response.data,
    pagination: response.pagination,
  };
};

/**
 * Get a specific farm by ID
 * @param {string} farmId - Farm ID
 * @returns {Promise<{farm: Object}>}
 */
export const getFarmById = async (farmId) => {
  const response = await client.get(`/farms/${farmId}`);
  return response.data;
};

/**
 * Update a farm
 * @param {string} farmId - Farm ID
 * @param {Object} farmData - Updated farm data
 * @returns {Promise<{farm: Object}>}
 */
export const updateFarm = async (farmId, farmData) => {
  const response = await client.put(`/farms/${farmId}`, farmData);
  return response.data;
};

/**
 * Delete a farm
 * @param {string} farmId - Farm ID
 * @returns {Promise<void>}
 */
export const deleteFarm = async (farmId) => {
  const response = await client.del(`/farms/${farmId}`);
  return response.data;
};

export default {
  createFarm,
  getFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
};
