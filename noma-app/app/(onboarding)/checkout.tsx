import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { startCheckout } from "@/src/services/paymentFlow";
import { BillingInterval, PlanId } from "@/src/api/payments.api";
import { useAlert } from '@/src/context/AlertContext';
import { useLanguage } from '@/src/context/LanguageContext';
import logger from '@/src/utils/logger';
import RequireAccess from '@/app/components/RequireAccess';

const COLORS = {
  primary: "#16A34A",
  primaryLight: "#f0fdf4",
  background: "#f8f8f8",
  white: "#ffffff",
  textDark: "#1f2937",
  textLight: "#6b7280",
  border: "#e5e7eb",
  error: "#dc2626",
};

const CheckoutScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showAlert } = useAlert();
  const { language } = useLanguage();
  const isHausa = language === 'hausa';

  const planId = params.planId as PlanId;
  const planName = params.planName as string;
  // Display only: the backend sets the price charged
  const amount = Number(params.amount);
  const billing = params.billing as BillingInterval;

  const [starting, setStarting] = useState(false);

  const handlePay = async () => {
    setStarting(true);
    try {
      const txnRef = await startCheckout({ plan: planId, interval: billing });
      // Whatever happened in the browser, the result screen asks the backend
      router.replace({ pathname: "/payment", params: { txnRef } });
    } catch (error: any) {
      logger.error('Starting checkout failed', error);
      const unavailable = error?.code === 'PAYMENT_INIT_FAILED' || error?.code === 'PAYMENTS_UNAVAILABLE';
      const offline = error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT_ERROR';
      showAlert({
        title: isHausa ? 'Kuskure' : 'Error',
        message: offline
          ? (isHausa ? 'Babu intanet. Ka duba hanyar sadarwarka ka sake gwadawa.' : 'No internet connection. Check your network and try again.')
          : unavailable
          ? (isHausa ? 'Ba a iya fara biya yanzu ba. Ka sake gwadawa anjima.' : "Payments can't be started right now. Try again later.")
          : (isHausa ? 'An kasa bude shafin biya. Ka sake gwadawa.' : "Couldn't open the payment page. Try again."),
        buttons: [{ text: isHausa ? 'Yarda' : 'OK' }]
      });
    } finally {
      setStarting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          disabled={starting}
        >
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Order Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryPlanName}>{planName} Plan</Text>
            <Text style={styles.summaryBilling}>
              {billing === 'yearly'
                ? (isHausa ? 'Biya na shekara' : 'Billed yearly')
                : (isHausa ? 'Biya na wata' : 'Billed monthly')}
            </Text>
          </View>
          <View style={styles.summaryLockRow}>
            <Ionicons name="lock-closed" size={12} color={COLORS.primary} />
            <Text style={styles.summarySecure}>Secure</Text>
          </View>
        </View>

        <View style={[styles.summaryLine, styles.summaryTotal]}>
          <Text style={styles.summaryTotalLabel}>{isHausa ? 'Jimilla' : 'Total today'}</Text>
          <Text style={styles.summaryTotalValue}>₦{amount.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.payInfo}>
        <Ionicons name="open-outline" size={18} color={COLORS.textLight} />
        <Text style={styles.payInfoText}>
          {isHausa
            ? 'Za a bude shafin biya mai tsaro. Bayan ka biya, za a dawo da kai nan.'
            : "You'll pay on a secure payment page, then come back here."}
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity
        style={[styles.payBtn, starting && { opacity: 0.7 }]}
        onPress={handlePay}
        disabled={starting}
      >
        {starting ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.payBtnText}>
            {isHausa ? `Biya ₦${amount.toLocaleString()}` : `Pay ₦${amount.toLocaleString()}`}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footNote}>
        Powered by Zainpay & Paystack · 256-bit SSL
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  summary: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  summaryPlanName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 3,
  },
  summaryBilling: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  summaryLockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  summarySecure: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  summaryValue: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  summaryTotal: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 0,
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  summaryTotalValue: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  payInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 20,
    paddingHorizontal: 4,
  },
  payInfoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 19,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    marginHorizontal: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
  },
  footNote: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: "center",
    paddingVertical: 12,
  },
});

export default function CheckoutScreenWithAccess() {
  return (
    <RequireAccess feature="subscription">
      <CheckoutScreen />
    </RequireAccess>
  );
}
