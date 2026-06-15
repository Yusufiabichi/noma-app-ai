import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { adminGetAnalyticsSummary } from "@/src/api/admin.api";
import { useAuth } from "@/src/hooks/useAuth";

const COLORS = {
  primary: "#16A34A", primaryLight: "#f0fdf4", primaryBorder: "#bbf7d0",
  background: "#f8f8f8", white: "#ffffff", textDark: "#1f2937",
  textLight: "#6b7280", border: "#e5e7eb", error: "#dc2626",
  errorLight: "#fef2f2", amber: "#d97706", amberLight: "#fffbeb",
  blue: "#2563eb", blueLight: "#eff6ff",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  icon, label, value, sublabel, color = COLORS.primary, bg = COLORS.primaryLight,
}: {
  icon: string; label: string; value: string | number;
  sublabel?: string; color?: string; bg?: string;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: bg }]}>
      <Ionicons name={icon as any} size={18} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sublabel && <Text style={styles.statSublabel}>{sublabel}</Text>}
  </View>
);

// ─── Quick Action ─────────────────────────────────────────────────────────────

const QuickAction = ({
  icon, title, subtitle, badge, onPress, color = COLORS.primary,
}: {
  icon: string; title: string; subtitle: string;
  badge?: number; onPress: () => void; color?: string;
}) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.75}>
    <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </View>
    {badge !== undefined && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
    <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const AdminDashboardScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await adminGetAnalyticsSummary();
      setData(res.data);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isSuperAdmin = user?.adminRole === "super_admin";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Dashboard</Text>
          <Text style={styles.headerSub}>
            {user?.name} · {isSuperAdmin ? "Super Admin" : user?.adminRole}
          </Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
        </View>
      </View>

      {/* Overview Stats */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsGrid}>
        <StatCard
          icon="people-outline"
          label="Total Farmers"
          value={data?.users?.farmers ?? 0}
          sublabel={`+${data?.users?.newLast7Days ?? 0} this week`}
        />
        <StatCard
          icon="school-outline"
          label="Experts"
          value={data?.users?.experts ?? 0}
          sublabel={`${data?.experts?.approved ?? 0} approved`}
          color={COLORS.blue}
          bg={COLORS.blueLight}
        />
        <StatCard
          icon="scan-outline"
          label="Total Scans"
          value={data?.scans?.total ?? 0}
          sublabel={`+${data?.scans?.last7Days ?? 0} this week`}
        />
        <StatCard
          icon="document-text-outline"
          label="Total Cases"
          value={data?.cases?.total ?? 0}
          sublabel={`${data?.cases?.pending ?? 0} pending`}
          color={COLORS.amber}
          bg={COLORS.amberLight}
        />
      </View>

      {/* Subscription Breakdown */}
      {data?.subscriptions && (
        <View style={styles.subBreakdown}>
          <Text style={styles.sectionTitle}>Subscription Breakdown</Text>
          <View style={styles.subRow}>
            {Object.entries(data.subscriptions).map(([plan, count]: [string, any]) => (
              <View key={plan} style={styles.subItem}>
                <Text style={styles.subCount}>{count}</Text>
                <Text style={styles.subPlan}>{plan}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Action Required</Text>

      <QuickAction
        icon="document-text-outline"
        title="Expert Verifications"
        subtitle="Review pending documents"
        badge={data?.experts?.pendingReview}
        onPress={() => router.push("/(admin)/adminExpertsList" as any)}
        color={COLORS.primary}
      />

      <QuickAction
        icon="briefcase-outline"
        title="Case Oversight"
        subtitle="Monitor & manage farmer cases"
        badge={data?.cases?.pending}
        onPress={() => router.push("/(admin)/cases" as any)}
        color={COLORS.amber}
      />

      <Text style={styles.sectionTitle}>Management</Text>

      <QuickAction
        icon="help-circle-outline"
        title="Assessment Questions"
        subtitle="Manage the expert competency test bank"
        onPress={() => router.push("/(admin)/questions" as any)}
        color={COLORS.blue}
      />

      {isSuperAdmin && (
        <QuickAction
          icon="people-circle-outline"
          title="Admin Team"
          subtitle="Manage admin accounts & permissions"
          onPress={() => router.push("/(admin)/admins" as any)}
          color="#7c3aed"
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 40 },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: COLORS.textDark, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: COLORS.textLight, marginTop: 3 },
  adminBadge: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryLight,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: COLORS.primaryBorder,
  },

  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textDark, marginBottom: 12, marginTop: 4 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  statCard: {
    width: "47%", backgroundColor: COLORS.white, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, padding: 14,
  },
  statIcon: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: "700", color: COLORS.textDark },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 2, fontWeight: "500" },
  statSublabel: { fontSize: 11, color: COLORS.primary, marginTop: 4, fontWeight: "600" },

  subBreakdown: { marginBottom: 24 },
  subRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  subItem: {
    flex: 1, minWidth: 70, backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, padding: 12, alignItems: "center",
  },
  subCount: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  subPlan:  { fontSize: 11, color: COLORS.textLight, marginTop: 2, textTransform: "capitalize" },

  actionCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 10,
  },
  actionIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  actionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textDark },
  actionSubtitle: { fontSize: 12, color: COLORS.textLight, marginTop: 1 },
  badge: {
    backgroundColor: COLORS.error, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2, minWidth: 22, alignItems: "center",
  },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
});

export default AdminDashboardScreen;