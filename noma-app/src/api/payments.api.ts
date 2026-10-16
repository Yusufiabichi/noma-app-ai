/**
 * Payments API
 * Subscription checkout through the backend (Zainpay, with Paystack fallback)
 *
 * Endpoints:
 * - GET  /payments/plans
 * - POST /payments/initialize
 * - GET  /payments/verify/:txnRef
 * - GET  /payments/history
 */

import client from './client';

export type PlanId = 'basic' | 'premium';
export type BillingInterval = 'monthly' | 'yearly';
export type PaymentProvider = 'zainpay' | 'paystack';
export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface PlanPrice {
  amount: number;
  currency: string;
  days: number;
}

export interface PaidPlan {
  plan: PlanId;
  pricing: Record<BillingInterval, PlanPrice>;
  diagnosisPerDay?: number;
  expertSessions?: number;
  features?: Record<string, unknown>;
}

export interface CheckoutSession {
  provider: PaymentProvider;
  txnRef: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  plan: PlanId;
  interval: BillingInterval;
}

export interface VerifyResult {
  payment: {
    txnRef: string;
    provider: PaymentProvider;
    plan: PlanId;
    interval: BillingInterval;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paidAt?: string;
  };
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd?: string;
  };
}

export const getPlans = async (): Promise<PaidPlan[]> => {
  const response: any = await client.get('/payments/plans');
  return response?.data?.plans || [];
};

/**
 * Start a checkout. The backend sets the price; never send an amount.
 */
export const initializePayment = async (payload: {
  plan: PlanId;
  interval: BillingInterval;
  redirectUrl?: string;
  provider?: PaymentProvider;
}): Promise<CheckoutSession> => {
  const response: any = await client.post('/payments/initialize', { ...payload, platform: 'mobile' });
  return response.data;
};

/**
 * Safe to call repeatedly; a payment is only ever applied once
 */
export const verifyPayment = async (txnRef: string): Promise<VerifyResult> => {
  const response: any = await client.get(`/payments/verify/${encodeURIComponent(txnRef)}`);
  return response.data;
};

export const getPaymentHistory = async () => {
  const response: any = await client.get('/payments/history');
  return response.data;
};

export default {
  getPlans,
  initializePayment,
  verifyPayment,
  getPaymentHistory,
};
