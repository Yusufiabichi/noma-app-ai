import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#16A34A",
  primaryLight: "#f0fdf4",
  primaryMid: "#639922",
  background: "#f8f8f8",
  white: "#ffffff",
  textDark: "#1f2937",
  textLight: "#6b7280",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
};

// ─── Step config per stage ────────────────────────────────────────────────────

const STAGE_CONFIG = {
  1: {
    badge:    "Stage 1 complete",
    title:    "Profile saved!",
    subtitle: "Your professional profile has been saved. You're one step closer to becoming a verified NomaApp expert.",
    ctaLabel: "Continue to Stage 2",
    steps: [
      { label: "Professional profile", done: true  },
      { label: "Upload ID & credentials", done: false, active: true },
      { label: "Competency assessment",  done: false },
    ],
  },
  2: {
    badge:    "Stage 2 complete",
    title:    "Documents submitted!",
    subtitle: "Your documents are under review. Our team will verify them within 48 hours and notify you by push notification.",
    ctaLabel: "Back to Dashboard",
    steps: [
      { label: "Professional profile",    done: true  },
      { label: "ID & credentials uploaded", done: true },
      { label: "Competency assessment",   done: false, pending: true },
    ],
  },
};

interface StageSuccessModalProps {
  visible: boolean;
  stage: 1 | 2;
  onContinue: () => void;
}

