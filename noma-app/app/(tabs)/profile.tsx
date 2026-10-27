import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useAuth, syncUserFromServer } from '@/src/hooks/useAuth';
import { useAlert } from '@/src/context/AlertContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { getVerificationStatus } from '@/src/api/expert.api';
import AdminProfile from '../(admin)/profile';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DailyScansMeter, ScanStatsSummary } from '@/app/components/ProfileScanStats';
import {
  computeScansLeft,
  fetchProfileStats,
  getCachedProfileStats,
  ProfileStats,
} from '@/src/services/profileStats';
import { getQueue, isActive as isQueueItemActive, onQueueChange, QueuedScan } from '@/src/services/offlineScanQueue';
import { DIAGNOSES_PER_DAY, getEffectiveTier, isTrialActive } from '@/src/auth/access';

// ─── Design tokens ────────────────────────────────────────────────────────────

const COLORS = {
  primary: '#16A34A',
  primaryDark: '#15803d',
  primarySoft: '#dcfce7',
  primaryFaint: '#f0fdf4',
  background: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  textSubtle: '#94a3b8',
  border: '#e5e7eb',
  borderSoft: '#f1f5f9',
  danger: '#dc2626',
  dangerSoft: '#fef2f2',
  warning: '#d97706',
  warningSoft: '#fffbeb',
  blue: '#1d4ed8',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name?: string): string => {
  const cleaned = (name ?? '').trim();
  if (!cleaned) return '?';
  const initials = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return initials || '?';
};

// ─── Reusable pieces ──────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: string }) => (
  <Text style={styles.sectionLabel}>{children}</Text>
);

const OptionRow = ({
  icon,
  title,
  subtitle,
  onPress,
  destructive = false,
  last = false,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
  last?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
    android_ripple={{ color: COLORS.borderSoft }}
    style={({ pressed }) => [
      styles.optionRow,
      !last && styles.optionRowDivider,
      pressed && { backgroundColor: '#fafafa' },
    ]}
  >
    <View style={[styles.optionIcon, destructive && styles.optionIconDanger]}>
      <Feather
        name={icon}
        size={18}
        color={destructive ? COLORS.danger : COLORS.primary}
      />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.optionTitle, destructive && { color: COLORS.danger }]}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
    </View>
    {!destructive && (
      <Feather name="chevron-right" size={20} color={COLORS.textSubtle} />
    )}
  </Pressable>
);

const StatBlock = ({
  value,
  label,
  divider,
}: {
  value: string | number;
  label: string;
  divider?: boolean;
}) => (
  <View style={styles.statWrapper}>
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    {divider && <View style={styles.statDivider} />}
  </View>
);

// ─── Farmer Profile ───────────────────────────────────────────────────────────

