// Offline Scan Background Task
// Runs when the OS wakes the app (on Android only when a network is connected),
// even if the app is closed. Must be imported from the app entry, outside React.

import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { initializeClient } from '@/src/api/client';
import { OFFLINE_SCAN_TASK, processOfflineScans } from '@/src/services/offlineScanQueue';
import logger from '@/src/utils/logger';

// iOS gives background tasks about 30 seconds; leave room to finish writing
const RESULT_WAIT_MS = 20000;

TaskManager.defineTask(OFFLINE_SCAN_TASK, async () => {
  try {
    await initializeClient();
    await processOfflineScans({ waitForResultsMs: RESULT_WAIT_MS });
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    logger.error('Offline scan background task failed', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});
