
// useSync Hook
// Manages network monitoring and automatic sync when coming back online


import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './useAuth';
import { onNetworkStatusChange, initNetworkMonitoring, stopNetworkMonitoring } from '../utils/network';
import { syncPendingScans } from '../services/syncService';
import { processOfflineScans, resumeBackgroundSyncIfNeeded } from '../services/offlineScanQueue';
import logger from '../utils/logger';

const QUEUE_RETRY_CHECK_MS = 60 * 1000;

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

  // Offline scan queue: send waiting photos on launch, when back online, and when
  // the app returns to the foreground, without waiting out earlier retry delays
  useEffect(() => {
    const runQueue = () => {
      processOfflineScans({ force: true }).catch((error) => logger.error('Offline scan queue failed', error));
    };

    resumeBackgroundSyncIfNeeded();
    runQueue();

    const unsubscribeNetwork = onNetworkStatusChange((isOnline) => {
      if (isOnline) runQueue();
    });
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') runQueue();
    });
    // While the app is open, retry photos whose backoff has passed (e.g. a send
    // that failed because the connection was still settling after a reconnect)
    const retryTimer = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      processOfflineScans().catch((error) => logger.error('Offline scan queue failed', error));
    }, QUEUE_RETRY_CHECK_MS);

    return () => {
      unsubscribeNetwork();
      appStateSubscription.remove();
      clearInterval(retryTimer);
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
