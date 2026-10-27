// Payment Flow
// Opens the backend checkout page, then asks the backend for the final state.
// The backend upgrades the subscription itself (webhook), so verify is the
// source of truth, not the redirect's status. The payer never has to close
// the checkout: on the phone it runs in an in-app page that closes itself when
// the gateway finishes; on web it opens in a window the app closes once verified.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
// Web: how long to keep checking while the payment window stays open, and after it closes
const CHECKOUT_WINDOW_MAX_WAIT_MS = 20 * 60 * 1000;
const AFTER_CHECKOUT_GRACE_MS = 20000;

type Router = { replace: (href: any) => void };

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

const isWeb = Platform.OS === 'web';

// The pending checkout only needs to outlive the trip to the gateway, so web keeps it per tab
const pendingStore = {
  getItem: async (key: string) => (isWeb ? window.sessionStorage.getItem(key) : AsyncStorage.getItem(key)),
  setItem: async (key: string, value: string) =>
    isWeb ? window.sessionStorage.setItem(key, value) : AsyncStorage.setItem(key, value),
  removeItem: async (key: string) => (isWeb ? window.sessionStorage.removeItem(key) : AsyncStorage.removeItem(key)),
};

export async function getPendingPayment(): Promise<PendingPayment | null> {
  try {
    const raw = await pendingStore.getItem(PENDING_PAYMENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearPendingPayment() {
  try {
    await pendingStore.removeItem(PENDING_PAYMENT_KEY);
  } catch {}
}

// ─── Web payment window ───────────────────────────────────────────────────────
// On web the checkout opens in a popup while the app tab verifies, and the app
// closes the popup once the payment is settled, so the payer never has to.

export const CHECKOUT_WINDOW_NAME = 'nomaapp-checkout';
let checkoutWindow: Window | null = null;

/**
 * Web only. Call synchronously in the tap handler, before any await, or the
 * browser blocks the popup. Returns null when blocked (or not on web).
 */
export function openCheckoutWindow(): Window | null {
  if (!isWeb) return null;
  try {
    const popup = window.open('', CHECKOUT_WINDOW_NAME, 'width=480,height=760');
    if (!popup) return null;
    popup.document.title = 'NomaApp';
    popup.document.body.innerHTML =
      '<p style="font-family:sans-serif;color:#0E3B2C;text-align:center;margin-top:40vh">Opening secure checkout…</p>';
    return popup;
  } catch {
    return null;
  }
}

export const isCheckoutWindowOpen = () => !!checkoutWindow && !checkoutWindow.closed;

export function closeCheckoutWindow() {
  try {
    if (checkoutWindow && !checkoutWindow.closed) checkoutWindow.close();
  } catch {}
  checkoutWindow = null;
}

// ─── Phone payment page ───────────────────────────────────────────────────────

/**
 * The checkout is over once the gateway sends the payer to the backend's
 * callback or our return link. The in-app payment page closes itself there,
 * whatever that page would show.
 */
export function isCheckoutFinishedUrl(url: string, returnUrl?: string | null) {
  if (!url) return false;
  if (returnUrl && url.startsWith(returnUrl)) return true;
  return /\/payments\/callback\//i.test(url) || /\/payment\/complete(\?|$)/i.test(url);
}

export interface StartedCheckout {
  txnRef: string;
  checkoutUrl: string;
  /** Where the backend sends the payer back to (mobile) */
  returnUrl: string | null;
}

/**
 * Create a checkout. On the phone, the caller opens it with showCheckout (an
 * in-app page that closes itself when the payment ends). On web it loads in
 * the window from openCheckoutWindow, or, if the popup was blocked, this tab
 * goes to the checkout and the promise never resolves.
 */
export async function startCheckout({ plan, interval, provider, paymentWindow }: {
  plan: PlanId;
  interval: BillingInterval;
  provider?: PaymentProvider;
  paymentWindow?: Window | null;
}): Promise<StartedCheckout> {
  // Web: the backend sends the payer back to its default /payment/complete page
  const returnUrl = isWeb ? undefined : Linking.createURL(PAYMENT_RETURN_PATH, { scheme: 'nomaapp' });

  const session = await initializePayment({
    plan,
    interval,
    redirectUrl: returnUrl,
    provider,
    platform: isWeb ? 'web' : 'mobile',
  });
  logger.info('Checkout created', { provider: session.provider, txnRef: session.txnRef });

  handledInApp.add(session.txnRef);
  await pendingStore.setItem(
    PENDING_PAYMENT_KEY,
    JSON.stringify({ txnRef: session.txnRef, plan, interval, startedAt: Date.now() } as PendingPayment)
  );

  const started = { txnRef: session.txnRef, checkoutUrl: session.checkoutUrl, returnUrl: returnUrl || null };

  if (isWeb) {
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.location.href = session.checkoutUrl;
      checkoutWindow = paymentWindow;
      return started;
    }
    // Popup blocked: pay in this tab; the backend brings the payer back to /payment/complete
    window.location.href = session.checkoutUrl;
    return new Promise<StartedCheckout>(() => {});
  }
  return started;
}

/**
 * Show a started checkout: the in-app payment page on the phone, or straight
 * to the result screen on web (it verifies while the payment window is open).
 */
export function showCheckout(router: Router, started: StartedCheckout) {
  if (isWeb) {
    router.replace({ pathname: '/payment', params: { txnRef: started.txnRef } });
    return;
  }
  router.replace({
    pathname: '/payment/gateway',
    params: { txnRef: started.txnRef, checkoutUrl: started.checkoutUrl, returnUrl: started.returnUrl || '' },
  });
}

/**
 * Verify, re-checking every few seconds while the payment is still pending.
 * @param checkoutOpen - while this returns true (the web payment window is
 *   open) keep checking past maxWaitMs, then allow a short grace period.
 */
export async function verifyUntilSettled(
  txnRef: string,
  { maxWaitMs = VERIFY_MAX_WAIT_MS, isCancelled, checkoutOpen }: {
    maxWaitMs?: number;
    isCancelled?: () => boolean;
    checkoutOpen?: () => boolean;
  } = {}
): Promise<VerifyResult> {
  let deadline = Date.now() + maxWaitMs;
  const hardDeadline = Date.now() + CHECKOUT_WINDOW_MAX_WAIT_MS;
  let result = await verifyPayment(txnRef);

  while (result.payment.status === 'pending' && !isCancelled?.()) {
    if (checkoutOpen?.() && Date.now() < hardDeadline) {
      deadline = Math.max(deadline, Date.now() + AFTER_CHECKOUT_GRACE_MS);
    } else if (Date.now() + VERIFY_INTERVAL_MS >= deadline) {
      break;
    }
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
 * On launch: a checkout the payer never returned from (browser closed, app
 * killed). The result screen verifies it, shows the outcome and clears it.
 */
export async function getLaunchPendingPayment(): Promise<string | null> {
  const pending = await getPendingPayment();
  if (!pending) return null;

  if (Date.now() - pending.startedAt > PENDING_PAYMENT_MAX_AGE_MS) {
    await clearPendingPayment();
    return null;
  }
  return pending.txnRef;
}
