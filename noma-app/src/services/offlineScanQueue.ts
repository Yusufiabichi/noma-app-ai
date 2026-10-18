// Offline Scan Queue
// Keeps crop scans taken without internet in AsyncStorage, uploads them when the
// device is back online (foreground or background task), polls for the diagnosis
// and notifies the farmer with a local notification when the result is ready.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { createScan, getScanById } from '@/src/api/scans.api';
import { isOnline } from '@/src/utils/network';
import { buildScanResult } from '@/src/utils/scanResult';
import logger from '@/src/utils/logger';
import { getServerErrorCode } from '@/src/utils/errors';
import { isPlanLimitError } from '@/src/auth/access';

export const OFFLINE_SCAN_TASK = 'noma-offline-scan-sync';
export const SCAN_RESULTS_CHANNEL = 'scan-results';
export const OFFLINE_SCAN_NOTIFICATION = 'offline-scan';

const QUEUE_KEY = '@nomaapp_offline_scan_queue';
const IMAGES_DIRECTORY = FileSystem.documentDirectory + 'offline-scans/';

const STALE_UPLOAD_MS = 2 * 60 * 1000;          // an upload interrupted by the app being killed
const MAX_ANALYSIS_WAIT_MS = 24 * 60 * 60 * 1000; // give up on a server scan after a day
const MAX_BACKOFF_MS = 6 * 60 * 60 * 1000;
const POLL_INTERVAL_MS = 5000;
const KEEP_FINISHED_MS = 7 * 24 * 60 * 60 * 1000;

// Errors that mean "try again later" rather than "this scan can never succeed"
const RETRYABLE_CODES = new Set([
  'NETWORK_ERROR', 'TIMEOUT_ERROR', 'NO_INTERNET', 'SERVER_ERROR',
  'UNAUTHORIZED', 'TOKEN_EXPIRED', 'UNKNOWN_ERROR',
]);

export type QueuedScanStatus = 'queued' | 'uploading' | 'analyzing' | 'diagnosed' | 'failed';

export interface QueuedScan {
  id: string;
  userId: string;
  imageUri: string | null;
  cropType: string;
  language: 'en' | 'ha';
  createdAt: number;
  status: QueuedScanStatus;
  attempts: number;
  nextAttemptAt: number;
  uploadStartedAt?: number;
  serverScanId?: string;
  analyzingSince?: number;
  result?: any;
  errorMessage?: string;
  /** Rejected because the farmer's plan doesn't allow more scans (e.g. daily limit) */
  planLimited?: boolean;
  notifiedAt?: number;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const listeners = new Set<(queue: QueuedScan[]) => void>();

// Serialize read-modify-write so the foreground sync and the background task
// never overwrite each other's changes within the same JS runtime
let writeChain: Promise<unknown> = Promise.resolve();

export async function getQueue(): Promise<QueuedScan[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    logger.error('Failed to read offline scan queue', error);
    return [];
  }
}

function updateQueue(mutate: (queue: QueuedScan[]) => QueuedScan[]): Promise<QueuedScan[]> {
  const run = writeChain.then(async () => {
    const next = mutate(await getQueue());
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next));
    listeners.forEach(listener => {
      try { listener(next); } catch {}
    });
    return next;
  });
  writeChain = run.catch(() => {});
  return run;
}

function updateItem(id: string, changes: Partial<QueuedScan>) {
  return updateQueue(queue => queue.map(item => (item.id === id ? { ...item, ...changes } : item)));
}

export async function getQueuedScan(id: string) {
  return (await getQueue()).find(item => item.id === id) || null;
}