const FarmerProfile = ({
  authUser,
  onLogout,
  onRefreshUser,
}: {
  authUser: any;
  onLogout: () => void;
  onRefreshUser?: () => void;
}) => {
  const router = useRouter();
  const { language } = useLanguage();
  const isHausa = language === 'hausa';

  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [waitingToSend, setWaitingToSend] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    const fresh = await fetchProfileStats().catch(() => null);
    if (fresh) setStats(fresh);
  }, []);

  // Tabs stay mounted, so reload whenever the profile is shown (e.g. after a scan or payment)
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  useEffect(() => {
    let active = true;
    getCachedProfileStats().then((cached) => {
      if (active && cached) setStats((s) => s ?? cached);
    });

    const countUnsent = (queue: QueuedScan[]) => setWaitingToSend(queue.filter(isQueueItemActive).length);
    getQueue().then(countUnsent);
    const unsubscribe = onQueueChange(countUnsent);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        loadStats(),
        syncUserFromServer().then(() => onRefreshUser?.()),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadStats, onRefreshUser]);

  const tier = getEffectiveTier(authUser);
  const dailyLimit = DIAGNOSES_PER_DAY[tier];
  // Same rule the scan screen uses before sending a photo
  const scansLeft = computeScansLeft(stats, authUser);
  const remainingToday = scansLeft === Infinity ? null : scansLeft;

  const user = {
    name: authUser?.name || 'Guest User',
    phone: authUser?.phone || '',
    email: authUser?.email || authUser?.phone || 'No contact info',
    role: authUser?.role || 'farmer',
    plan: authUser?.subscription?.plan || 'free',
  };

  // What the farmer can use right now; a paid plan past its end date counts as expired
  const planKind: 'premium' | 'basic' | 'trial' | 'expired' | 'free' =
    (user.plan === 'basic' || user.plan === 'premium') && tier === 'free'
      ? 'expired'
      : isTrialActive(authUser)
      ? 'trial'
      : tier;
  const paidPlanName = user.plan === 'premium' ? 'Premium' : 'Basic';
  const periodEndTime = authUser?.subscription?.currentPeriodEnd
    ? new Date(authUser.subscription.currentPeriodEnd).getTime()
    : NaN;
  const periodEnd = Number.isFinite(periodEndTime) ? format(periodEndTime, 'd MMM yyyy') : null;
  const trialEndTime = new Date(
    authUser?.trialEndDate || authUser?.subscription?.trialEndDate || NaN
  ).getTime();
  const trialDaysLeft =
    typeof authUser?.trialDaysRemaining === 'number'
      ? authUser.trialDaysRemaining
      : Number.isFinite(trialEndTime)
      ? Math.max(0, Math.ceil((trialEndTime - Date.now()) / (24 * 60 * 60 * 1000)))
      : null;

  const PLAN_STYLES = {
    premium: { icon: 'crown', fg: COLORS.primary, bg: '#ecfdf5', border: '#bbf7d0' },
    basic: { icon: 'star', fg: COLORS.primary, bg: '#ecfdf5', border: '#bbf7d0' },
    trial: { icon: 'hourglass-half', fg: COLORS.warning, bg: COLORS.warningSoft, border: '#fde68a' },
    expired: { icon: 'clock', fg: COLORS.warning, bg: COLORS.warningSoft, border: '#fde68a' },
    free: { icon: 'seedling', fg: COLORS.textMuted, bg: COLORS.borderSoft, border: COLORS.border },
  } as const;
  const planStyle = PLAN_STYLES[planKind];
  const planIcon = planStyle.icon as React.ComponentProps<typeof FontAwesome5>['name'];

  const planLabel = {
    premium: isHausa ? 'Tsarin Premium' : 'Premium Plan',
    basic: isHausa ? 'Tsarin Basic' : 'Basic Plan',
    trial: isHausa ? 'Tsarin gwaji' : 'Trial Plan',
    expired: isHausa ? `Tsarin ${paidPlanName} ya kare` : `${paidPlanName} plan expired`,
    free: isHausa ? 'Tsarin kyauta' : 'Free Plan',
  }[planKind];

  const planDescription =
    planKind === 'premium' || planKind === 'basic'
      ? periodEnd
        ? isHausa
          ? `Yana aiki har zuwa ${periodEnd}`
          : `Valid until ${periodEnd}`
        : planKind === 'premium'
        ? isHausa ? 'Bincike mara iyaka da karin fasali' : 'Unlimited scans & advanced features'
        : isHausa ? 'Bincike 10 a rana da taimakon kwararru' : '10 scans a day & expert help'
      : planKind === 'trial'
      ? trialDaysLeft !== null
        ? isHausa
          ? `Sauran kwanakin gwaji: ${trialDaysLeft}`
          : `Trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'}`
        : isHausa ? 'Kana amfani da dukkan fasaloli' : 'You have every feature during your trial'
      : planKind === 'expired'
      ? periodEnd
        ? isHausa
          ? `Ya kare ranar ${periodEnd}. Ka sabunta don ci gaba.`
          : `Ended on ${periodEnd}. Renew to keep your features.`
        : isHausa ? 'Ka sabunta tsarinka don ci gaba da amfani da fasalolinsa' : 'Renew to keep your features'
      : isHausa
      ? 'Ka daga tsarinka don karin bincike da taimakon kwararru'
      : 'Upgrade for more daily scans and expert help';
  const showPlanButton = planKind === 'free' || planKind === 'basic' || planKind === 'expired';

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </View>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
          </View>
          <View style={styles.contactRow}>
            <Feather name="at-sign" size={12} color={COLORS.textMuted} />
            <Text style={styles.email} numberOfLines={1}>
              {user.email}
            </Text>
          </View>

          <View style={styles.cardDivider} />

          <ScanStatsSummary
            total={stats?.total ?? null}
            healthy={stats?.healthy ?? null}
            issues={stats?.issues ?? null}
            rejected={stats?.rejected ?? null}
            waitingToSend={waitingToSend}
            isHausa={isHausa}
          />
        </View>

        {/* Daily scans */}
        <DailyScansMeter
          remaining={remainingToday}
          limit={dailyLimit}
          isTrial={isTrialActive(authUser)}
          isHausa={isHausa}
          onUpgrade={
            tier !== 'premium' ? () => router.push('/(onboarding)/plans') : undefined
          }
        />

        {/* Plan Card */}
        <View
          style={[styles.planCard, { backgroundColor: planStyle.bg, borderColor: planStyle.border }]}
        >
          <View style={styles.planIconWrap}>
            <FontAwesome5 name={planIcon} size={16} color={planStyle.fg} />
          </View>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={[styles.planTitle, { color: planStyle.fg }]}>{planLabel}</Text>
            <Text style={styles.planText} numberOfLines={2}>
              {planDescription}
            </Text>
          </View>
          {showPlanButton && (
            <Pressable
              onPress={() => router.push('/(onboarding)/plans')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={planKind === 'expired' ? 'Renew plan' : 'Upgrade plan'}
              style={({ pressed }) => [
                styles.upgradeBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.upgradeBtnText}>
                {planKind === 'expired' ? (isHausa ? 'Sabunta' : 'Renew') : isHausa ? 'Daga tsari' : 'Upgrade'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Account settings */}
        <SectionLabel>Account</SectionLabel>
        <View style={styles.groupCard}>
          <OptionRow
            icon="user"
            title="Account Settings"
            subtitle="Manage your profile"
            onPress={() => router.push('/(onboarding)/accountSettings')}
            last
          />
        </View>

        {/* Danger zone */}
        <SectionLabel>Danger Zone</SectionLabel>
        <View style={styles.groupCard}>
          <OptionRow
            icon="log-out"
            title="Logout"
            subtitle="Sign out of this device"
            onPress={onLogout}
            destructive
            last
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Expert Profile ───────────────────────────────────────────────────────────

const ExpertProfile = ({
  authUser,
  onLogout,
}: {
  authUser: any;
  onLogout: () => void;
}) => {
  const router = useRouter();
  const [expertProfile, setExpertProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errored, setErrored] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await getVerificationStatus();
      setExpertProfile(res.data.profile);
      setErrored(false);
    } catch (e) {
      console.error(e);
      setErrored(true);
    }
  }, []);

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false));
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchProfile();
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfile]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (errored && !expertProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Feather name="wifi-off" size={32} color={COLORS.textSubtle} />
        <Text style={[styles.name, { marginTop: 12 }]}>Couldn't load profile</Text>
        <Text style={[styles.email, { marginTop: 4 }]}>
          Check your connection and try again.
        </Text>
        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => [
            styles.retryBtn,
            pressed && { opacity: 0.85 },
          ]}
          accessibilityRole="button"
        >
          <Feather name="refresh-cw" size={14} color="#fff" />
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const isApproved = expertProfile?.overallStatus === 'approved';

  const stats: { value: string | number; label: string }[] = [
    { value: expertProfile?.performance?.casesHandled ?? 0, label: 'Cases' },
    {
      value: expertProfile?.performance?.averageRating?.toFixed(1) ?? '—',
      label: 'Rating',
    },
    {
      value: expertProfile?.assessment?.score
        ? `${expertProfile.assessment.score}%`
        : '—',
      label: 'Test Score',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRing}>
            <View style={[styles.avatar, { backgroundColor: COLORS.blue }]}>
              <Text style={styles.avatarText}>
                {getInitials(authUser?.name || 'E')}
              </Text>
            </View>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {authUser?.name}
          </Text>

          <View
            style={[
              styles.expertBadge,
              !isApproved && styles.expertBadgePending,
            ]}
          >
            <Ionicons
              name={isApproved ? 'shield-checkmark' : 'time-outline'}
              size={12}
              color={isApproved ? COLORS.primary : COLORS.warning}
            />
            <Text
              style={[
                styles.expertBadgeText,
                !isApproved && { color: COLORS.warning },
              ]}
            >
              {isApproved ? 'Verified Expert' : 'Pending Verification'}
            </Text>
          </View>

          {authUser?.phone ? (
            <View style={styles.contactRow}>
              <Feather name="phone" size={12} color={COLORS.textMuted} />
              <Text style={styles.email} numberOfLines={1}>
                {authUser.phone}
              </Text>
            </View>
          ) : null}

          <View style={styles.cardDivider} />

          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <StatBlock
                key={s.label}
                value={s.value}
                label={s.label}
                divider={i < stats.length - 1}
              />
            ))}
          </View>
        </View>

        {/* Specializations */}
        {expertProfile?.specializations?.length > 0 && (
          <View style={styles.infoCard}>
            <SectionLabel>Specializations</SectionLabel>
            <View style={styles.chipRow}>
              {expertProfile.specializations.map((s: string) => (
                <View key={s} style={styles.chip}>
                  <Text style={styles.chipText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Badges */}
        {isApproved && expertProfile?.displayBadges?.length > 0 && (
          <View style={styles.infoCard}>
            <SectionLabel>Badges</SectionLabel>
            <View style={styles.chipRow}>
              {expertProfile.displayBadges.map((badge: string) => (
                <View key={badge} style={styles.badgeChip}>
                  <Ionicons name="checkmark-circle" size={12} color={COLORS.primary} />
                  <Text style={styles.badgeChipText}>
                    {badge.replace(/_/g, ' ')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Account */}
        <SectionLabel>Account</SectionLabel>
        <View style={styles.groupCard}>
          <OptionRow
            icon="award"
            title="Verification Status"
            subtitle={
              isApproved
                ? 'Fully verified — view badges'
                : 'Complete your verification'
            }
            onPress={() => router.push('/(expert)/dashboard' as any)}
          />
          <OptionRow
            icon="user"
            title="Account Settings"
            subtitle="Manage your profile"
            onPress={() => router.push('/(onboarding)/accountSettings')}
            last
          />
        </View>

        {/* Danger zone */}
        <SectionLabel>Danger Zone</SectionLabel>
        <View style={styles.groupCard}>
          <OptionRow
            icon="log-out"
            title="Logout"
            subtitle="Sign out of this device"
            onPress={onLogout}
            destructive
            last
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Main Profile Screen ──────────────────────────────────────────────────────

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const { user: authUser, logout, refreshUser } = useAuth();
  const { showAlert } = useAlert();
  const { language } = useLanguage();
  const isHausa = language === 'hausa';

  // Latest plan from the server each time the profile is shown. syncUserFromServer
  // merges into the stored user and reads the trial fields from the response's meta.
  useFocusEffect(
    useCallback(() => {
      syncUserFromServer().then(() => refreshUser());
    }, [refreshUser])
  );

  const handleLogout = useCallback(() => {
    showAlert({
      title: isHausa ? 'Fita Daga Akawun' : 'Logout',
      message: isHausa
        ? 'Shin kana da tabbacin kana son fita daga akawun ka?'
        : 'Are you sure you want to log out of your account?',
      buttons: [
        { text: isHausa ? 'Soke' : 'Cancel', style: 'cancel' },
        {
          text: isHausa ? 'Fita' : 'Logout',
          style: 'destructive',
          onPress: async () => {
            const success = await logout();
            if (success) {
              router.replace('/(onboarding)/login');
            } else {
              showAlert({
                title: isHausa ? 'Kuskure' : 'Error',
                message: isHausa
                  ? 'An kasa fita. Da fatan a sake gwadawa.'
                  : 'Failed to log out. Please try again.',
                buttons: [{ text: isHausa ? 'Yarda' : 'OK' }],
              });
            }
          },
        },
      ],
    });
  }, [isHausa, showAlert, logout, router]);

  // ✅ Role-based render happens AFTER hooks
  if (authUser?.role === 'admin') return <AdminProfile />;
  if (authUser?.role === 'expert') {
    return <ExpertProfile authUser={authUser} onLogout={handleLogout} />;
  }
  return (
    <FarmerProfile
      authUser={authUser}
      onLogout={handleLogout}
      onRefreshUser={refreshUser}
    />
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 32,
  },

  // Profile header
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 40,
    backgroundColor: COLORS.primaryFaint,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    marginBottom: 10,
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  rolePill: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 6,
    marginBottom: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    maxWidth: '90%',
  },
  email: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  cardDivider: {
    height: 1,
    alignSelf: 'stretch',
    backgroundColor: COLORS.borderSoft,
    marginVertical: 14,
  },

  // Expert badge
  expertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginVertical: 6,
  },
  expertBadgePending: {
    backgroundColor: COLORS.warningSoft,
  },
  expertBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 4,
  },
  statWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },

  // Plan card
  planCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  planIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  planText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  upgradeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
  },
  upgradeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  // Grouped settings
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSubtle,
    marginBottom: 8,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  groupCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  optionRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconDanger: {
    backgroundColor: COLORS.dangerSoft,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionSubtitle: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // Info blocks (expert)
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.primaryFaint,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryFaint,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeChipText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Retry
  retryBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default ProfileScreen;