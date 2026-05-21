/**
 * Scans API
 * Crop disease scan management endpoints
 * 
 * Endpoints:
 * - POST /scans (with image upload)
 * - GET /scans
 * - GET /scans/stats
 * - GET /scans/:id
 * - POST /scans/:id/retry
 * - DELETE /scans/:id
 */

import client from './client';

/**
 * Create a new scan with image upload
 * @param {Object} scanData - Scan data
 * @param {string} scanData.imageUri - Local URI of the image
 * @param {string} [scanData.farmId] - Associated farm ID
 * @param {string} [scanData.cropType] - Type of crop
 * @param {string} [scanData.language] - Language for recommendations
 * @param {Function} [onProgress] - Upload progress callback
 * @returns {Promise<{scan: Object}>}
 */
export const createScan = async (scanData, onProgress = null) => {
  const { imageUri, cropType, language } = scanData;
  
  // Create form data for multipart upload
  const fileName = imageUri.split('/').pop();
  const fileType = fileName.toLowerCase().endsWith('.png') 
    ? 'image/png' 
    : 'image/jpeg';

  const formData = new FormData();
  
  // Append image file
  formData.append('image', {
    uri: imageUri,
    name: fileName,
    type: fileType,
  });
  
  if (cropType) formData.append('cropType', cropType);
  if (language) formData.append('language', language);

  const response = await client.uploadFile('/scans', formData, onProgress);
  return response;
};

/**
 * Get all scans for current user
 * @param {Object} [params] - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.status] - Filter by status (pending, processing, diagnosed, failed)
 * @param {string} [params.farmId] - Filter by farm ID
 * @param {string} [params.cropType] - Filter by crop type
 * @returns {Promise<{scans: Object[], pagination: Object}>}
 */
export const getScans = async (params = {}) => {
  const response = await client.get('/scans', { params });
  return {
    scans: response,
    pagination: response?.pagination,
  };
};

/**
 * Get scan statistics for current user
 * @returns {Promise<{stats: Object}>}
 */
export const getScanStats = async () => {
  return await client.get('/scans/stats');
};

/**
 * Get a specific scan by ID
 * @param {string} scanId - Scan ID
 * @returns {Promise<{scan: Object}>}
 */
export const getScanById = async (scanId) => {
  return await client.get(`/scans/${scanId}`);
};

/**
 * Retry failed diagnosis for a scan
 * @param {string} scanId - Scan ID
 * @returns {Promise<{scan: Object}>}
 */
export const retryScanDiagnosis = async (scanId) => {
  const response = await client.post(`/scans/${scanId}/retry`);
  return response;
};

/**
 * Delete a scan
 * @param {string} scanId - Scan ID
 * @returns {Promise<void>}
 */
export const deleteScan = async (scanId) => {
  const response = await client.del(`/scans/${scanId}`);
  return response;
};

export default {
  createScan,
  getScans,
  getScanStats,
  getScanById,
  retryScanDiagnosis,
  deleteScan,
};