export function onQueueChange(listener: (queue: QueuedScan[]) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

const isActive = (item: QueuedScan) =>
  item.status === 'queued' || item.status === 'uploading' || item.status === 'analyzing';

// ─── Enqueue ──────────────────────────────────────────────────────────────────

const newId = () => `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

async function copyImageToAppStorage(sourceUri: string, id: string) {
  const dir = await FileSystem.getInfoAsync(IMAGES_DIRECTORY);
  if (!dir.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIRECTORY, { intermediates: true });
  }
  const target = `${IMAGES_DIRECTORY}${id}.jpg`;
  await FileSystem.copyAsync({ from: sourceUri, to: target });
  return target;
}

/**
 * Save a scan taken without internet so it is uploaded later
 */
export async function enqueueScan({ imageUri, cropType, language, userId }: {
  imageUri: string;
  cropType: string;
  language: 'en' | 'ha';
  userId?: string | null;
}): Promise<QueuedScan> {
  const id = newId();
  const storedImageUri = await copyImageToAppStorage(imageUri, id);
  const now = Date.now();

  const item: QueuedScan = {
    id,
    userId: userId || 'offline-user',
    imageUri: storedImageUri,
    cropType,
    language,
    createdAt: now,
    status: 'queued',
    attempts: 0,
    nextAttemptAt: now,
  };

  await updateQueue(queue => [...queue, item]);
  logger.info('Offline scan queued', { id });

  await afterEnqueue();
  return item;
}

/**
 * Track a scan that was already uploaded but whose diagnosis wasn't ready
 * before the farmer left the screen (e.g. slow network, polling timeout)
 */
export async function trackUploadedScan({ serverScanId, cropType, language, userId }: {
  serverScanId: string;
  cropType: string;
  language: 'en' | 'ha';
  userId?: string | null;
}): Promise<QueuedScan> {
  const now = Date.now();
  const item: QueuedScan = {
    id: newId(),
    userId: userId || 'offline-user',
    imageUri: null,
    cropType,
    language,
    createdAt: now,
    status: 'analyzing',
    attempts: 0,
    nextAttemptAt: now + POLL_INTERVAL_MS,
    serverScanId,
    analyzingSince: now,
  };

  await updateQueue(queue => [...queue, item]);
  logger.info('Uploaded scan tracked for result', { id: item.id, serverScanId });

  await afterEnqueue();
  return item;
}

async function afterEnqueue() {
  await registerBackgroundSync();
  // Ask now, in context, so the result notification can be shown later
  try {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && canAskAgain) {
      await Notifications.requestPermissionsAsync();
    }
  } catch (error) {
    logger.warn('Notification permission request failed', error);
  }
}

// ─── Processing ───────────────────────────────────────────────────────────────

const backoffMs = (attempts: number) => Math.min(60000 * 2 ** attempts, MAX_BACKOFF_MS);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function deleteImage(uri?: string | null) {
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    logger.warn('Failed to delete offline scan image', error);
  }
}

async function uploadItem(item: QueuedScan) {
  await updateItem(item.id, { status: 'uploading', uploadStartedAt: Date.now() });

  try {
    const info = item.imageUri ? await FileSystem.getInfoAsync(item.imageUri) : { exists: false };
    if (!info.exists) {
      throw Object.assign(new Error('Saved photo is missing'), { code: 'FILE_MISSING' });
    }

    const response: any = await createScan({
      imageUri: item.imageUri as string,
      cropType: item.cropType,
      language: item.language,
      clientScanId: item.id,
    });
    const serverScan = response?.data?.scan || response?.scan;
    if (!serverScan?._id) {
      throw new Error('Received empty response from server after upload');
    }

    const now = Date.now();
    await updateItem(item.id, {
      status: 'analyzing',
      serverScanId: serverScan._id,
      analyzingSince: now,
      nextAttemptAt: now,
      attempts: 0,
      errorMessage: undefined,
    });
    logger.info('Offline scan uploaded', { id: item.id, serverScanId: serverScan._id });
    return true;
  } catch (error: any) {
    const attempts = item.attempts + 1;
    if (RETRYABLE_CODES.has(error?.code) || !error?.code) {
      logger.warn('Offline scan upload will be retried', { id: item.id, code: error?.code, attempts });
      await updateItem(item.id, {
        status: 'queued',
        attempts,
        nextAttemptAt: Date.now() + backoffMs(attempts),
        errorMessage: error?.message,
      });
    } else {
      logger.error('Offline scan upload rejected', error);
      await finishItem({ ...item, attempts }, 'failed', {
        errorMessage: error?.message,
        planLimited: isPlanLimitError(getServerErrorCode(error)),
      });
    }
    return false;
  }
}

async function checkItem(item: QueuedScan) {
  try {
    const response: any = await getScanById(item.serverScanId as string);
    const scan = response?.data?.scan || response?.scan;

    if (scan?.status === 'diagnosed') {
      await finishItem(item, 'diagnosed', { result: buildScanResult(scan, item.language) });
      return;
    }

    const permanentlyFailed =
      scan?.status === 'failed' ||
      (scan?.status === 'pending' && scan?.error?.code && !scan?.error?.retryable);
    if (permanentlyFailed || !scan) {
      await finishItem(item, 'failed', { errorMessage: scan?.error?.message || 'Diagnosis failed' });
      return;
    }

    if (Date.now() - (item.analyzingSince || item.createdAt) > MAX_ANALYSIS_WAIT_MS) {
      await finishItem(item, 'failed', { errorMessage: 'Diagnosis took too long' });
      return;
    }

    await updateItem(item.id, { nextAttemptAt: Date.now() + POLL_INTERVAL_MS });
  } catch (error: any) {
    // Network blips while polling are fine; try again on the next run
    const attempts = item.attempts + 1;
    logger.warn('Checking offline scan result failed', { id: item.id, code: error?.code });
    await updateItem(item.id, { attempts, nextAttemptAt: Date.now() + Math.min(backoffMs(attempts), 15 * 60000) });
  }
}

async function finishItem(item: QueuedScan, status: 'diagnosed' | 'failed', changes: Partial<QueuedScan>) {
  const finished = { ...item, ...changes, status };
  const notifiedAt = (await notifyFarmer(finished)) ? Date.now() : undefined;
  await updateItem(item.id, { ...changes, status, notifiedAt, imageUri: null });
  await deleteImage(item.imageUri);
}

let processing: Promise<void> | null = null;

/**
 * Upload due scans and check on scans waiting for a diagnosis.
 * Safe to call often: concurrent calls share one run.
 * @param waitForResultsMs - keep polling for results this long after uploading
 */
export function processOfflineScans({ waitForResultsMs = 0 } = {}) {
  if (!processing) {
    processing = runQueue(waitForResultsMs).finally(() => { processing = null; });
  }
  return processing;
}

async function runQueue(waitForResultsMs: number) {
  if (!(await isOnline())) return;

  const deadline = Date.now() + waitForResultsMs;

  // Uploads first, then status checks; repeat checks while within the time budget
  for (let pass = 0; ; pass++) {
    const now = Date.now();
    const queue = await getQueue();

    for (const item of queue) {
      const staleUpload = item.status === 'uploading' && now - (item.uploadStartedAt || 0) > STALE_UPLOAD_MS;
      if ((item.status === 'queued' && item.nextAttemptAt <= now) || staleUpload) {
        await uploadItem(item);
      }
    }

    for (const item of await getQueue()) {
      if (item.status === 'analyzing' && (pass === 0 || item.nextAttemptAt <= Date.now())) {
        await checkItem(item);
      }
    }

    const stillAnalyzing = (await getQueue()).some(item => item.status === 'analyzing');
    if (!stillAnalyzing || Date.now() + POLL_INTERVAL_MS > deadline) break;
    await sleep(POLL_INTERVAL_MS);
  }

  await pruneQueue();
}

async function pruneQueue() {
  const now = Date.now();
  const queue = await updateQueue(items =>
    items.filter(item => isActive(item) || now - item.createdAt < KEEP_FINISHED_MS)
  );
  if (!queue.some(isActive)) {
    await unregisterBackgroundSync();
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

const CROP_NAMES_HA: Record<string, string> = {
  maize: 'Masara', rice: 'Shinkafa', tomato: 'Tumatur', beans: 'Wake', cassava: 'Rogo',
  cabbage: 'Kabeji', cucumber: 'Kokomba', onion: 'Albasa', yam: 'Doya', potato: 'Dankali',
};

export async function ensureNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(SCAN_RESULTS_CHANNEL, {
    name: 'Scan results',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#16A34A',
  });
}

async function notifyFarmer(item: QueuedScan) {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return false;

    await ensureNotificationChannel();

    const isHausa = item.language === 'ha';
    const crop = isHausa
      ? CROP_NAMES_HA[item.cropType] || item.cropType
      : item.cropType.charAt(0).toUpperCase() + item.cropType.slice(1);
    const diagnosis = item.result?.name || item.result?.disease;

    const content = item.planLimited
      ? {
          title: isHausa ? 'Iyakar tsarinka ta cika' : 'Plan limit reached',
          body: isHausa
            ? `Ba a binciki hoton ${crop} ba saboda iyakar tsarinka. Danna don duba tsare-tsare.`
            : `Your ${crop} photo wasn't analyzed because of your plan's limit. Tap to see plans.`,
        }
      : item.status === 'diagnosed' && item.result?.lowConfidence
      ? {
          // No treatment for unconfirmed results: point to the free expert review
          title: isHausa ? 'Ba a tabbatar da sakamakon ba' : 'Result not confirmed',
          body: isHausa
            ? `${crop}: wataƙila ${diagnosis}. Danna don tambayar kwararre kyauta.`
            : `${crop}: possibly ${diagnosis}. Tap to ask an expert for free.`,
        }
      : item.status === 'diagnosed'
      ? {
          title: isHausa ? 'Sakamakon binciken ya shirya' : 'Your scan result is ready',
          body: isHausa
            ? `${crop}: ${diagnosis}. Danna don ganin magani.`
            : `${crop}: ${diagnosis}. Tap to see the treatment.`,
        }
      : {
          title: isHausa ? 'An kasa binciken hoto' : 'Scan could not be analyzed',
          body: isHausa
            ? `Ba a iya binciken hoton ${crop} ba. Danna don sake daukar hoto.`
            : `We couldn't analyze your ${crop} photo. Tap to take a new one.`,
        };

    await Notifications.scheduleNotificationAsync({
      content: {
        ...content,
        data: { type: OFFLINE_SCAN_NOTIFICATION, queueId: item.id },
      },
      trigger: Platform.OS === 'android' ? { channelId: SCAN_RESULTS_CHANNEL } : null,
    });
    return true;
  } catch (error) {
    logger.error('Failed to show scan result notification', error);
    return false;
  }
}

