import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useLanguage } from "@/src/context/LanguageContext";
import { VerifyResult, PaymentProvider } from "@/src/api/payments.api";
import { clearPendingPayment, getPendingPayment, startCheckout, verifyUntilSettled } from "@/src/services/paymentFlow";
import { getServerErrorCode } from "@/src/utils/errors";
import logger from "@/src/utils/logger";
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
  errorLight: "#fef2f2",
  amber: "#d97706",
  amberLight: "#fffbeb",
};

type Stage = "verifying" | "success" | "pending" | "failed" | "error" | "restarting";

const PaymentResultScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ txnRef?: string }>();
  const { language } = useLanguage();
  const isHausa = language === "hausa";
  const t = (ha: string, en: string) => (isHausa ? ha : en);

  const [txnRef, setTxnRef] = useState<string | null>(params.txnRef || null);
  const [stage, setStage] = useState<Stage>("verifying");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const unmounted = useRef(false);

  useEffect(() => () => { unmounted.current = true; }, []);

  // Opened without a txnRef (e.g. link from the web page): use the checkout we started
  useEffect(() => {
    if (txnRef) return;
    getPendingPayment().then(pending => {
      if (pending) setTxnRef(pending.txnRef);
      else {
        setStage("error");
        setErrorMessage(t("Ba a sami biyan da za a duba ba.", "There's no payment to check."));
      }
    });
  }, []);

  const runVerify = async (ref: string) => {
    setStage("verifying");
    setErrorMessage(null);
    try {
      const verified = await verifyUntilSettled(ref, { isCancelled: () => unmounted.current });
      // Shown now; a payment still pending is activated by the backend's webhook
      await clearPendingPayment();
      if (unmounted.current) return;
      setResult(verified);
      setStage(verified.payment.status);
    } catch (error: any) {
      logger.error("Payment verification failed", error);
      const notFound = getServerErrorCode(error) === "PAYMENT_NOT_FOUND" || error?.statusCode === 404;
      if (notFound) await clearPendingPayment();
      if (unmounted.current) return;
      setStage("error");
      setErrorMessage(
        error?.code === "NETWORK_ERROR" || error?.code === "TIMEOUT_ERROR"
          ? t("Babu intanet. Ka duba hanyar sadarwarka ka sake dubawa.", "No internet connection. Check your network and check again.")
          : notFound
          ? t("Ba a sami wannan biyan ba.", "This payment couldn't be found.")
          : t("An kasa duba matsayin biyan. Ka sake dubawa.", "Couldn't check the payment. Check again.")
      );
    }
  };

  useEffect(() => {
    if (txnRef) runVerify(txnRef);
  }, [txnRef]);

  const retry = async (provider?: PaymentProvider) => {
    if (!result) return;
    setStage("restarting");
    try {
      const newRef = await startCheckout({
        plan: result.payment.plan,
        interval: result.payment.interval,
        provider,
      });
      if (newRef === txnRef) runVerify(newRef);
      else setTxnRef(newRef);
    } catch (error: any) {
      logger.error("Restarting checkout failed", error);
      setStage("failed");
      const code = getServerErrorCode(error);
      setErrorMessage(
        code === "PAYMENT_INIT_FAILED" || code === "PAYMENTS_UNAVAILABLE"
          ? t("Ba a iya biya yanzu ba. Ka sake gwadawa nan ba da jimawa ba.", "Payments are unavailable right now, please try again shortly.")
          : t("An kasa bude shafin biya. Ka sake gwadawa.", "Couldn't open the payment page. Try again.")
      );
    }
  };

  const planName = result?.payment.plan
    ? result.payment.plan.charAt(0).toUpperCase() + result.payment.plan.slice(1)
    : "";
  const periodEnd = result?.subscription?.currentPeriodEnd
    ? format(new Date(result.subscription.currentPeriodEnd), "d MMM yyyy")
    : null;
  const goHome = () => router.replace("/(tabs)");

  const content = (() => {
    switch (stage) {
      case "verifying":
      case "restarting":
        return {
          icon: null,
          title: stage === "verifying"
            ? t("Ana tabbatar da biyan kudinka...", "Confirming your payment...")
            : t("Ana bude shafin biya...", "Opening the payment page..."),
          body: t("Kada ka rufe manhajar.", "Keep the app open."),
        };
      case "success":
        return {
          icon: { name: "checkmark-circle", color: COLORS.primary, bg: COLORS.primaryLight },
          title: t("Biya ya yi nasara", "Payment successful"),
          body: periodEnd
            ? t(`Kana kan tsarin ${planName} har zuwa ${periodEnd}.`, `You're on ${planName} until ${periodEnd}.`)
            : t(`Tsarin ${planName} dinka yanzu yana aiki.`, `Your ${planName} plan is now active.`),
        };
      case "pending":
        return {
          icon: { name: "time-outline", color: COLORS.amber, bg: COLORS.amberLight },
          title: t("Ba a tabbatar da biyan ba tukuna", "Payment not confirmed yet"),
          body: t(
            "Za mu sabunta tsarinka da zarar an tabbatar da biyan.",
            "We'll update your plan as soon as the payment is confirmed."
          ),
        };
      case "failed":
        return {
          icon: { name: "close-circle", color: COLORS.error, bg: COLORS.errorLight },
          title: t("Biyan bai yi nasara ba", "Payment didn't go through"),
          body: errorMessage || t(
            "Ba a kammala biyan ba. Za ka iya sake gwadawa ko ka biya ta wata hanya.",
            "The payment wasn't completed. You can try again or pay with another method."
          ),
        };
      default:
        return {
          icon: { name: "alert-circle-outline", color: COLORS.error, bg: COLORS.errorLight },
          title: t("An kasa duba biyan", "Couldn't check the payment"),
          body: errorMessage || "",
        };
    }
  })();

  const busy = stage === "verifying" || stage === "restarting";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 36 }} />
        <Text style={styles.headerTitle}>{t("Biya", "Payment")}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        {content.icon ? (
          <View style={[styles.iconCircle, { backgroundColor: content.icon.bg }]}>
            <Ionicons name={content.icon.name as any} size={40} color={content.icon.color} />
          </View>
        ) : (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
        )}
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.message}>{content.body}</Text>
      </View>

      {!busy && (
        <View style={styles.actions}>
          {stage === "success" && (
            <TouchableOpacity style={styles.primaryBtn} onPress={goHome}>
              <Text style={styles.primaryBtnText}>{t("Ci gaba", "Continue")}</Text>
            </TouchableOpacity>
          )}

          {stage === "failed" && (
            <>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => retry()}>
                <Text style={styles.primaryBtnText}>{t("Sake gwadawa", "Try again")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => retry("paystack")}>
                <Text style={styles.secondaryBtnText}>{t("Biya ta wata hanya", "Pay with another method")}</Text>
              </TouchableOpacity>
            </>
          )}

          {(stage === "pending" || stage === "error") && txnRef && (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => runVerify(txnRef)}>
              <Text style={styles.primaryBtnText}>{t("Sake dubawa", "Check again")}</Text>
            </TouchableOpacity>
          )}

          {stage !== "success" && (
            <TouchableOpacity
              style={styles.textBtn}
              onPress={() => (stage === "pending" ? goHome() : router.replace("/(onboarding)/plans"))}
            >
              <Text style={styles.textBtnText}>
                {stage === "pending" ? t("Ci gaba", "Continue") : t("Koma ga tsare-tsare", "Back to plans")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
  headerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textDark },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  spinner: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.textDark, textAlign: "center", marginBottom: 8 },
  message: { fontSize: 14, color: COLORS.textLight, textAlign: "center", lineHeight: 21 },
  actions: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
  secondaryBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: { color: COLORS.textDark, fontSize: 15, fontWeight: "600" },
  textBtn: { paddingVertical: 12, alignItems: "center" },
  textBtnText: { color: COLORS.textLight, fontSize: 14, fontWeight: "600" },
});

export default function PaymentResultScreenWithAccess() {
  return (
    <RequireAccess feature="subscription">
      <PaymentResultScreen />
    </RequireAccess>
  );
}
