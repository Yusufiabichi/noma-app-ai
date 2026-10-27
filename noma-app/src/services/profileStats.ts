// Profile stats
// Real scan totals for the profile: total, healthy, issues and diagnoses used today.
// Uses GET /scans/stats when it returns numbers, otherwise counts from the
// farmer's latest scans. The last result is cached for offline display.
//
// Diagnoses used today: a server count when /scans/stats sends one that clearly
// means usage, otherwise today's diagnosed scans counted here. Rejected and
// unusable photos don't use up a diagnosis, so they're never counted.

import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/src/api/client';
import { getScans, getScanStats } from '@/src/api/scans.api';
import { DIAGNOSES_PER_DAY, getEffectiveTier, getRole } from '@/src/auth/access';
import logger from '@/src/utils/logger';

const CACHE_KEY = '@nomaapp_profile_stats';
const SAMPLE_SIZE = 100;

export interface ProfileStats {
  total: number;
  healthy: number;
  issues: number;
  /** Photos the AI couldn't diagnose, if known */
  rejected?: number | null;
  /** Diagnoses used today (rejected photos excluded), if known */
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

const isToday = (value: string | number) => {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

// Above the largest daily limit (basic: 10), so a full day always fits
const TODAY_SAMPLE_SIZE = 20;

/**
 * Diagnosed scans created today. Throws when the list can't be loaded, so a
 * failed request never shows as "nothing used".
 */
async function countDiagnosedToday(): Promise<number> {
  const body: any = await apiClient.get(`/scans?page=1&limit=${TODAY_SAMPLE_SIZE}&status=diagnosed`);
  const scans: any[] = body?.data?.scans || body?.scans || (Array.isArray(body?.data) ? body.data : []);
  return scans.filter((scan) => scan?.status === 'diagnosed' && scan.createdAt && isToday(scan.createdAt)).length;
}

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
    rejected: firstNumber(stats, ['rejectedScans', 'rejected']),
    // Only fields that mean diagnoses used; a plain "today" may include rejected photos
    today: firstNumber(stats, ['diagnosesToday', 'diagnosesUsedToday', 'dailyUsed']),
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
    rejected: scans.filter((scan: any) => scan.status === 'rejected').length,
    today: diagnosed.filter((scan: any) => scan.createdAt && isToday(scan.createdAt)).length,
    remainingToday: null,
    updatedAt: Date.now(),
  };
}

export async function getCachedProfileStats(): Promise<ProfileStats | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const cached: ProfileStats | null = raw ? JSON.parse(raw) : null;
    // Today's usage from an earlier day would show the wrong scans left
    if (cached && !isToday(cached.updatedAt)) {
      return { ...cached, today: null, remainingToday: null };
    }
    return cached;
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
  if (stats && stats.remainingToday === null && stats.today === null) {
    try {
      stats.today = await countDiagnosedToday();
    } catch (error) {
      logger.warn("Could not count today's diagnoses", error);
    }
  }
  if (stats) {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(stats));
    } catch {}
  }
  return stats;
}

// ─── Scans left today ─────────────────────────────────────────────────────────

/**
 * Diagnoses the farmer can still run today: Infinity when the plan has no daily
 * limit, null when unknown. Prefers counts made from fresh data over the cached
 * user's scansRemaining, which can be from an earlier day.
 */
export function computeScansLeft(stats: ProfileStats | null, user: any): number | null {
  const limit = DIAGNOSES_PER_DAY[getEffectiveTier(user)];
  if (!Number.isFinite(limit)) return Infinity;

  if (typeof stats?.remainingToday === 'number') return Math.max(0, stats.remainingToday);
  if (typeof stats?.today === 'number') return Math.max(0, limit - stats.today);
  const serverRemaining = user?.subscription?.scansRemaining;
  return typeof serverRemaining === 'number' ? Math.max(0, serverRemaining) : null;
}

/**
 * Checked before every diagnosis. Online it loads fresh numbers; offline (or if
 * that fails) it uses today's cached ones. Only farmers have a daily limit.
 */
export async function getScansLeftToday(user: any, { online = true } = {}): Promise<number | null> {
  if (getRole(user) !== 'farmer') return Infinity;
  if (!Number.isFinite(DIAGNOSES_PER_DAY[getEffectiveTier(user)])) return Infinity;

  const fresh = online ? await fetchProfileStats().catch(() => null) : null;
  return computeScansLeft(fresh ?? (await getCachedProfileStats()), user);
}
