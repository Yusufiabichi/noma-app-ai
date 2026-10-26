// Offline Scan Queue
// Keeps crop photos taken without internet (with the severity the farmer chose)
// in AsyncStorage and sends each one as a fresh scan when the device is back
// online (foreground or background task). The server answers with the finished
// diagnosis, and the farmer gets a local notification with the outcome.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { isOnline } from '@/src/utils/network';
import { buildScanResult } from '@/src/utils/scanResult';
import logger from '@/src/utils/logger';
import { describeRejection, ScanLanguage, Severity, submitScan } from '@/src/services/scanSubmission';

export const OFFLINE_SCAN_TASK = 'noma-offline-scan-sync';
export const SCAN_RESULTS_CHANNEL = 'scan-results';
export const OFFLINE_SCAN_NOTIFICATION = 'offline-scan';

const QUEUE_KEY = '@nomaapp_offline_scan_queue';
const IMAGES_DIRECTORY = FileSystem.documentDirectory + 'offline-scans/';

const STALE_UPLOAD_MS = 2 * 60 * 1000;          // an upload interrupted by the app being killed
const MAX_BACKOFF_MS = 6 * 60 * 60 * 1000;
const KEEP_FINISHED_MS = 7 * 24 * 60 * 60 * 1000;

export type QueuedScanStatus = 'queued' | 'uploading' | 'diagnosed' | 'failed';

export interface QueuedScan {
  id: string;
  userId: string;
  imageUri: string | null;
  /** null when the farmer chose "Not sure" */
  severity?: Severity | null;
  language: ScanLanguage;
  createdAt: number;
  status: QueuedScanStatus;
  attempts: number;
  nextAttemptAt: number;
  uploadStartedAt?: number;
  /** Set once the server saved the scan (diagnosed or rejected); history then lists the server copy */
  serverScanId?: string;
  /** treatment-rec payload; its status is 'diagnosed' or 'rejected' */
  result?: any;
  errorMessage?: string;
  /** The server found the photo unusable (blurry, dark…) and saved nothing */
  qualityRejected?: boolean;
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

export const isActive = (item: QueuedScan) => item.status === 'queued' || item.status === 'uploading';

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
 * Save a photo taken without internet so it is diagnosed later
 */
export async function enqueueScan({ imageUri, severity, language, userId }: {
  imageUri: string;
  severity?: Severity | null;
  language: ScanLanguage;
  userId?: string | null;
}): Promise<QueuedScan> {
  const id = newId();
  const storedImageUri = await copyImageToAppStorage(imageUri, id);
  const now = Date.now();

  const item: QueuedScan = {
    id,
    userId: userId || 'offline-user',
    imageUri: storedImageUri,
    severity: severity || null,
    language,
    createdAt: now,
    status: 'queued',
    attempts: 0,
    nextAttemptAt: now,
  };

  await updateQueue(queue => [...queue, item]);
  logger.info('Offline scan queued', { id });

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
  return item;
}

// ─── Processing ───────────────────────────────────────────────────────────────

// 30 s, 1 min, 2 min… up to 6 h
const backoffMs = (attempts: number) => Math.min(30000 * 2 ** (attempts - 1), MAX_BACKOFF_MS);

async function deleteImage(uri?: string | null) {
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    logger.warn('Failed to delete offline scan image', error);
  }
}

async function sendItem(item: QueuedScan) {
  await updateItem(item.id, { status: 'uploading', uploadStartedAt: Date.now() });

  const info = item.imageUri ? await FileSystem.getInfoAsync(item.imageUri) : { exists: false };
  if (!info.exists) {
    await finishItem(item, 'failed', { errorMessage: 'Saved photo is missing' });
    return;
  }

  const outcome = await submitScan({
    imageUri: item.imageUri as string,
    severity: item.severity,
    language: item.language,
  });

  switch (outcome.kind) {
    case 'diagnosed':
    case 'rejected':
      logger.info('Offline scan diagnosed', { id: item.id, status: outcome.scan?.status });
      await finishItem(item, 'diagnosed', {
        result: buildScanResult(outcome.scan, item.language),
        serverScanId: outcome.scan?._id,
      });
      return;
    case 'quality':
      await finishItem(item, 'failed', { qualityRejected: true, errorMessage: outcome.message });
      return;
    case 'limit':
      await finishItem(item, 'failed', { planLimited: true, errorMessage: outcome.message });
      return;
    case 'unavailable': {
      // Still offline, weak signal or the AI is busy: keep the photo and try later
      const attempts = item.attempts + 1;
      logger.warn('Offline scan will be retried', { id: item.id, attempts });
      await updateItem(item.id, {
        status: 'queued',
        attempts,
        nextAttemptAt: Date.now() + backoffMs(attempts),
        errorMessage: outcome.message,
      });
      return;
    }
    default:
      logger.error('Offline scan rejected by the server', { id: item.id, message: outcome.message });
      await finishItem(item, 'failed', { errorMessage: outcome.message });
  }
}

