import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from "expo-router";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { verifySubscription } from "@/src/api/subscription.api";
import { getUserData, setUserData } from "@/src/hooks/useAuth";

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

// ⚠️ Use your Paystack PUBLIC key here (pk_live_... or pk_test_...)
const PAYSTACK_PUBLIC_KEY = "pk_test_5610b18c5f7d77ae91ac1d74968773165fa29925";

const CheckoutScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const webViewRef = useRef(null);

  const planId = params.planId as string;
  const planName = params.planName as string;
  const amount = Number(params.amount);
  const billing = params.billing as string;

  const [loading, setLoading] = useState(false);
  const [webViewReady, setWebViewReady] = useState(false);

  // VAT 7.5%
  const vat = Math.round(amount * 0.075);
  const total = amount + vat;

  const getUserEmail = async (): Promise<string> => {
    const user = await getUserData();
    return user?.email || user?.phone + "@nomaapp.com"; // fallback if email not stored
  };

  const buildPaystackHTML = (email: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://js.paystack.co/v1/inline.js"></script>
      </head>
      <body style="margin:0;padding:0;background:#f8f8f8;">
        <script>
          window.onload = function() {
            var handler = PaystackPop.setup({
              key: '${PAYSTACK_PUBLIC_KEY}',
              email: '${email}',
              amount: ${total * 100},
              currency: 'NGN',
              metadata: {
                plan: '${planId}',
                billing: '${billing}'
              },
              callback: function(response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  status: 'success',
                  reference: response.reference
                }));
              },
              onClose: function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  status: 'closed'
                }));
              }
            });
            handler.openIframe();
          };
        </script>
      </body>
    </html>
  `;

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.status === "success") {
        setLoading(true);
        try {
          // Verify payment on your backend
          const result = await verifySubscription({
            reference: data.reference,
            plan: planId,
            billing,
          });

          if (result.success) {
            // Update stored user data with new subscription
            const currentUser = await getUserData();
            await setUserData({
              ...currentUser,
              subscription: result.user.subscription,
            });
            Alert.alert(
              "Payment successful!",
              `Your ${planName} plan is now active. Welcome to NomaApp!`,
              [{ text: "Get started", onPress: () => router.replace("/(tabs)") }]
            );
          } else {
            Alert.alert(
              "Verification failed",
              "Payment was received but could not be verified. Please contact support.",
              [{ text: "OK" }]
            );
          }
        } catch (err) {
          Alert.alert(
            "Error",
            "Payment received but verification failed. Please contact support.",
            [{ text: "OK" }]
          );
        } finally {
          setLoading(false);
        }
      } else if (data.status === "closed") {
        // User closed Paystack modal — stay on checkout
      }
    } catch (e) {
      console.error("WebView message parse error:", e);
    }
  };

  const [email, setEmail] = React.useState("");
  React.useEffect(() => {
    getUserEmail().then(setEmail);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Verifying your payment...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
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
              Billed {billing} · cancel anytime
            </Text>
          </View>
          <View style={styles.summaryLockRow}>
            <Ionicons name="lock-closed" size={12} color={COLORS.primary} />
            <Text style={styles.summarySecure}>Secure</Text>
          </View>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryLine}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₦{amount.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryLabel}>VAT (7.5%)</Text>
          <Text style={styles.summaryValue}>₦{vat.toLocaleString()}</Text>
        </View>
        <View style={[styles.summaryLine, styles.summaryTotal]}>
          <Text style={styles.summaryTotalLabel}>Total today</Text>
          <Text style={styles.summaryTotalValue}>₦{total.toLocaleString()}</Text>
        </View>
      </View>

      {/* Paystack WebView */}
      {email ? (
        <View style={styles.webViewContainer}>
          {!webViewReady && (
            <View style={styles.webViewLoader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.webViewLoaderText}>
                Loading secure payment...
              </Text>
            </View>
          )}
          <WebView
            ref={webViewRef}
            source={{ html: buildPaystackHTML(email) }}
            onMessage={handleMessage}
            onLoadEnd={() => setWebViewReady(true)}
            javaScriptEnabled
            style={[styles.webView, !webViewReady && { opacity: 0 }]}
          />
        </View>
      ) : (
        <View style={styles.webViewLoader}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.webViewLoaderText}>Preparing payment...</Text>
        </View>
      )}

      <Text style={styles.footNote}>
        Powered by Paystack · 256-bit SSL · PCI DSS compliant
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textLight,
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
  webViewContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  webView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webViewLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  webViewLoaderText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  footNote: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: "center",
    paddingVertical: 12,
  },
});

export default CheckoutScreen;