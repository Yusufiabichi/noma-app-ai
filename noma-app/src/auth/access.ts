// Access rules
// Single source of truth for which role and subscription each feature needs.
// This only decides what the app shows: the backend must enforce the same
// rules on its endpoints, because app checks can be bypassed.

export type Role = 'farmer' | 'expert' | 'admin';
export type Tier = 'free' | 'basic' | 'premium';

export type Feature =
  | 'cropScan'
  | 'scanHistory'
  | 'cropGuides'
  | 'voiceAssistant'
  | 'expertChat'
  | 'myCases'
  | 'expertWorkspace'
  | 'adminConsole'
  | 'subscription';

interface FeatureRule {
  roles: Role[];
  /** Lowest plan a farmer needs. Experts and admins are staff and aren't plan-gated. */
  tier: Tier;
}

export const FEATURES: Record<Feature, FeatureRule> = {
  cropScan:        { roles: ['farmer', 'expert'],          tier: 'free' },  // daily scan limit is enforced by the server
  scanHistory:     { roles: ['farmer', 'expert'],          tier: 'free' },
  cropGuides:      { roles: ['farmer', 'expert', 'admin'], tier: 'free' },  // disease guide, farming tips, fertilizer advice, weather
  voiceAssistant:  { roles: ['farmer', 'expert'],          tier: 'basic' }, // "Voiced treatment" on the plans screen
  expertChat:      { roles: ['farmer'],                    tier: 'basic' }, // browse experts and file new cases
  myCases:         { roles: ['farmer'],                    tier: 'free' },  // farmers keep access to their past cases after a downgrade
  expertWorkspace: { roles: ['expert'],                    tier: 'free' },
  adminConsole:    { roles: ['admin'],                     tier: 'free' },
  subscription:    { roles: ['farmer', 'expert', 'admin'], tier: 'free' },
};

const TIER_RANK: Record<Tier, number> = { free: 0, basic: 1, premium: 2 };

// Diagnoses per day on each plan (matches the plans screen). The server enforces it.
export const DIAGNOSES_PER_DAY: Record<Tier, number> = {
  free: 3,
  basic: 10,
  premium: Infinity,
};

// Expert sessions per month on each plan (matches the plans screen)
export const EXPERT_SESSIONS_PER_MONTH: Record<Tier, number> = {
  free: 0,
  basic: 5,
  premium: Infinity,
};

const TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const parseTime = (value: unknown) => {
  if (!value) return null;
  const time = new Date(value as string).getTime();
  return Number.isNaN(time) ? null : time;
};

export function getRole(user: any): Role | null {
  const role = user?.role;
  return role === 'farmer' || role === 'expert' || role === 'admin' ? role : null;
}

/**
 * The plan the user can actually use right now. Checks expiry locally so a
 * cached user loses access on time even while offline.
 */
export function getEffectiveTier(user: any, now = Date.now()): Tier {
  const subscription = user?.subscription || {};
  const plan = subscription.plan;

  if (subscription.status === 'expired') return 'free';

  if (plan === 'basic' || plan === 'premium') {
    const periodEnd = parseTime(subscription.currentPeriodEnd);
    return periodEnd !== null && periodEnd < now ? 'free' : plan;
  }

  if (plan === 'trial') {
    // The 7-day trial gives full access (as promised on the signup screen)
    const trialEnd =
      parseTime(user?.trialEndDate) ??
      parseTime(subscription.trialEndDate) ??
      parseTime(subscription.currentPeriodEnd) ??
      (parseTime(user?.createdAt) !== null ? (parseTime(user?.createdAt) as number) + TRIAL_DAYS * DAY_MS : null);

    if (trialEnd !== null) return trialEnd > now ? 'premium' : 'free';
    if (typeof user?.trialDaysRemaining === 'number') return user.trialDaysRemaining > 0 ? 'premium' : 'free';
    // No end date known: let the server decide
    return 'premium';
  }

  return 'free';
}

export function isTrialActive(user: any) {
  return user?.subscription?.plan === 'trial' && getEffectiveTier(user) === 'premium';
}

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'signedOut' }
  | { allowed: false; reason: 'wrongRole' }
  | { allowed: false; reason: 'upgrade'; requiredTier: Tier };

/**
 * @param options.skipPlan - check sign-in and role only. Used for expert review of
 *   a low-confidence scan, which the server allows on every plan.
 */
export function checkAccess(user: any, feature: Feature, options: { skipPlan?: boolean } = {}): AccessResult {
  if (!user) return { allowed: false, reason: 'signedOut' };

  const rule = FEATURES[feature];
  const role = getRole(user);
  if (!role || !rule.roles.includes(role)) return { allowed: false, reason: 'wrongRole' };

  if (role !== 'farmer' || options.skipPlan) return { allowed: true };

  const tier = getEffectiveTier(user);
  if (TIER_RANK[tier] < TIER_RANK[rule.tier]) {
    return { allowed: false, reason: 'upgrade', requiredTier: rule.tier };
  }
  return { allowed: true };
}

// Shown for information only: usage resets monthly on the server, so a cached
// count can be stale. The server rejects a new case with SESSION_LIMIT_REACHED.
export function expertSessionsLeft(user: any) {
  const limit = EXPERT_SESSIONS_PER_MONTH[getEffectiveTier(user)];
  return Math.max(0, limit - (user?.usage?.expertSessionsUsed || 0));
}

// Server error codes that mean "your plan doesn't allow this"
export function isPlanLimitError(code: string | undefined | null) {
  return code === 'FEATURE_LOCKED' || code === 'PLAN_REQUIRED' || (!!code && /_LIMIT_REACHED$/.test(code));
}
