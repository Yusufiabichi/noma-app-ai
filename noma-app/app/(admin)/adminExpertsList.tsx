import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { adminListExperts } from "@/src/api/admin.api";

const COLORS = {
  primary: "#16A34A", primaryLight: "#f0fdf4", primaryBorder: "#bbf7d0",
  background: "#f8f8f8", white: "#ffffff", textDark: "#1f2937",
  textLight: "#6b7280", border: "#e5e7eb", error: "#dc2626",
  errorLight: "#fef2f2", amber: "#d97706", amberLight: "#fffbeb",
};

const TABS = [
  { label: "Pending",  value: "pending_review" },
  { label: "Approved", value: "approved"        },
  { label: "Rejected", value: "rejected"        },
  { label: "Incomplete", value: "incomplete"    },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending_review: { color: COLORS.amber,   bg: COLORS.amberLight,  label: "Pending Review" },
  approved:       { color: COLORS.primary, bg: COLORS.primaryLight, label: "Approved" },
  rejected:       { color: COLORS.error,   bg: COLORS.errorLight,  label: "Rejected" },
  incomplete:     { color: COLORS.textLight, bg: COLORS.background, label: "Incomplete" },
};

const ROLE_LABELS: Record<string, string> = {
  extension_officer: "Extension Officer",
  agronomist: "Agronomist",
  plant_pathologist: "Plant Pathologist",
  researcher: "Researcher",
  university_lecturer: "University Lecturer",
  ngo_worker: "NGO Worker",
  agribusiness_professional: "Agribusiness Professional",
  other: "Agricultural Expert",
};

const AdminExpertsListScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab]   = useState("pending_review");
  const [experts, setExperts]       = useState<any[]>([]);
  const [counts, setCounts]         = useState<Record<string, number>>({});
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExperts = useCallback(async () => {
    try {
      const res = await adminListExperts({ status: activeTab, search: search || undefined });
      setExperts(res.data.experts);
      setCounts(res.data.statusCounts || {});
    } catch (err) {
      console.error("Failed to fetch experts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    setLoading(true);
    fetchExperts();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExperts();
  };

  const getInitials = (name: string) =>
    (name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Expert Verifications</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor={COLORS.textLight}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchExperts}
        />
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabScrollContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {counts[tab.value] > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.value && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.value && styles.tabBadgeTextActive]}>
                  {counts[tab.value]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          {experts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No experts here</Text>
              <Text style={styles.emptyDesc}>
                {activeTab === "pending_review"
                  ? "No documents waiting for review"
                  : `No ${STATUS_CONFIG[activeTab]?.label.toLowerCase()} experts`}
              </Text>
            </View>
          ) : (
            experts.map((expert) => {
              const cfg = STATUS_CONFIG[expert.overallStatus] || STATUS_CONFIG.incomplete;
              return (
                <TouchableOpacity
                  key={expert._id}
                  style={styles.expertCard}
                  onPress={() => router.push(`/(admin)/experts/${expert._id}` as any)}
                  activeOpacity={0.75}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(expert.user?.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expertName}>{expert.user?.name || "Unknown"}</Text>
                    <Text style={styles.expertMeta}>
                      {ROLE_LABELS[expert.currentRole] || "—"} · {expert.user?.phone}
                    </Text>
                    {expert.stage2SubmittedAt && (
                      <Text style={styles.expertDate}>
                        Submitted {new Date(expert.stage2SubmittedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center",
  },
  navTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },

  searchWrapper: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 12,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textDark },

  tabScroll: { marginTop: 12, flexGrow: 0 },
  tabScrollContent: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingVertical: 7, paddingHorizontal: 14, backgroundColor: COLORS.white,
    alignSelf: "flex-start",
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, color: COLORS.textDark, fontWeight: "600" },
  tabTextActive: { color: COLORS.white },
  tabBadge: { backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabBadgeText: { fontSize: 10, fontWeight: "700", color: COLORS.textDark },
  tabBadgeTextActive: { color: COLORS.white },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, paddingBottom: 40 },

  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: COLORS.textLight, marginTop: 4, textAlign: "center", paddingHorizontal: 40 },

  expertCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 10,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  expertName: { fontSize: 14, fontWeight: "700", color: COLORS.textDark },
  expertMeta: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  expertDate: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: "700" },
});

export default AdminExpertsListScreen;