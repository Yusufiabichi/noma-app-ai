import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/hooks/useAuth';
import { useLanguage } from '@/src/context/LanguageContext';
import { AccessResult, checkAccess, Feature, Tier } from '@/src/auth/access';

const COLORS = {
  primary: '#16A34A',
  background: '#f8f8f8',
  white: '#ffffff',
  textDark: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb',
  amber: '#d97706',
  amberLight: '#fffbeb',
  amberBorder: '#fde68a',
};

const FEATURE_NAMES: Partial<Record<Feature, { en: string; ha: string }>> = {
  voiceAssistant: { en: 'The voice assistant', ha: 'Mataimakin murya' },
  expertChat: { en: 'Expert consultations', ha: 'Shawarar kwararru' },
};

const TIER_NAMES: Record<Tier, string> = { free: 'Free', basic: 'Basic', premium: 'Premium' };

export function lockedMessage(result: AccessResult, feature: Feature, isHausa: boolean) {
  const name = FEATURE_NAMES[feature] || { en: 'This feature', ha: 'Wannan fasali' };

  const tier = !result.allowed && result.reason === 'upgrade' ? TIER_NAMES[result.requiredTier] : 'Basic';
  return {
    title: isHausa ? `Ana bukatar tsarin ${tier}` : `Needs the ${tier} plan`,
    body: isHausa
      ? `${name.ha} yana cikin tsarin ${tier} da sama. Ka zabi tsari don amfani da shi.`
      : `${name.en} is included in the ${tier} plan and above. Choose a plan to use it.`,
  };
}

/**
 * Locked state shown in place of a feature the user's plan doesn't include
 */
export function LockedFeature({ feature, result }: { feature: Feature; result: AccessResult }) {
  const router = useRouter();
  const { language } = useLanguage();
  const isHausa = language === 'hausa';
  const { title, body } = lockedMessage(result, feature, isHausa);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          accessibilityRole="button"
          accessibilityLabel={isHausa ? 'Koma baya' : 'Go back'}
        >
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={32} color={COLORS.amber} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{body}</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(onboarding)/plans')}>
          <Text style={styles.primaryBtnText}>{isHausa ? 'Duba tsare-tsare' : 'View plans'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/**
 * Renders children only when the signed-in user's role and plan allow the feature.
 * Signed-out users go to login; users with the wrong role go to their own home.
 */
export default function RequireAccess({
  feature,
  skipPlan = false,
  children,
}: {
  feature: Feature;
  /** Check sign-in and role only (e.g. expert review of an unconfirmed scan, free on every plan) */
  skipPlan?: boolean;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const result = checkAccess(user, feature, { skipPlan });
  if (result.allowed) return <>{children}</>;
  if (result.reason === 'signedOut') return <Redirect href="/(onboarding)/login" />;
  if (result.reason === 'wrongRole') return <Redirect href="/(tabs)" />;
  return <LockedFeature feature={feature} result={result} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FFFB' },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 60 },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textDark, marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
});
