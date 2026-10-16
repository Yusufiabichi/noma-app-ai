// Rewrites incoming system links before the router handles them
import { isHandledInApp } from '@/src/services/paymentFlow';

// nomaapp://payment?txnRef=…&status=… (also exp://…/--/payment in Expo Go)
const PAYMENT_LINK = /(^|\/)payment(\?|\/?$)/;

export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  try {
    const withoutScheme = path.replace(/^[a-z][a-z0-9+.-]*:\/\/(\/?--\/)?/i, '');
    if (!PAYMENT_LINK.test(withoutScheme.split('#')[0])) return path;

    const query = withoutScheme.includes('?') ? withoutScheme.slice(withoutScheme.indexOf('?') + 1) : '';
    // React Native's URLSearchParams has no get(), so parse by hand
    const txnRefPair = query.split('&').find(pair => pair.startsWith('txnRef='));
    const txnRef = txnRefPair ? decodeURIComponent(txnRefPair.slice('txnRef='.length)) : null;

    // The checkout screen that opened the browser is already verifying this payment
    if (!initial && isHandledInApp(txnRef)) return '';

    // App was closed during payment (or the link came from elsewhere): show the result screen
    return `/payment${query ? `?${query}` : ''}`;
  } catch {
    return path;
  }
}
