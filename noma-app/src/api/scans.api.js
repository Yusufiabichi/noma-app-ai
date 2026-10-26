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

import { Platform } from 'react-native';
import apiClient, { rawClient } from './client';

// The server diagnoses while the request is open; a cold start can take ~30 s
const DIAGNOSIS_TIMEOUT_MS = 60000;

/**
 * Upload a photo and get the finished diagnosis back in the same response.
 * The AI detects the crop, so no crop type is sent.
 * @param {Object} scanData
 * @param {string} scanData.imageUri - Local URI of a JPEG prepared by preparePhotoForUpload
 * @param {'low'|'moderate'|'high'} [scanData.severity] - Omitted for "Not sure" (server assumes moderate)
 * @param {'en'|'ha'} [scanData.language] - Language of the treatment text
 * @returns {Promise<{success: boolean, data: {scan: Object}}>}
 */
export const createScan = async ({ imageUri, severity, language }) => {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const blob = await (await fetch(imageUri)).blob();
    formData.append('image', blob, 'scan.jpg');
  } else {
    formData.append('image', { uri: imageUri, name: 'scan.jpg', type: 'image/jpeg' });
  }
  if (severity) formData.append('severity', severity);
  formData.append('language', language === 'ha' ? 'ha' : 'en');

  const response = await rawClient.post('/scans', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: DIAGNOSIS_TIMEOUT_MS,
  });
  return response.data;
};

/**
 * Get all scans for current user
 * @param {Object} [params] - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.status] - Filter by status (diagnosed, rejected; pending/failed on old scans)
 * @param {string} [params.farmId] - Filter by farm ID
 * @param {string} [params.cropType] - Filter by crop type
 * @returns {Promise<{scans: Object[], pagination: Object}>}
 */

export const getScans = async (params = {}) => {
  try {
    const { page = 1, limit = 10, cropType, status } = params;
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(cropType && { cropType }),
      ...(status && { status }),
    }).toString();

    const response = await apiClient.get(`/scans?${query}`);

    const data = response.data;
    if (Array.isArray(data)) {
      return {
        scans: data,
        pagination: {
          total: data.length,
          page,
          limit,
        },
      };
    }
    const scans = data?.data?.scans || data?.scans || [];
    const pagination = data?.data?.pagination || data?.pagination || { total: scans.length, page, limit };

    return { scans, pagination };
  } catch (error) {
    console.error('getScans error:', error);
    return { scans: [], pagination: { total: 0, page: 1, limit: 10 } };
  }
};

/**
 * Get scan statistics for current user
 * @returns {Promise<{stats: Object}>}
 */
export const getScanStats = async () => {
  return await apiClient.get('/scans/stats');
};

/**
 * Get a specific scan by ID
 * @param {string} scanId - Scan ID
 * @returns {Promise<{scan: Object}>}
 */
export const getScanById = async (scanId) => {
  return await apiClient.get(`/scans/${scanId}`);
};

/**
 * Diagnose an old pending/failed scan again. Responds with the finished scan.
 * @param {string} scanId - Scan ID
 * @param {Object} [options]
 * @param {'low'|'moderate'|'high'} [options.severity]
 * @param {'en'|'ha'} [options.language]
 * @returns {Promise<{success: boolean, data: {scan: Object}}>}
 */
export const retryScanDiagnosis = async (scanId, { severity, language } = {}) => {
  const response = await rawClient.post(
    `/scans/${scanId}/retry`,
    { ...(severity && { severity }), ...(language && { language }) },
    { timeout: DIAGNOSIS_TIMEOUT_MS }
  );
  return response.data;
};

/**
 * Delete a scan
 * @param {string} scanId - Scan ID
 * @returns {Promise<void>}
 */
export const deleteScan = async (scanId) => {
  const response = await apiClient.del(`/scans/${scanId}`);
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
