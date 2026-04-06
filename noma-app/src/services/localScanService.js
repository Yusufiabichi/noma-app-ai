
// Local Scan Service
// Manages scan data stored locally in WatermelonDB


import database from '../data/database';
import * as FileSystem from 'expo-file-system';
import logger from '../utils/logger';

const SCANS_DIRECTORY = FileSystem.documentDirectory + 'scans/';

/**
 * Ensure scans directory exists
 */
const ensureScansDirectory = async () => {
  const dirInfo = await FileSystem.getInfoAsync(SCANS_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(SCANS_DIRECTORY, { intermediates: true });
  }
};

/**
 * Save image file locally
 * @param {string} sourceUri - Source image URI
 * @returns {Promise<string>} - Path to saved image
 */
export const saveImageLocally = async (sourceUri) => {
  try {
    await ensureScansDirectory();
    
    const fileName = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    const targetUri = SCANS_DIRECTORY + fileName;
    
    // Copy image to app directory
    await FileSystem.copyAsync({
      from: sourceUri,
      to: targetUri,
    });
    
    logger.info('Image saved locally', { targetUri });
    return targetUri;
  } catch (error) {
    logger.error('Failed to save image locally', error);
    throw error;
  }
};

/**
 * Create a new local scan record
 * @param {Object} scanData - Scan data
 * @param {string} scanData.userId - User ID
 * @param {string} scanData.imageUri - Local image URI (already saved)
 * @param {string} [scanData.cropType] - Crop type
 * @returns {Promise<Object>} - Created scan record
 */
export const createLocalScan = async (scanData) => {
  try {
    const { userId, imageUri, cropType } = scanData;
    
    const scansCollection = database.get('scans');
    const scan = await database.write(async () => {
      return await scansCollection.create((scan) => {
        scan.userId = userId;
        scan.imageUri = imageUri;
        scan.cropType = cropType || '';
        scan.status = 'pending';
        scan.localId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        scan.errorRetryCount = 0;
        scan.isDeleted = false;
      });
    });
    
    logger.info('Local scan created', { scanId: scan.id, localId: scan.localId });
    return scan;
  } catch (error) {
    logger.error('Failed to create local scan', error);
    throw error;
  }
};

/**
 * Update scan with diagnosis results
 * @param {string} scanId - Scan ID (local WatermelonDB ID)
 * @param {Object} diagnosis - Diagnosis data from AI
 */
export const updateScanWithDiagnosis = async (scanId, diagnosis) => {
  try {
    const scansCollection = database.get('scans');
    const scan = await scansCollection.find(scanId);
    
    await database.write(async () => {
      await scan.update((record) => {
        record.status = 'diagnosed';
        record.disease = diagnosis.disease;
        record.cropDetected = diagnosis.cropType;
        record.confidence = diagnosis.confidence;
        record.severity = diagnosis.severity;
        record.recommendations = JSON.stringify(diagnosis.recommendations || []);
        record.futurePrevention = JSON.stringify(diagnosis.futurePrevention || []);
        record.modelVersion = diagnosis.modelVersion;
        record.processingTime = diagnosis.processingTime;
        record.requestId = diagnosis.requestId;
      });
    });
    
    logger.info('Scan updated with diagnosis', { scanId });
    return scan;
  } catch (error) {
    logger.error('Failed to update scan with diagnosis', error);
    throw error;
  }
};

/**
 * Update scan with server ID after sync
 * @param {string} scanId - Scan ID (local WatermelonDB ID)
 * @param {string} serverScanId - Server scan ID
 * @param {string} [imageUrl] - Remote image URL
 * @param {string} [imageProvider] - Image provider (s3, cloudinary)
 */
export const markScanAsSynced = async (scanId, serverScanId, imageUrl, imageProvider) => {
  try {
    const scansCollection = database.get('scans');
    const scan = await scansCollection.find(scanId);
    
    await database.write(async () => {
      await scan.update((record) => {
        record.serverScanId = serverScanId;
        record.imageUrl = imageUrl;
        record.imageProvider = imageProvider || 'cloudinary';
        record.syncedAt = Date.now();
      });
    });
    
    logger.info('Scan marked as synced', { scanId, serverScanId });
    return scan;
  } catch (error) {
    logger.error('Failed to mark scan as synced', error);
    throw error;
  }
};

/**
 * Get all pending scans for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of pending scans
 */
export const getPendingScans = async (userId) => {
  try {
    const scansCollection = database.get('scans');
    const pendingScans = await scansCollection
      .query(
        (q) => q
          .where('user_id', userId)
          .where('status', 'pending')
          .where('is_deleted', false)
      )
      .fetch();
    
    logger.info('Fetched pending scans', { count: pendingScans.length });
    return pendingScans;
  } catch (error) {
    logger.error('Failed to fetch pending scans', error);
    throw error;
  }
};

/**
 * Get all scans for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of scans
 */
export const getUserScans = async (userId) => {
  try {
    const scansCollection = database.get('scans');
    const scans = await scansCollection
      .query(
        (q) => q
          .where('user_id', userId)
          .where('is_deleted', false)
      )
      .fetch();
    
    return scans;
  } catch (error) {
    logger.error('Failed to fetch user scans', error);
    throw error;
  }
};

/**
 * Get a single scan by local ID
 * @param {string} scanId - Scan ID (WatermelonDB ID)
 * @returns {Promise<Object>} - Scan record
 */
export const getScanById = async (scanId) => {
  try {
    const scansCollection = database.get('scans');
    return await scansCollection.find(scanId);
  } catch (error) {
    logger.error('Failed to fetch scan', error);
    throw error;
  }
};

/**
 * Delete a scan (soft delete)
 * @param {string} scanId - Scan ID
 */
export const deleteScan = async (scanId) => {
  try {
    const scansCollection = database.get('scans');
    const scan = await scansCollection.find(scanId);
    
    await database.write(async () => {
      await scan.update((record) => {
        record.isDeleted = true;
        record.deletedAt = Date.now();
      });
    });
    
    // Clean up image file
    try {
      if (scan.imageUri) {
        await FileSystem.deleteAsync(scan.imageUri, { idempotent: true });
      }
    } catch (e) {
      logger.warn('Failed to delete image file', e);
    }
    
    logger.info('Scan deleted', { scanId });
  } catch (error) {
    logger.error('Failed to delete scan', error);
    throw error;
  }
};

export default {
  saveImageLocally,
  createLocalScan,
  updateScanWithDiagnosis,
  markScanAsSynced,
  getPendingScans,
  getUserScans,
  getScanById,
  deleteScan,
};