// ─── Background task registration ────────────────────────────────────────────

export async function registerBackgroundSync() {
  try {
    if (!TaskManager.isTaskDefined(OFFLINE_SCAN_TASK)) {
      logger.warn('Offline scan task is not defined; background sync unavailable');
      return;
    }
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
      logger.warn('Background tasks are restricted on this device');
      return;
    }
    if (!(await TaskManager.isTaskRegisteredAsync(OFFLINE_SCAN_TASK))) {
      // 15 minutes is the shortest interval Android and iOS allow
      await BackgroundTask.registerTaskAsync(OFFLINE_SCAN_TASK, { minimumInterval: 15 });
      logger.info('Offline scan background sync registered');
    }
  } catch (error) {
    logger.error('Failed to register offline scan background sync', error);
  }
}

async function unregisterBackgroundSync() {
  try {
    if (await TaskManager.isTaskRegisteredAsync(OFFLINE_SCAN_TASK)) {
      await BackgroundTask.unregisterTaskAsync(OFFLINE_SCAN_TASK);
      logger.info('Offline scan background sync unregistered');
    }
  } catch (error) {
    logger.warn('Failed to unregister offline scan background sync', error);
  }
}

/**
 * Re-register the background task on startup if scans are still waiting
 */
export async function resumeBackgroundSyncIfNeeded() {
  if ((await getQueue()).some(isActive)) {
    await registerBackgroundSync();
  }
}

export default {
  enqueueScan,
  trackUploadedScan,
  processOfflineScans,
  getQueue,
  getQueuedScan,
  onQueueChange,
  resumeBackgroundSyncIfNeeded,
};
