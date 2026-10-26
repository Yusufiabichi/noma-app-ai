import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#16A34A',
  primaryLight: '#f0fdf4',
  ink: '#0E3B2C',
  textDark: '#1f2937',
  textLight: '#6b7280',
  track: '#EEF2EC',
  border: '#e5e7eb',
  amber: '#D97706',
  red: '#DC2626',
  issue: '#E0A33A',
};

const useReduceMotion = () => {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
};

// ─── Scans left today ─────────────────────────────────────────────────────────

export function DailyScansMeter({
  remaining,
  limit,
  isTrial,
  isHausa,
  onUpgrade,
}: {
  remaining: number | null;
  limit: number;
  isTrial: boolean;
  isHausa: boolean;
  onUpgrade?: () => void;
}) {
  const reduceMotion = useReduceMotion();
  const unlimited = !Number.isFinite(limit);
  const known = !unlimited && remaining !== null;
  const left = known ? Math.max(0, Math.min(remaining as number, limit)) : 0;
  const ratio = known && limit > 0 ? left / limit : 0;

  const fill = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);

  // Bar fills while the number counts up to what's left
  useEffect(() => {
    if (!known) return;
    if (reduceMotion) {
      fill.setValue(ratio);
      setShown(left);
      return;
    }
    fill.setValue(0);
    const id = fill.addListener(({ value }) => setShown(Math.round(value * limit)));
    Animated.timing(fill, {
      toValue: ratio,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setShown(left));
    return () => fill.removeListener(id);
  }, [known, ratio, left, limit, reduceMotion]);

  const color = ratio > 0.5 ? COLORS.primary : ratio > 0.2 ? COLORS.amber : COLORS.red;
  const width = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  let helper: string;
  if (unlimited) {
    helper = isTrial
      ? (isHausa ? 'Babu iyaka a lokacin gwajinka.' : 'No daily limit during your trial.')
      : (isHausa ? 'Tsarinka ba shi da iyakar yau da kullum.' : 'Your plan has no daily limit.');
  } else if (!known) {
    helper = isHausa ? `Tsarinka yana ba da bincike ${limit} a rana.` : `Your plan includes ${limit} scans a day.`;
  } else if (left === 0) {
    helper = isHausa
      ? 'Ka yi amfani da duk binciken yau. Za su dawo gobe.'
      : "You've used all of today's scans. They refill tomorrow.";
  } else {
    helper = isHausa ? 'Binciken suna dawowa kowace rana.' : 'Your scans refill every day.';
  }

  return (
    <View
      style={styles.meterCard}
      accessible
      accessibilityLabel={
        unlimited
          ? (isHausa ? 'Bincike mara iyaka' : 'Unlimited scans')
          : known
          ? (isHausa ? `Sauran bincike ${left} cikin ${limit} yau` : `${left} of ${limit} scans left today`)
          : helper
      }
    >
      <Text style={styles.meterTitle}>{isHausa ? 'Sauran binciken yau' : 'Scans left today'}</Text>

      {unlimited ? (
        <View style={styles.unlimitedRow}>
          <Ionicons name="infinite" size={30} color={COLORS.primary} />
          <Text style={styles.unlimitedText}>{isHausa ? 'Mara iyaka' : 'Unlimited'}</Text>
        </View>
      ) : (
        <>
          <View style={styles.meterNumberRow}>
            <Text style={[styles.meterNumber, known && { color }]}>{known ? shown : '–'}</Text>
            <Text style={styles.meterOf}>{isHausa ? `cikin ${limit}` : `of ${limit}`}</Text>
          </View>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
          </View>
        </>
      )}

      <Text style={styles.helper}>{helper}</Text>

      {!unlimited && known && left === 0 && onUpgrade && (
        <TouchableOpacity style={styles.upgradeLink} onPress={onUpgrade}>
          <Text style={styles.upgradeLinkText}>{isHausa ? 'Samu karin bincike' : 'Get more scans'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Scans / healthy / issues ────────────────────────────────────────────────

export function ScanStatsSummary({
  total,
  healthy,
  issues,
  rejected = null,
  waitingToSend,
  isHausa,
}: {
  total: number | null;
  healthy: number | null;
  issues: number | null;
  /** Photos the AI couldn't diagnose (not a plant, unsupported crop…) */
  rejected?: number | null;
  waitingToSend: number;
  isHausa: boolean;
}) {
  const diagnosed = (healthy ?? 0) + (issues ?? 0);
  const healthyShare = diagnosed > 0 ? (healthy ?? 0) / diagnosed : 0;
  const show = (value: number | null) => (value === null ? '–' : String(value));

  const items = [
    { icon: 'scan-outline', color: COLORS.ink, value: show(total), label: isHausa ? 'Bincike' : 'Scans' },
    { icon: 'leaf-outline', color: COLORS.primary, value: show(healthy), label: isHausa ? 'Lafiya' : 'Healthy' },
    { icon: 'bug-outline', color: COLORS.issue, value: show(issues), label: isHausa ? 'Matsaloli' : 'Issues' },
  ];

  return (
    <View style={styles.statsBlock}>
      <View style={styles.statsRow}>
        {items.map((item, i) => (
          <View key={item.label} style={[styles.statItem, i > 0 && styles.statDivider]}>
            <Ionicons name={item.icon as any} size={18} color={item.color} />
            <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {diagnosed > 0 && (
        <View style={styles.splitBlock}>
          <View style={styles.splitBar}>
            <View style={[styles.splitHealthy, { flex: healthy ?? 0 }]} />
            <View style={[styles.splitIssues, { flex: issues ?? 0 }]} />
          </View>
          <Text style={styles.splitText}>
            {isHausa
              ? `Kashi ${Math.round(healthyShare * 100)} cikin 100 na amfanin gonarka da aka bincika suna da lafiya`
              : `${Math.round(healthyShare * 100)}% of your diagnosed crops were healthy`}
          </Text>
        </View>
      )}

      {!!rejected && rejected > 0 && (
        <View style={styles.waitingRow}>
          <Ionicons name="help-circle-outline" size={14} color={COLORS.textLight} />
          <Text style={styles.waitingText}>
            {isHausa
              ? `Ba a iya gane matsalar hoto ${rejected} ba`
              : `${rejected} photo${rejected === 1 ? '' : 's'} couldn't be diagnosed`}
          </Text>
        </View>
      )}

      {waitingToSend > 0 && (
        <View style={styles.waitingRow}>
          <Ionicons name="cloud-offline-outline" size={14} color={COLORS.amber} />
          <Text style={styles.waitingText}>
            {isHausa
              ? `Bincike ${waitingToSend} yana jiran intanet`
              : `${waitingToSend} scan${waitingToSend === 1 ? '' : 's'} waiting to send`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Meter
  meterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  meterTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  meterNumberRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4, marginBottom: 10 },
  meterNumber: { fontSize: 40, fontWeight: '800', color: COLORS.ink, letterSpacing: -1 },
  meterOf: { fontSize: 16, fontWeight: '600', color: COLORS.textLight },
  track: { height: 10, borderRadius: 5, backgroundColor: COLORS.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  unlimitedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  unlimitedText: { fontSize: 24, fontWeight: '800', color: COLORS.ink },
  helper: { fontSize: 13, color: COLORS.textLight, marginTop: 10, lineHeight: 19 },
  upgradeLink: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  upgradeLinkText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },

  // Stats
  statsBlock: { alignSelf: 'stretch', marginTop: 18 },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: COLORS.border },
  statValue: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: 13, color: COLORS.textLight },
  splitBlock: { marginTop: 16, gap: 8 },
  splitBar: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: COLORS.track },
  splitHealthy: { backgroundColor: COLORS.primary },
  splitIssues: { backgroundColor: COLORS.issue },
  splitText: { fontSize: 12, color: COLORS.textLight, textAlign: 'center' },
  waitingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  waitingText: { fontSize: 12, color: COLORS.amber, fontWeight: '600' },
});
