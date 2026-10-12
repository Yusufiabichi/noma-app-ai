
// useSync Hook
// Manages network monitoring and automatic sync when coming back online


import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './useAuth';
import { onNetworkStatusChange, initNetworkMonitoring, stopNetworkMonitoring } from '../utils/network';
import { syncPendingScans } from '../services/syncService';
import { processOfflineScans, resumeBackgroundSyncIfNeeded } from '../services/offlineScanQueue';
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

  // Offline scan queue: process on launch, when back online, and when the app returns to the foreground
  useEffect(() => {
    const runQueue = () => {
      processOfflineScans({ waitForResultsMs: 60000 }).catch((error) => logger.error('Offline scan queue failed', error));
    };

    resumeBackgroundSyncIfNeeded();
    runQueue();

    const unsubscribeNetwork = onNetworkStatusChange((isOnline) => {
      if (isOnline) runQueue();
    });
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') runQueue();
    });

    return () => {
      unsubscribeNetwork();
      appStateSubscription.remove();
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
