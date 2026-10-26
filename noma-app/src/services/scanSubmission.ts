// Scan Submission
// The server diagnoses the photo while the request is open, so a submission
// ends in one of a few outcomes. Screens and the offline queue branch on these
// instead of on HTTP details. The AI's messages are English; the ones we
// recognise are translated here for Hausa users.

import { createScan, retryScanDiagnosis } from '@/src/api/scans.api';
import { isPlanLimitError } from '@/src/auth/access';
import { getServerErrorCode } from '@/src/utils/errors';
import logger from '@/src/utils/logger';

export type Severity = 'low' | 'moderate' | 'high';
export type ScanLanguage = 'en' | 'ha';

export type ScanOutcome =
  // 201: diagnosed (may still be low confidence)
  | { kind: 'diagnosed'; scan: any }
  // 201: the photo was fine but the AI couldn't diagnose it; saved in history
  | { kind: 'rejected'; scan: any }
  // 422 IMAGE_QUALITY_REJECTED: photo unusable, nothing saved
  | { kind: 'quality'; message: string; reason?: string }
  // 403 DIAGNOSIS_LIMIT_REACHED
  | { kind: 'limit'; message: string }
  // 503 AI_*, other 5xx, network error or timeout: nothing saved, same photo can be resent
  | { kind: 'unavailable'; message?: string }
  // 400: a bug if it happens often
  | { kind: 'invalid'; message: string; code?: string };

const AI_UNAVAILABLE_CODES = new Set(['AI_UNAVAILABLE', 'AI_TIMEOUT', 'AI_SERVICE_ERROR']);
const CONNECTION_CODES = new Set(['NETWORK_ERROR', 'TIMEOUT_ERROR', 'NO_INTERNET']);

export function outcomeFromScan(scan: any): ScanOutcome {
  if (scan?.status === 'rejected') return { kind: 'rejected', scan };
  if (scan?.status === 'diagnosed') return { kind: 'diagnosed', scan };
  // An old scan whose retry still didn't finish
  return { kind: 'unavailable', message: scan?.error?.message };
}

export function outcomeFromError(error: any): ScanOutcome {
  const code = getServerErrorCode(error);
  const status = error?.statusCode;
  const message = error?.message || '';

  if (code === 'IMAGE_QUALITY_REJECTED' || status === 422) {
    const details = error?.originalError?.response?.data?.error?.details;
    return { kind: 'quality', message, reason: details?.reason };
  }
  if (code === 'DIAGNOSIS_LIMIT_REACHED' || isPlanLimitError(code)) {
    return { kind: 'limit', message };
  }
  // 401: signed out mid-request; the client handles sign-in, the photo can be sent again
  if (AI_UNAVAILABLE_CODES.has(code) || CONNECTION_CODES.has(error?.code) || !status || status >= 500 || status === 401) {
    return { kind: 'unavailable', message };
  }
  return { kind: 'invalid', message, code: code || undefined };
}

export async function submitScan({ imageUri, severity, language }: {
  imageUri: string;
  severity?: Severity | null;
  language: ScanLanguage;
}): Promise<ScanOutcome> {
  try {
    const body: any = await createScan({ imageUri, severity: severity || undefined, language });
    const scan = body?.data?.scan;
    if (!scan) return { kind: 'unavailable' };
    return outcomeFromScan(scan);
  } catch (error: any) {
    const outcome = outcomeFromError(error);
    logger.warn('Scan submission ended without a diagnosis', { kind: outcome.kind, code: getServerErrorCode(error) });
    return outcome;
  }
}

/**
 * Diagnose an old pending/failed scan (from before diagnosis happened in the request)
 */
export async function retryOldScan(scanId: string, options: { severity?: Severity; language?: ScanLanguage } = {}): Promise<ScanOutcome> {
  try {
    const body: any = await retryScanDiagnosis(scanId, options);
    return outcomeFromScan(body?.data?.scan);
  } catch (error: any) {
    return outcomeFromError(error);
  }
}

// ─── Messages ─────────────────────────────────────────────────────────────────

type Bilingual = { en: string; ha: string };

