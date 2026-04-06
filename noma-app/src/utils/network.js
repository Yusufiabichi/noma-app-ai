/**
 * Network Status Utility
 * Detects online/offline status and manages network listeners
 */

import NetInfo from '@react-native-community/netinfo';
import logger from './logger';

let isOnlineCache = null;
let unsubscribe = null;
const listeners = [];

/**
 * Initialize network monitoring
 */
export const initNetworkMonitoring = () => {
  unsubscribe = NetInfo.addEventListener((state) => {
    const wasOnline = isOnlineCache;
    isOnlineCache = state.isConnected && state.isInternetReachable;
    
    logger.info('Network status changed', {
      isOnline: isOnlineCache,
      type: state.type,
    });

    // Notify all listeners if status changed
    if (wasOnline !== isOnlineCache) {
      notifyListeners(isOnlineCache);
    }
  });
};

/**
 * Stop network monitoring
 */
export const stopNetworkMonitoring = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};

/**
 * Get current online status
 */
export const isOnline = async () => {
  if (isOnlineCache !== null) {
    return isOnlineCache;
  }

  try {
    const state = await NetInfo.fetch();
    isOnlineCache = state.isConnected && state.isInternetReachable;
    return isOnlineCache;
  } catch (error) {
    logger.error('Failed to check network status', error);
    return false;
  }
};

/**
 * Get current online status (cached, synchronous)
 */
export const isOnlineSync = () => {
  return isOnlineCache ?? false;
};

/**
 * Subscribe to network status changes
 * @param {Function} callback - Called with (isOnline: boolean)
 * @returns {Function} Unsubscribe function
 */
export const onNetworkStatusChange = (callback) => {
  listeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

/**
 * Notify all listeners of network status change
 */
const notifyListeners = (isOnlineNow) => {
  listeners.forEach((listener) => {
    try {
      listener(isOnlineNow);
    } catch (error) {
      logger.error('Error in network status listener', error);
    }
  });
};

export default {
  initNetworkMonitoring,
  stopNetworkMonitoring,
  isOnline,
  isOnlineSync,
  onNetworkStatusChange,
};