async function finishItem(item: QueuedScan, status: 'diagnosed' | 'failed', changes: Partial<QueuedScan>) {
  const finished = { ...item, ...changes, status };
  const notifiedAt = (await notifyFarmer(finished)) ? Date.now() : undefined;
  await updateItem(item.id, { ...changes, status, notifiedAt, imageUri: null });
  await deleteImage(item.imageUri);
}

let processing: Promise<void> | null = null;
// A trigger that arrived while a run was in progress; served by another pass
let pendingRun: { force: boolean } | null = null;

/**
 * Send the photos that are due. Safe to call often: a call during a run
 * schedules one more pass after it, so a "back online" trigger is never lost.
 * @param force - send every waiting photo now, ignoring the retry backoff.
 *   Used when the network returns or the app opens; the background task waits for the backoff.
 */
export function processOfflineScans({ force = false } = {}) {
  if (processing) {
    pendingRun = { force: force || !!pendingRun?.force };
    return processing;
  }
  processing = (async () => {
    let run: { force: boolean } | null = { force };
    while (run) {
      pendingRun = null;
      await runQueue(run.force);
      run = pendingRun;
    }
  })().finally(() => { processing = null; });
  return processing;
}

async function runQueue(force: boolean) {
  // Scans queued before diagnosis happened in the request were already uploaded
  // and are listed (with Try again) from the server's history
  await updateQueue(queue => queue.filter(item => (item.status as string) !== 'analyzing'));

  if (!(await isOnline())) return;

  const now = Date.now();
  for (const item of await getQueue()) {
    const staleUpload = item.status === 'uploading' && now - (item.uploadStartedAt || 0) > STALE_UPLOAD_MS;
    const due = item.status === 'queued' && (force || item.nextAttemptAt <= now);
    if (due || staleUpload) {
      await sendItem(item);
    }
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
  maize: 'Masara', rice: 'Shinkafa', tomato: 'Tumatur', bean: 'Wake', beans: 'Wake', cassava: 'Rogo',
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
    const cropType: string | undefined = item.result?.cropType;
    const crop = cropType
      ? isHausa ? CROP_NAMES_HA[cropType] || cropType : cropType.charAt(0).toUpperCase() + cropType.slice(1)
      : null;
    const subject = crop ? `${crop}: ` : '';
    const diagnosis = item.result?.name || item.result?.disease;

    const content = item.planLimited
      ? {
          title: isHausa ? 'Iyakar tsarinka ta cika' : 'Daily limit reached',
          body: isHausa
            ? 'Ba a binciki hotonka ba saboda iyakar tsarinka ta yau. Danna don duba tsare-tsare.'
            : "Your photo wasn't diagnosed because you've used today's diagnoses. Tap to see plans.",
        }
      : item.qualityRejected
      ? {
          title: isHausa ? 'Hoton bai fito sarai ba' : 'Your photo was too unclear',
          body: isHausa
            ? 'Ba a iya binciken hoton ba. Danna don ɗaukar sabo.'
            : "We couldn't diagnose it. Tap to take a new one.",
        }
      : item.status === 'diagnosed' && item.result?.status === 'rejected'
      ? {
          title: isHausa ? 'Ba a iya gane matsalar ba' : "Couldn't diagnose your photo",
          body: describeRejection(item.result?.rejection, isHausa),
        }
      : item.status === 'diagnosed' && item.result?.lowConfidence
      ? {
          // No treatment for unconfirmed results: point to the free expert review
          title: isHausa ? 'Ba a tabbatar da sakamakon ba' : 'Result not confirmed',
          body: isHausa
            ? `${subject}wataƙila ${diagnosis}. Danna don tambayar kwararre kyauta.`
            : `${subject}possibly ${diagnosis}. Tap to ask an expert for free.`,
        }
      : item.status === 'diagnosed'
      ? {
          title: isHausa ? 'Sakamakon binciken ya shirya' : 'Your scan result is ready',
          body: isHausa
            ? `${subject}${diagnosis}. Danna don ganin magani.`
            : `${subject}${diagnosis}. Tap to see the treatment.`,
        }
      : {
          title: isHausa ? 'An kasa binciken hoto' : "Your photo couldn't be diagnosed",
          body: isHausa ? 'Danna don ɗaukar sabon hoto.' : 'Tap to take a new one.',
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
 * Re-register the background task on startup if photos are still waiting
 */
export async function resumeBackgroundSyncIfNeeded() {
  if ((await getQueue()).some(isActive)) {
    await registerBackgroundSync();
  }
}

export default {
  enqueueScan,
  processOfflineScans,
  getQueue,
  getQueuedScan,
  onQueueChange,
  resumeBackgroundSyncIfNeeded,
};
