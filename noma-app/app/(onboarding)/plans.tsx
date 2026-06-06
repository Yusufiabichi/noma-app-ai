import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#16A34A",
  primaryLight: "#f0fdf4",
  primaryBorder: "#bbf7d0",
  background: "#f8f8f8",
  white: "#ffffff",
  textDark: "#1f2937",
  textLight: "#6b7280",
  border: "#e5e7eb",
  amber: "#d97706",
  amberLight: "#fffbeb",
  amberBorder: "#fde68a",
};

const PLANS = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    tag: null,
    color: COLORS.textLight,
    features: [
      { label: "3 diagnoses per day", included: true },
      { label: "Basic weather podcast", included: true },
      { label: "Expert chat", included: false },
      { label: "Advanced treatment rec.", included: false },
      { label: "Voiced treatment", included: false },
      { label: "Advanced weather", included: false },
    ],
  },
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 1500,
    yearlyPrice: 14400,
    tag: "Most popular",
    color: COLORS.primary,
    features: [
      { label: "10 diagnoses per day", included: true },
      { label: "5 expert chat sessions", included: true },
      { label: "Advanced treatment rec.", included: true },
      { label: "Voiced treatment", included: true },
      { label: "Advanced weather podcast", included: true },
      { label: "Location weather", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 3500,
    yearlyPrice: 33600,
    tag: "Best value",
    color: COLORS.amber,
    features: [
      { label: "Unlimited diagnoses", included: true },
      { label: "Unlimited expert chat", included: true },
      { label: "NomaApp 2.0 AI model", included: true },
      { label: "Location weather podcast", included: true },
      { label: "Disease outbreak alerts", included: true },
      { label: "SMS / WhatsApp notify", included: true },
    ],
  },
];

const PlansScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const reason = params.reason as string;
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const handleSelectPlan = (plan: (typeof PLANS)[0]) => {
    if (plan.id === "free") {
      router.replace("/(tabs)");
      return;
    }
    router.push({
      pathname: "/(onboarding)/checkout",
      params: {
        planId: plan.id,
        planName: plan.name,
        amount: billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice,
        billing,
      },
    });
  };

  const formatPrice = (plan: (typeof PLANS)[0]) => {
    const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
    if (price === 0) return "Free";
    return `₦${price.toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {reason === "trial_expired" && (
            <View style={styles.expiredBadge}>
              <Ionicons name="time-outline" size={14} color={COLORS.amber} />
              <Text style={styles.expiredBadgeText}>Your 7-day trial has ended</Text>
            </View>
          )}
          <Text style={styles.title}>Choose your plan</Text>
          <Text style={styles.subtitle}>
            Upgrade to keep diagnosing your crops and protecting your harvest.
          </Text>
        </View>

        {/* Billing Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              billing === "monthly" && styles.toggleBtnActive,
            ]}
            onPress={() => setBilling("monthly")}
          >
            <Text
              style={[
                styles.toggleBtnText,
                billing === "monthly" && styles.toggleBtnTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              billing === "yearly" && styles.toggleBtnActive,
            ]}
            onPress={() => setBilling("yearly")}
          >
            <Text
              style={[
                styles.toggleBtnText,
                billing === "yearly" && styles.toggleBtnTextActive,
              ]}
            >
              Yearly
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>Save 20%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plan Cards */}
        {PLANS.map((plan) => {
          const isFeatured = plan.id === "basic";
          const isPremium = plan.id === "premium";
          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                isFeatured && styles.planCardFeatured,
                isPremium && styles.planCardPremium,
              ]}
            >
              {plan.tag && (
                <View
                  style={[
                    styles.planTag,
                    isPremium ? styles.planTagPremium : styles.planTagFeatured,
                  ]}
                >
                  <Text
                    style={[
                      styles.planTagText,
                      isPremium
                        ? styles.planTagTextPremium
                        : styles.planTagTextFeatured,
                    ]}
                  >
                    {plan.tag}
                  </Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View>
                  <Text
                    style={[
                      styles.planName,
                      isFeatured && { color: COLORS.primary },
                      isPremium && { color: COLORS.amber },
                    ]}
                  >
                    {plan.name}
                  </Text>
                </View>
                <View style={styles.planPricing}>
                  <Text
                    style={[
                      styles.planPrice,
                      isFeatured && { color: COLORS.primary },
                      isPremium && { color: COLORS.amber },
                    ]}
                  >
                    {formatPrice(plan)}
                  </Text>
                  {plan.monthlyPrice > 0 && (
                    <Text style={styles.planPricePeriod}>
                      /{billing === "monthly" ? "mo" : "yr"}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.featureList}>
                {plan.features.map((feat, i) => (
                  <View key={i} style={styles.featureRow}>
                    <View
                      style={[
                        styles.featureIcon,
                        !feat.included && styles.featureIconLocked,
                      ]}
                    >
                      <Ionicons
                        name={feat.included ? "checkmark" : "close"}
                        size={12}
                        color={feat.included ? COLORS.primary : COLORS.textLight}
                      />
                    </View>
                    <Text
                      style={[
                        styles.featureText,
                        !feat.included && styles.featureTextLocked,
                      ]}
                    >
                      {feat.label}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.planButton,
                  isFeatured && styles.planButtonFeatured,
                  isPremium && styles.planButtonPremium,
                ]}
                onPress={() => handleSelectPlan(plan)}
              >
                <Text
                  style={[
                    styles.planButtonText,
                    (isFeatured || isPremium) && styles.planButtonTextFilled,
                  ]}
                >
                  {plan.id === "free" ? "Continue free" : `Get ${plan.name}`}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <Text style={styles.footNote}>
          Cancel anytime · Secure payment via Paystack · VAT may apply
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  expiredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.amberLight,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  expiredBadgeText: {
    fontSize: 12,
    color: COLORS.amber,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 3,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  toggleBtnText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  toggleBtnTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  saveBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  saveBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "700",
  },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  planCardFeatured: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  planCardPremium: {
    borderColor: COLORS.amber,
    borderWidth: 2,
  },
  planTag: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 10,
  },
  planTagFeatured: {
    backgroundColor: COLORS.primaryLight,
  },
  planTagPremium: {
    backgroundColor: COLORS.amberLight,
  },
  planTagText: {
    fontSize: 11,
    fontWeight: "700",
  },
  planTagTextFeatured: {
    color: COLORS.primary,
  },
  planTagTextPremium: {
    color: COLORS.amber,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  planName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  planPricing: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  planPricePeriod: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  featureList: {
    gap: 8,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIconLocked: {
    backgroundColor: COLORS.background,
  },
  featureText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  featureTextLocked: {
    color: COLORS.textLight,
  },
  planButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: "center",
  },
  planButtonFeatured: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  planButtonPremium: {
    backgroundColor: COLORS.amber,
    borderColor: COLORS.amber,
  },
  planButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  planButtonTextFilled: {
    color: COLORS.white,
  },
  footNote: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: 4,
  },
});

export default PlansScreen;