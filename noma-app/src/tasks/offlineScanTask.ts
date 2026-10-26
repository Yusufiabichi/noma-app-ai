// Offline Scan Background Task
// Runs when the OS wakes the app (on Android only when a network is connected),
// even if the app is closed. Must be imported from the app entry, outside React.

import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { initializeClient } from '@/src/api/client';
import { OFFLINE_SCAN_TASK, processOfflineScans } from '@/src/services/offlineScanQueue';
import logger from '@/src/utils/logger';

// Each queued photo is one request that returns the finished diagnosis. If the
// OS ends the task mid-request, the photo stays queued and is sent next time.
TaskManager.defineTask(OFFLINE_SCAN_TASK, async () => {
  try {
    await initializeClient();
    await processOfflineScans();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    logger.error('Offline scan background task failed', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});
