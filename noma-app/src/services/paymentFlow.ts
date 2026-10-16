// Payment Flow
// Opens the backend checkout page in a secure browser session, then asks the
// backend for the final state. The backend upgrades the subscription itself
// (webhook), so verify is the source of truth, not the redirect's status.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
  initializePayment,
  verifyPayment,
  BillingInterval,
  PaymentProvider,
  PlanId,
  VerifyResult,
} from '@/src/api/payments.api';
import { getCurrentUser } from '@/src/api/auth.api';
import { getUserData, setUserData } from '@/src/hooks/useAuth';
import logger from '@/src/utils/logger';

const PENDING_PAYMENT_KEY = '@nomaapp_pending_payment';
const VERIFY_INTERVAL_MS = 4000;
const VERIFY_MAX_WAIT_MS = 60000;
const PENDING_PAYMENT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Must match the backend's PAYMENT_APP_REDIRECT_URL (nomaapp://payment)
export const PAYMENT_RETURN_PATH = 'payment';

// Return links for these checkouts are handled by the screen that opened the browser,
// so the router must not also open a result screen for them
const handledInApp = new Set<string>();

export const isHandledInApp = (txnRef: string | null) => !!txnRef && handledInApp.has(txnRef);

export interface PendingPayment {
  txnRef: string;
  plan: PlanId;
  interval: BillingInterval;
  startedAt: number;
}

export async function getPendingPayment(): Promise<PendingPayment | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_PAYMENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearPendingPayment() {
  try {
    await AsyncStorage.removeItem(PENDING_PAYMENT_KEY);
  } catch {}
}

/**
 * Create a checkout and open it. Resolves with the txnRef once the browser
 * closes, whether the payer paid, cancelled or just closed it.
 */
export async function startCheckout({ plan, interval, provider }: {
  plan: PlanId;
  interval: BillingInterval;
  provider?: PaymentProvider;
}): Promise<string> {
  const returnUrl = Linking.createURL(PAYMENT_RETURN_PATH, { scheme: 'nomaapp' });

  const session = await initializePayment({ plan, interval, redirectUrl: returnUrl, provider });
  logger.info('Checkout created', { provider: session.provider, txnRef: session.txnRef });

  handledInApp.add(session.txnRef);
  await AsyncStorage.setItem(
    PENDING_PAYMENT_KEY,
    JSON.stringify({ txnRef: session.txnRef, plan, interval, startedAt: Date.now() } as PendingPayment)
  );

  await WebBrowser.openAuthSessionAsync(session.checkoutUrl, returnUrl);
  return session.txnRef;
}

/**
 * Verify, re-checking every few seconds while the payment is still pending
 */
export async function verifyUntilSettled(
  txnRef: string,
  { maxWaitMs = VERIFY_MAX_WAIT_MS, isCancelled }: { maxWaitMs?: number; isCancelled?: () => boolean } = {}
): Promise<VerifyResult> {
  const deadline = Date.now() + maxWaitMs;
  let result = await verifyPayment(txnRef);

  while (result.payment.status === 'pending' && Date.now() + VERIFY_INTERVAL_MS < deadline && !isCancelled?.()) {
    await new Promise(resolve => setTimeout(resolve, VERIFY_INTERVAL_MS));
    result = await verifyPayment(txnRef);
  }

  if (result.payment.status !== 'pending') {
    await clearPendingPayment();
  }
  if (result.payment.status === 'success') {
    await refreshStoredUser(result);
  }
  return result;
}

/**
 * Keep the stored user in step with the new plan so plan-gated screens unlock
 */
async function refreshStoredUser(result: VerifyResult) {
  try {
    const data: any = await getCurrentUser();
    const user = data?.user || data;
    if (user && typeof user === 'object') {
      const currentUser = await getUserData();
      await setUserData({ ...currentUser, ...user });
      return;
    }
  } catch (error) {
    logger.warn('Failed to refresh user after payment', error);
  }

  // Fall back to the subscription returned by verify
  if (result.subscription) {
    const currentUser = await getUserData();
    await setUserData({
      ...currentUser,
      subscription: { ...(currentUser?.subscription || {}), ...result.subscription },
    });
  }
}

/**
 * On launch: settle a checkout the payer never returned from (browser closed,
 * app killed). The backend has already applied it if paid; this updates the app.
 */
export async function resumePendingPayment() {
  const pending = await getPendingPayment();
  if (!pending) return;

  if (Date.now() - pending.startedAt > PENDING_PAYMENT_MAX_AGE_MS) {
    await clearPendingPayment();
    return;
  }

  try {
    await verifyUntilSettled(pending.txnRef, { maxWaitMs: 0 });
  } catch (error: any) {
    if (error?.code === 'PAYMENT_NOT_FOUND' || error?.statusCode === 404) {
      await clearPendingPayment();
    } else {
      logger.warn('Could not check pending payment', error);
    }
  }
}
