
// Sync Service
// Handles synchronization of offline scans with backend


import client from '../api/client';
import * as localScanService from './localScanService';
import database from '../data/database';
import * as FileSystem from 'expo-file-system';
import { isOnlineSync } from '../utils/network';
import logger from '../utils/logger';

/**
 * Sync pending scans with backend
 * Called when device comes back online
 * @param {string} userId
 * @returns {Promise<{processed: number, synced: number, failed: number, results: Array}>}
 */
export const syncPendingScans = async (userId) => {
  if (!isOnlineSync()) {
    logger.warn('Device is offline, cannot sync');
    return { processed: 0, synced: 0, failed: 0, results: [] };
  }

  try {
    logger.info('Starting sync of pending scans', { userId });
    
    // Get all pending scans
    const pendingScans = await localScanService.getPendingScans(userId);
    logger.info('Found pending scans', { count: pendingScans.length });

    if (pendingScans.length === 0) {
      logger.info('No pending scans to sync');
      return { processed: 0, synced: 0, failed: 0, results: [] };
    }

    const results = [];
    let synced = 0;
    let failed = 0;

    // Process each pending scan
    for (const scan of pendingScans) {
      try {
        logger.info('Syncing scan', { scanId: scan.id, localId: scan.localId });

        // Mark as processing
        await markScanAsProcessing(scan.id);

        // Read image file
        const imageData = await readImageFile(scan.imageUri);

        // Create form data with image
        const formData = new FormData();
        formData.append('image', {
          uri: scan.imageUri,
          name: `scan-${scan.localId}.jpg`,
          type: 'image/jpeg',
        });
        
        if (scan.cropType) {
          formData.append('cropType', scan.cropType);
        }

        // Upload to backend
        const response = await client.uploadFile('/infer', formData);
        
        logger.info('Received AI response', { 
          scanId: scan.id, 
          disease: response.disease 
        });

        // Update local scan with diagnosis
        await localScanService.updateScanWithDiagnosis(scan.id, {
          disease: response.disease,
          cropType: response.cropType || scan.cropType,
          confidence: response.confidence,
          severity: response.severity,
          recommendations: response.recommendations || [],
          futurePrevention: response.futurePrevention || [],
          modelVersion: response.modelVersion,
          processingTime: response.processingTime,
          requestId: response.requestId || response.scan_id,
        });

        // Mark as synced with server ID
        if (response.scan_id) {
          await localScanService.markScanAsSynced(
            scan.id,
            response.scan_id,
            response.image_url,
            response.image_provider
          );
        }

        results.push({
          status: 'success',
          localId: scan.localId,
          serverScanId: response.scan_id,
          disease: response.disease,
        });

        synced++;
      } catch (error) {
        logger.error('Failed to sync scan', error, { scanId: scan.id });

        // Update scan with error
        await markScanAsFailed(scan.id, error);

        results.push({
          status: 'failed',
          localId: scan.localId,
          error: error.message,
        });

        failed++;
      }
    }

    logger.info('Sync complete', { processed: pendingScans.length, synced, failed });

    return {
      processed: pendingScans.length,
      synced,
      failed,
      results,
    };
  } catch (error) {
    logger.error('Sync operation failed', error);
    throw error;
  }
};

/**
 * Mark scan as processing
 */
const markScanAsProcessing = async (scanId) => {
  try {
    const scansCollection = database.get('scans');
    const scan = await scansCollection.find(scanId);
    
    await database.write(async () => {
      await scan.update((record) => {
        record.status = 'processing';
      });
    });
  } catch (error) {
    logger.error('Failed to mark scan as processing', error);
  }
};

/**
 * Mark scan as failed
 */
const markScanAsFailed = async (scanId, error) => {
  try {
    const scansCollection = database.get('scans');
    const scan = await scansCollection.find(scanId);
    
    await database.write(async () => {
      await scan.update((record) => {
        record.status = 'failed';
        record.errorCode = error.code || 'UNKNOWN_ERROR';
        record.errorMessage = error.message;
        record.errorRetryable = error.retryable !== false;
        record.errorRetryCount = (record.errorRetryCount || 0) + 1;
        record.errorLastRetryAt = Date.now();
      });
    });
  } catch (e) {
    logger.error('Failed to mark scan as failed', e);
  }
};

/**
 * Read image file (utility function)
 */
const readImageFile = async (uri) => {
  try {
    // File is already saved locally, just validate it exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Image file not found');
    }
    return fileInfo;
  } catch (error) {
    logger.error('Failed to read image file', error);
    throw error;
  }
};

export default {
  syncPendingScans,
};
