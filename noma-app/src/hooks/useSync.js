/**
 * useSync Hook
 * Manages network monitoring and automatic sync when coming back online
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { onNetworkStatusChange, initNetworkMonitoring, stopNetworkMonitoring } from '../utils/network';
import { syncPendingScans } from '../services/syncService';
import logger from '../utils/logger';

export const useSync = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize network monitoring on mount
    initNetworkMonitoring();

    return () => {
      // Clean up on unmount
      stopNetworkMonitoring();
    };
  }, []);

  // Listen for network status changes
  useEffect(() => {
    let unsubscribe;

    const setupListener = async () => {
      unsubscribe = onNetworkStatusChange(async (isOnline) => {
        if (isOnline && user?.id) {
          logger.info('Device came back online, syncing pending scans');
          try {
            const result = await syncPendingScans(user.id);
            logger.info('Sync completed', result);
          } catch (error) {
            logger.error('Sync failed', error);
          }
        }
      });
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.id]);
};

export default useSync;