const StageSuccessModal: React.FC<StageSuccessModalProps> = ({
  visible, stage, onContinue,
}) => {
  const config = STAGE_CONFIG[stage];

  // ── Animation values ───────────────────────────────────────────────────────
  const backdropOpacity  = useRef(new Animated.Value(0)).current;
  const cardScale        = useRef(new Animated.Value(0.88)).current;
  const cardTranslateY   = useRef(new Animated.Value(16)).current;
  const cardOpacity      = useRef(new Animated.Value(0)).current;
  const ringScale        = useRef(new Animated.Value(0.7)).current;
  const ringOpacity      = useRef(new Animated.Value(0)).current;
  const checkOpacity     = useRef(new Animated.Value(0)).current;
  const checkScale       = useRef(new Animated.Value(0.5)).current;

  // Confetti dots — 5 dots each with their own translateY
  const dots = useRef(
    Array.from({ length: 5 }, () => ({
      y:       new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;

    // Reset all values
    backdropOpacity.setValue(0);
    cardScale.setValue(0.88);
    cardTranslateY.setValue(16);
    cardOpacity.setValue(0);
    ringScale.setValue(0.7);
    ringOpacity.setValue(0);
    checkOpacity.setValue(0);
    checkScale.setValue(0.5);
    dots.forEach(d => { d.y.setValue(0); d.opacity.setValue(0); });

    // 1. Backdrop fade in
    Animated.timing(backdropOpacity, {
      toValue: 1, duration: 250, useNativeDriver: true,
    }).start();

    // 2. Card spring in
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1, friction: 7, tension: 80, useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0, friction: 7, tension: 80, useNativeDriver: true,
      }),
    ]).start();

    // 3. Ring appears
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(ringScale, {
          toValue: 1, friction: 5, tension: 100, useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // 4. Checkmark pops in
    setTimeout(() => {
      Animated.spring(checkScale, {
        toValue: 1, friction: 4, tension: 120, useNativeDriver: true,
      }).start();
      Animated.timing(checkOpacity, {
        toValue: 1, duration: 200, useNativeDriver: true,
      }).start();
    }, 380);

    // 5. Confetti dots burst upward
    setTimeout(() => {
      dots.forEach((dot, i) => {
        setTimeout(() => {
          Animated.sequence([
            Animated.parallel([
              Animated.timing(dot.opacity, {
                toValue: 1, duration: 120, useNativeDriver: true,
              }),
              Animated.timing(dot.y, {
                toValue: -18, duration: 280,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(dot.opacity, {
                toValue: 0, duration: 200, useNativeDriver: true,
              }),
              Animated.timing(dot.y, {
                toValue: 0, duration: 200, useNativeDriver: true,
              }),
            ]),
          ]).start();
        }, i * 55);
      });
    }, 550);
  }, [visible]);

  const DOT_COLORS = ["#16A34A", "#97c459", "#ba7517", "#639922", "#3b6d11"];

  return (
    <Modal visible={visible} transparent animationType="none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }, { translateY: cardTranslateY }],
            },
          ]}
        >
          {/* Check ring */}
          <Animated.View
            style={[
              styles.ringWrap,
              { opacity: ringOpacity, transform: [{ scale: ringScale }] },
            ]}
          >
            <Animated.View
              style={[
                styles.checkWrap,
                { opacity: checkOpacity, transform: [{ scale: checkScale }] },
              ]}
            >
              <Ionicons name="checkmark" size={32} color={COLORS.primary} />
            </Animated.View>
          </Animated.View>

          {/* Confetti dots */}
          <View style={styles.confettiRow}>
            {dots.map((dot, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.confettiDot,
                  { backgroundColor: DOT_COLORS[i],
                    opacity: dot.opacity,
                    transform: [{ translateY: dot.y }] },
                ]}
              />
            ))}
          </View>

          {/* Badge */}
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={13} color={COLORS.primary} />
            <Text style={styles.badgeText}>{config.badge}</Text>
          </View>

          {/* Title + subtitle */}
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>

          {/* Step tracker */}
          <View style={styles.stepsBox}>
            {config.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepNum,
                    step.done    && styles.stepNumDone,
                    step.active  && styles.stepNumActive,
                    step.pending && styles.stepNumPending,
                    !step.done && !step.active && !step.pending && styles.stepNumInactive,
                  ]}
                >
                  {step.done ? (
                    <Ionicons name="checkmark" size={12} color={COLORS.primary} />
                  ) : (
                    <Text style={[
                      styles.stepNumText,
                      step.active  && { color: COLORS.white },
                      step.pending && { color: COLORS.textMuted },
                      !step.done && !step.active && !step.pending && { color: COLORS.textMuted },
                    ]}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    step.done    && styles.stepLabelDone,
                    step.active  && styles.stepLabelActive,
                    step.pending && styles.stepLabelPending,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.ctaBtn} onPress={onContinue} activeOpacity={0.85}>
            <Text style={styles.ctaBtnText}>{config.ctaLabel}</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },

  // Check ring
  ringWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2, borderColor: "#bbf7d0",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  checkWrap: {
    alignItems: "center", justifyContent: "center",
  },

  // Confetti
  confettiRow: {
    flexDirection: "row",
    gap: 6,
    height: 20,
    alignItems: "flex-end",
    marginBottom: 14,
  },
  confettiDot: {
    width: 8, height: 8, borderRadius: 4,
  },

  // Badge
  badge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 12,
    marginBottom: 12,
  },
  badgeText: { fontSize: 12, fontWeight: "600", color: COLORS.primary },

  // Text
  title: {
    fontSize: 20, fontWeight: "700", color: COLORS.textDark,
    marginBottom: 6, textAlign: "center",
  },
  subtitle: {
    fontSize: 13, color: COLORS.textLight, textAlign: "center",
    lineHeight: 19, marginBottom: 20,
  },

  // Steps
  stepsBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12, padding: 14,
    width: "100%", marginBottom: 20, gap: 10,
  },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  stepNumDone:     { backgroundColor: COLORS.primaryLight },
  stepNumActive:   { backgroundColor: COLORS.primary },
  stepNumPending:  { backgroundColor: COLORS.border },
  stepNumInactive: { backgroundColor: COLORS.border },
  stepNumText: { fontSize: 11, fontWeight: "700" },
  stepLabel: { fontSize: 13, color: COLORS.textDark, fontWeight: "500" },
  stepLabelDone: {
    color: COLORS.primary,
    textDecorationLine: "line-through",
    textDecorationColor: "#97c459",
  },
  stepLabelActive:  { color: COLORS.textDark, fontWeight: "700" },
  stepLabelPending: { color: COLORS.textMuted },

  // CTA
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, width: "100%",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  ctaBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
});

export default StageSuccessModal;