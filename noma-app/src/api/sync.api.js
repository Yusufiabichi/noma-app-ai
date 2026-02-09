/**
 * Sync API
 * Offline synchronization endpoints
 * 
 * Endpoints:
 * - POST /sync/push - Upload local changes to server
 * - GET /sync/pull - Download server changes since last sync
 */

import client from './client';

/**
 * Push local changes to server
 * @param {Object} changes - Changes to push
 * @param {Object} [changes.farms] - Farm changes
 * @param {Object[]} [changes.farms.created] - Created farms
 * @param {Object[]} [changes.farms.updated] - Updated farms
 * @param {Object[]} [changes.farms.deleted] - Deleted farms
 * @param {Object} [changes.scans] - Scan changes
 * @param {Object[]} [changes.scans.created] - Created scans
 * @param {Object[]} [changes.scans.updated] - Updated scans
 * @param {Object[]} [changes.scans.deleted] - Deleted scans
 * @returns {Promise<{processed: number, created: number, updated: number, deleted: number, errors: Array}>}
 */
export const pushChanges = async (changes) => {
  const response = await client.post('/sync/push', { changes });
  return response.data;
};

/**
 * Pull changes from server since last sync
 * @param {string} [lastPulledAt] - ISO timestamp of last sync
 * @returns {Promise<{changes: Object, timestamp: string}>}
 */
export const pullChanges = async (lastPulledAt = null) => {
  const params = {};
  if (lastPulledAt) {
    params.lastPulledAt = lastPulledAt;
  }
  
  const response = await client.get('/sync/pull', { params });
  return response.data;
};

export default {
  pushChanges,
  pullChanges,
};
