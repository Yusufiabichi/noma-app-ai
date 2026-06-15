// app/(admin)/profile.tsx
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import { useAuth } from '@/src/hooks/useAuth';

const COLORS = {
  primary: '#16A34A', primaryLight: '#f0fdf4',
  background: '#f8f8f8', white: '#ffffff',
  textDark: '#1f2937', textLight: '#6b7280',
  border: '#e5e7eb', error: '#dc2626',
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  moderator:   'Moderator',
  reviewer:    'Reviewer',
};

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const getInitials = (name: string) =>
    (name || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          const success = await logout();
          if (success) router.replace('/(onboarding)/login');
        },
      },
    ]);
  };

  return (

    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#16A34A"
        translucent={false}
      />
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Admin Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name || 'A')}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>

          {/* Admin role badge */}
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={12} color={COLORS.primary} />
            <Text style={styles.roleBadgeText}>
              {ROLE_LABELS[user?.adminRole] || 'Admin'}
            </Text>
          </View>
          <Text style={styles.phone}>{user?.phone}</Text>
        </View>

        {/* Scan Crop — admins can still diagnose */}
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => router.push('../cropscan' as any)}
        >
          <FontAwesome name="camera" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.scanBtnText}>Scan a Crop</Text>
        </TouchableOpacity>

        {/* Permissions */}
        {user?.adminRole !== 'super_admin' && user?.permissions?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Permissions</Text>
            {user.permissions.map((p: string) => (
              <View key={p} style={styles.permRow}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                <Text style={styles.permText}>{p.replace(':', ' › ')}</Text>
              </View>
            ))}
          </View>
        )}

        {user?.adminRole === 'super_admin' && (
          <View style={styles.superAdminBadge}>
            <Ionicons name="infinite-outline" size={16} color={COLORS.primary} />
            <Text style={styles.superAdminText}>Full access to all admin features</Text>
          </View>
        )}

        {/* Settings */}
        <TouchableOpacity style={styles.optionCard}>
          <View style={styles.optionLeft}>
            <View style={styles.optionIcon}>
              <Feather name="bell" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.optionTitle}>Notifications</Text>
          </View>
          <Feather name="chevron-right" size={18} color={COLORS.textLight} />
        </TouchableOpacity>

        {/* Manage admins — super admin only */}
        {user?.adminRole === 'super_admin' && (
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.push('./(admin)/admins' as any)}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIcon}>
                <Ionicons name="people-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.optionTitle}>Manage Admin Team</Text>
            </View>
            <Feather name="chevron-right" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary, alignItems: 'center',
    justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: COLORS.white, fontSize: 24, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primaryLight, borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 12, marginBottom: 6,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  phone: { fontSize: 13, color: COLORS.textLight },

  card: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 16, marginBottom: 12,
  },
  cardTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textLight,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  permText: { fontSize: 13, color: COLORS.textDark, textTransform: 'capitalize' },

  superAdminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primaryLight, borderRadius: 12,
    padding: 14, marginBottom: 16,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  superAdminText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  optionCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 10,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionIcon: {
    width: 34, height: 34, borderRadius: 9, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  optionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, paddingVertical: 13, marginTop: 8,
  },
  logoutText: { color: COLORS.error, fontSize: 14, fontWeight: '600' },
});