const QUALITY_REASONS: { match: RegExp; problem: Bilingual; tip: Bilingual }[] = [
  {
    match: /blur|focus|shak/,
    problem: { en: 'The photo is blurry.', ha: 'Hoton ya yi dishi-dishi.' },
    tip: {
      en: 'Hold the phone still, and tap the leaf on the screen so it comes into focus.',
      ha: 'Riƙe wayar ba motsi, ka taɓa ganyen a allo don ya fito sarai.',
    },
  },
  {
    match: /dark|underexpos|low.?light/,
    problem: { en: 'The photo is too dark.', ha: 'Hoton ya yi duhu sosai.' },
    tip: { en: 'Take the photo outside in daylight.', ha: 'Ka ɗauki hoton a waje cikin hasken rana.' },
  },
  {
    match: /bright|overexpos|glare|wash/,
    problem: { en: 'There is too much light on the leaf.', ha: 'Haske ya yi yawa a kan ganyen.' },
    tip: {
      en: 'Stand so your body shades the leaf from direct sun.',
      ha: 'Tsaya ta yadda jikinka zai ba ganyen inuwa daga rana kai tsaye.',
    },
  },
  {
    match: /small|resolution|detail|far|distance|tiny/,
    problem: { en: 'The leaf is too small in the photo.', ha: 'Ganyen ya yi ƙanƙanta a cikin hoton.' },
    tip: { en: 'Move closer so one leaf fills the frame.', ha: 'Matso kusa har ganye ɗaya ya cika firam.' },
  },
];

export const CAPTURE_TIPS: Bilingual[] = [
  { en: 'One leaf', ha: 'Ganye ɗaya' },
  { en: 'Fill the frame', ha: 'Cika firam ɗin' },
  { en: 'Daylight', ha: 'Hasken rana' },
  { en: 'Hold steady', ha: 'Riƙe waya ba motsi' },
];

/**
 * What went wrong with an unusable photo, and how to take a better one
 */
export function describeQualityRejection(outcome: { message: string; reason?: string }, isHausa: boolean) {
  const known = outcome.reason ? QUALITY_REASONS.find(r => r.match.test(outcome.reason!.toLowerCase())) : undefined;
  const fallback = isHausa ? 'Ba a iya amfani da wannan hoton ba.' : "This photo can't be used.";
  return {
    // English users get the server's own words; Hausa users get ours when we recognise the reason
    problem: isHausa && known ? known.problem.ha : outcome.message || (known ? known.problem.en : fallback),
    tip: known ? (isHausa ? known.tip.ha : known.tip.en) : null,
  };
}

const REJECTION_REASONS: { match: RegExp; text: Bilingual }[] = [
  {
    match: /not.?a.?plant|no.?plant|no.?leaf|not.?a.?leaf|non.?plant/,
    text: { en: "This doesn't look like a plant leaf.", ha: 'Wannan bai yi kama da ganyen shuka ba.' },
  },
  {
    match: /unsupported|unknown.?crop|crop.?not/,
    text: { en: "We can't diagnose this crop yet.", ha: 'Ba mu iya binciken wannan amfanin gona ba tukuna.' },
  },
  {
    match: /confiden|unsure|uncertain/,
    text: { en: "We couldn't tell what is wrong from this photo.", ha: 'Ba mu iya gane matsalar daga wannan hoton ba.' },
  },
];

/**
 * Why the AI couldn't diagnose a (good) photo
 */
export function describeRejection(rejection: any, isHausa: boolean) {
  const key = String(rejection?.code || rejection?.reason || '').toLowerCase();
  const known = key ? REJECTION_REASONS.find(r => r.match.test(key)) : undefined;
  if (isHausa && known) return known.text.ha;
  return rejection?.message || (known ? known.text.en : isHausa
    ? 'Ba mu iya gane matsalar daga wannan hoton ba.'
    : "We couldn't diagnose this photo.");
}

export const SEVERITY_LABELS: Record<Severity, Bilingual> = {
  low: { en: 'Low', ha: 'Kadan' },
  moderate: { en: 'Moderate', ha: 'Matsakaici' },
  high: { en: 'High', ha: 'Mai yawa' },
};
