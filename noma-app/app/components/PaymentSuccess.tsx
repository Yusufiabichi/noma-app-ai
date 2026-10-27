import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, AccessibilityInfo, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { VerifyResult } from '@/src/api/payments.api';

// Shown once a payment is verified: one short sequence (badge, heading, receipt,
// button) so the farmer sees what they paid for and until when.

const COLORS = {
  primary: '#16A34A',
  primarySoft: '#DCFCE7',
  ink: '#0E3B2C',
  muted: '#5F6B63',
  line: '#E3E9E1',
  white: '#FFFFFF',
};

const BADGE = 96;

export default function PaymentSuccess({
  result,
  isHausa,
  onContinue,
}: {
  result: VerifyResult;
  isHausa: boolean;
  onContinue: () => void;
}) {
  const t = (ha: string, en: string) => (isHausa ? ha : en);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  const badge = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const check = useRef(new Animated.Value(0)).current;
  const heading = useRef(new Animated.Value(0)).current;
  const receipt = useRef(new Animated.Value(0)).current;
  const action = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false));
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;
    const all = [badge, ring, check, heading, receipt, action];
    if (reduceMotion) {
      all.forEach((value) => value.setValue(1));
      return;
    }
    const rise = (value: Animated.Value, duration = 320) =>
      Animated.timing(value, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true });

    const sequence = Animated.sequence([
      Animated.parallel([
        Animated.spring(badge, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(140),
          Animated.spring(check, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
        ]),
      ]),
      rise(heading),
      rise(receipt, 380),
      rise(action, 260),
    ]);
    sequence.start();
    return () => sequence.stop();
  }, [reduceMotion]);

  const { payment, subscription } = result;
  const planName = payment.plan.charAt(0).toUpperCase() + payment.plan.slice(1);
  const periodEnd = subscription?.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), 'd MMM yyyy') : null;
  const amount = `${payment.currency === 'NGN' || !payment.currency ? '₦' : `${payment.currency} `}${Number(payment.amount || 0).toLocaleString()}`;

  const rows = [
    { label: t('Tsari', 'Plan'), value: planName },
    {
      label: t('Lokacin biya', 'Billing'),
      value: payment.interval === 'yearly' ? t('Na shekara', 'Yearly') : t('Na wata', 'Monthly'),
    },
    { label: t('An biya', 'Amount paid'), value: amount },
    ...(periodEnd ? [{ label: t('Yana aiki har zuwa', 'Valid until'), value: periodEnd }] : []),
  ];

  const riseStyle = (value: Animated.Value, distance = 16) => ({
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  });

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.badgeWrap}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                opacity: ring.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.5, 0] }),
                transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.badge,
              {
                opacity: badge.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
                transform: [{ scale: badge.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
              },
            ]}
          >
            <Animated.View style={{ opacity: check, transform: [{ scale: check }] }}>
              <Ionicons name="checkmark" size={52} color={COLORS.white} />
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.headingBlock, riseStyle(heading)]}>
          <Text style={styles.title} accessibilityRole="header">
            {t(`Kana kan tsarin ${planName}`, `You're on ${planName}`)}
          </Text>
          <Text style={styles.subtitle}>
            {t('An tabbatar da biyan kuɗinka. Fasalolinka sun buɗe.', 'Payment confirmed. Your features are unlocked.')}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.receipt, riseStyle(receipt, 24)]}>
          {rows.map((row, i) => (
            <View key={row.label} style={[styles.row, i < rows.length - 1 && styles.rowDivider]}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View style={[styles.actions, { opacity: action }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onContinue} accessibilityRole="button">
          <Text style={styles.primaryBtnText}>{t('Ci gaba', 'Continue')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  badgeWrap: { alignSelf: 'center', width: BADGE, height: BADGE, marginBottom: 28 },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BADGE / 2,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingBlock: { alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700', color: COLORS.ink, textAlign: 'center' },
  subtitle: { fontSize: 15, lineHeight: 22, color: COLORS.muted, textAlign: 'center', marginTop: 8, maxWidth: 300 },
  receipt: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, gap: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.line },
  rowLabel: { fontSize: 15, color: COLORS.muted },
  rowValue: { fontSize: 15, color: COLORS.ink, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  actions: { paddingHorizontal: 20, paddingBottom: 24 },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
