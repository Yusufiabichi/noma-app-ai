import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth, setUserData } from '@/src/hooks/useAuth';
import { getCurrentUser } from '@/src/api/auth.api';
import { getVerificationStatus } from '@/src/api/expert.api';
import AdminProfile from '../(admin)/profile';

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

// ─── Farmer Profile ───────────────────────────────────────────────────────────

const FarmerProfile = ({ authUser, onLogout }: { authUser: any; onLogout: () => void }) => {
  const router = useRouter();

  const user = {
    name:              authUser?.name || 'Guest User',
    phone:             authUser?.phone || '',
    email:             authUser?.email || authUser?.phone || 'No contact info',
    role:              authUser?.role || 'farmer',
    scans:             authUser?.scansCount || 0,
    healthy:           authUser?.healthyCount || 0,
    issues:            authUser?.issuesCount || 0,
    plan:              authUser?.subscription?.plan || 'free',
    scansRemaining:    authUser?.subscription?.scansRemaining ??
                       (authUser?.subscription?.plan === 'premium' ? '∞' : 0),
    trialDaysRemaining: authUser?.trialDaysRemaining,
  };

  if (user?.role === 'admin') {
    return <AdminProfile />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.scans}</Text>
            <Text style={styles.statLabel}>Scans</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.healthy}</Text>
            <Text style={styles.statLabel}>Healthy</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.issues}</Text>
            <Text style={styles.statLabel}>Issues</Text>
          </View>
        </View>
      </View>

      {/* Plan Card */}
      <View style={[styles.premiumCard, user.plan === 'free' && { backgroundColor: '#6b7280' }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.premiumTitle}>{user.plan.toUpperCase()} Plan</Text>
          <Text style={styles.premiumText}>
            {user.plan === 'trial' && (user.trialDaysRemaining ?? 0) > 0
              ? `Trial period: ${user.trialDaysRemaining} day${user.trialDaysRemaining === 1 ? '' : 's'} left`
              : user.plan === 'premium'
              ? 'Unlimited scans & advanced features'
              : `Available scans: ${user.scansRemaining} left`}
          </Text>
        </View>
        {user.plan === 'free' || user.plan === 'trial' ? (
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push('/(onboarding)/plans')}
          >
            <Text style={styles.upgradeBtnText}>Upgrade</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ alignItems: 'flex-end' }}>
            <FontAwesome5 name=\"crown\" size={20} color=\"#fff\" />
            {user.plan !== 'premium' && (
              <TouchableOpacity
                onPress={() => router.push('/(onboarding)/plans')}
                style={{ marginTop: 4 }}
              >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' }}>
                  Upgrade
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Account Settings */}
      <TouchableOpacity style={styles.optionCard}>
        <View style={styles.optionLeft}>
          <View style={styles.optionIcon}>
            <Feather name=\"user\" size={20} color=\"#16A34A\" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Account Settings</Text>
            <Text style={styles.optionSubtitle}>Manage your profile</Text>
          </View>
        </View>
        <Feather name=\"chevron-right\" size={22} color=\"#999\" />
      </TouchableOpacity>

      {/* Notifications */}
      <TouchableOpacity style={styles.optionCard}>
        <View style={styles.optionLeft}>
          <View style={styles.optionIcon}>
            <Feather name=\"bell\" size={20} color=\"#16A34A\" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Notifications</Text>
            <Text style={styles.optionSubtitle}>Push notifications & alerts</Text>
          </View>
        </View>
        <Feather name=\"chevron-right\" size={22} color=\"#999\" />
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Feather name=\"log-out\" size={20} color=\"#dc2626\" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Expert Profile ───────────────────────────────────────────────────────────

const ExpertProfile = ({ authUser, onLogout }: { authUser: any; onLogout: () => void }) => {
  const router = useRouter();
  const [expertProfile, setExpertProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVerificationStatus()
      .then((res) => setExpertProfile(res.data.profile))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size=\"large\" color=\"#16A34A\" />
      </View>
    );
  }

  const isApproved = expertProfile?.overallStatus === 'approved';

  const stats = [
    { value: expertProfile?.performance?.casesHandled ?? 0,                  label: 'Cases'    },
    { value: expertProfile?.performance?.averageRating?.toFixed(1) ?? '—',   label: 'Rating'   },
    { value: expertProfile?.assessment?.score ? `${expertProfile.assessment.score}%` : '—', label: 'Test Score' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: '#1d4ed8' }]}>
          <Text style={styles.avatarText}>{getInitials(authUser?.name || 'E')}</Text>
        </View>
        <Text style={styles.name}>{authUser?.name}</Text>

        {/* Expert badge */}
        <View style={styles.expertBadge}>
          <Ionicons
            name={isApproved ? 'shield-checkmark' : 'time-outline'}
            size={12}
            color={isApproved ? '#16A34A' : '#d97706'}
          />
          <Text style={[styles.expertBadgeText, !isApproved && { color: '#d97706' }]}>
            {isApproved ? 'Verified Expert' : 'Pending Verification'}
          </Text>
        </View>

        <Text style={styles.email}>{authUser?.phone}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Specializations */}
      {expertProfile?.specializations?.length > 0 && (
        <View style={[styles.optionCard, { flexDirection: 'column', alignItems: 'flex-start' }]}>
          <Text style={styles.sectionLabel}>Specializations</Text>
          <View style={styles.chipRow}>
            {expertProfile.specializations.map((s: string) => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Verification Status */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => router.push('/(expert)/dashboard' as any)}
      >
        <View style={styles.optionLeft}>
          <View style={styles.optionIcon}>
            <Ionicons name=\"ribbon-outline\" size={20} color=\"#16A34A\" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Verification Status</Text>
            <Text style={styles.optionSubtitle}>
              {isApproved ? 'Fully verified — view badges' : 'Complete your verification'}
            </Text>
          </View>
        </View>
        <Feather name=\"chevron-right\" size={22} color=\"#999\" />
      </TouchableOpacity>

      {/* Badges */}
      {isApproved && expertProfile?.displayBadges?.length > 0 && (
        <View style={[styles.optionCard, { flexDirection: 'column', alignItems: 'flex-start' }]}>
          <Text style={styles.sectionLabel}>Badges</Text>
          <View style={styles.chipRow}>
            {expertProfile.displayBadges.map((badge: string) => (
              <View key={badge} style={styles.badgeChip}>
                <Ionicons name=\"checkmark-circle\" size={12} color=\"#16A34A\" />
                <Text style={styles.badgeChipText}>
                  {badge.replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Account Settings */}
      <TouchableOpacity style={styles.optionCard}>
        <View style={styles.optionLeft}>
          <View style={styles.optionIcon}>
            <Feather name=\"user\" size={20} color=\"#16A34A\" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Account Settings</Text>
            <Text style={styles.optionSubtitle}>Manage your profile</Text>
          </View>
        </View>
        <Feather name=\"chevron-right\" size={22} color=\"#999\" />
      </TouchableOpacity>

      {/* Notifications */}
      <TouchableOpacity style={styles.optionCard}>
        <View style={styles.optionLeft}>
          <View style={styles.optionIcon}>
            <Feather name=\"bell\" size={20} color=\"#16A34A\" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Notifications</Text>
            <Text style={styles.optionSubtitle}>Push notifications & alerts</Text>
          </View>
        </View>
        <Feather name=\"chevron-right\" size={22} color=\"#999\" />
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Feather name=\"log-out\" size={20} color=\"#dc2626\" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Main Profile Screen ──────────────────────────────────────────────────────

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const { user: authUser, logout, refreshUser } = useAuth();

  // ✅ useEffect always runs — no early returns before hooks
  useEffect(() => {
    const fetchLatestUser = async () => {
      try {
        const response = await getCurrentUser();
        if (response.user) {
          await setUserData({
            ...response.user,
            trialDaysRemaining: response.meta?.trialDaysRemaining,
            trialEndDate:       response.meta?.trialEndDate,
          });
          refreshUser();
        }
      } catch (error) {
        console.error('Failed to fetch latest user data', error);
      }
    };
    fetchLatestUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const success = await logout();
          if (success) {
            router.replace('/(onboarding)/login');
          } else {
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        },
      },
    ]);
  };

  // ✅ Role-based render happens AFTER hooks
  if (authUser?.role === 'expert') {
    return <ExpertProfile authUser={authUser} onLogout={handleLogout} />;
  }

  return <FarmerProfile authUser={authUser} onLogout={handleLogout} />;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFFB',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FFFB',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 4,
    overflow: 'hidden',
  },
  expertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginVertical: 4,
  },
  expertBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  email: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
  },
  premiumCard: {
    backgroundColor: '#16A34A',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  premiumTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  premiumText: {
    color: '#fff',
    opacity: 0.9,
    fontSize: 12,
    marginTop: 2,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  optionSubtitle: {
    fontSize: 12.5,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 13,
    marginTop: 8,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  chipText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeChipText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  upgradeBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeBtnText: {
    color: '#111',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default ProfileScreen;
