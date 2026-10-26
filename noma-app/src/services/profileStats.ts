// Profile stats
// Real scan totals for the profile: total, healthy, issues and scans used today.
// Uses GET /scans/stats when it returns numbers, otherwise counts from the
// farmer's latest scans. The last result is cached for offline display.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getScans, getScanStats } from '@/src/api/scans.api';
import logger from '@/src/utils/logger';

const CACHE_KEY = '@nomaapp_profile_stats';
const SAMPLE_SIZE = 100;

export interface ProfileStats {
  total: number;
  healthy: number;
  issues: number;
  /** Scans the server counted today, if known */
  today: number | null;
  /** Remaining scans today as reported by the server, if it does */
  remainingToday: number | null;
  updatedAt: number;
}

const firstNumber = (source: any, keys: string[]) => {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
};

const isHealthy = (scan: any) => {
  const label = `${scan?.diagnosis?.disease || scan?.disease || ''} ${scan?.diagnosis?.name || scan?.name || ''}`;
  return /healthy|lafiya/i.test(label);
};

const isToday = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

async function fromStatsEndpoint(): Promise<ProfileStats | null> {
  const response: any = await getScanStats();
  const stats = response?.data?.stats ?? response?.stats ?? response?.data ?? response;

  const total = firstNumber(stats, ['total', 'totalScans', 'scans', 'count']);
  const healthy = firstNumber(stats, ['healthy', 'healthyCount', 'healthyScans']);
  const issues = firstNumber(stats, ['issues', 'issuesCount', 'diseased', 'diseasedCount', 'unhealthy']);
  if (total === null || healthy === null || issues === null) return null;

  return {
    total,
    healthy,
    issues,
    today: firstNumber(stats, ['today', 'scansToday', 'todayCount', 'dailyUsed']),
    remainingToday: firstNumber(stats, ['remainingToday', 'scansRemainingToday', 'dailyRemaining']),
    updatedAt: Date.now(),
  };
}

async function fromRecentScans(): Promise<ProfileStats | null> {
  const { scans, pagination }: any = await getScans({ page: 1, limit: SAMPLE_SIZE });
  // getScans returns an empty list on network errors; don't overwrite good numbers with zeros
  if (!scans.length && !pagination?.total) return null;

  const diagnosed = scans.filter((scan: any) => scan.status === 'diagnosed');
  const healthy = diagnosed.filter(isHealthy).length;

  return {
    total: pagination?.total ?? scans.length,
    healthy,
    issues: diagnosed.length - healthy,
    today: scans.filter((scan: any) => scan.createdAt && isToday(scan.createdAt)).length,
    remainingToday: null,
    updatedAt: Date.now(),
  };
}

export async function getCachedProfileStats(): Promise<ProfileStats | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Fresh stats from the server, or null when offline / unavailable
 */
export async function fetchProfileStats(): Promise<ProfileStats | null> {
  let stats: ProfileStats | null = null;
  try {
    stats = await fromStatsEndpoint();
  } catch (error) {
    logger.warn('Scan stats endpoint unavailable, counting recent scans', error);
  }
  if (!stats) {
    try {
      stats = await fromRecentScans();
    } catch (error) {
      logger.warn('Could not count recent scans', error);
    }
  }
  if (stats) {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(stats));
    } catch {}
  }
  return stats;
}
