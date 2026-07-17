import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { listExperts } from "@/src/api/expertChat.api";
import { useAuth } from "@/src/hooks/useAuth";

const COLORS = {
  primary: "#16A34A", primaryLight: "#f0fdf4", primaryBorder: "#bbf7d0",
  background: "#f8f8f8", white: "#ffffff", textDark: "#1f2937",
  textLight: "#6b7280", border: "#e5e7eb", error: "#dc2626",
  errorLight: "#fef2f2", amber: "#d97706", amberLight: "#fffbeb",
  amberBorder: "#fde68a",
};

const CROP_FILTERS = [
  { label: "All",      value: ""           },
  { label: "Maize",    value: "maize"      },
  { label: "Rice",     value: "rice"       },
  { label: "Tomato",   value: "tomato"     },
  { label: "Cassava",  value: "cassava"    },
  { label: "Yam",      value: "yam"        },
  { label: "Sorghum",  value: "sorghum"    },
  { label: "Cowpea",   value: "cowpea"     },
  { label: "Soybean",  value: "soybean"    },
  { label: "Vegetables", value: "vegetables" },
  { label: "Fruits",   value: "fruits"     },
];

const SORT_OPTIONS = [
  { label: "Top Rated",  value: "rating"     },
  { label: "Most Cases", value: "cases"      },
  { label: "Experience", value: "experience" },
];

const BADGE_CONFIG: Record<string, { icon: string; color: string }> = {
  verified_identity: { icon: "shield-checkmark", color: COLORS.primary },
  ag_professional:   { icon: "leaf",             color: COLORS.primary },
  passed_assessment: { icon: "ribbon",           color: COLORS.amber   },
  top_rated:         { icon: "star",             color: COLORS.amber   },
  cases_100_plus:    { icon: "trophy",           color: COLORS.primary },
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

// ─── Expert Card ──────────────────────────────────────────────────────────────

const ExpertCard = ({
  expert, onSelect,
}: { expert: any; onSelect: () => void }) => {
  const roleLabel = ROLE_LABELS[expert.currentRole] || "Agricultural Expert";
  const rating = expert.performance?.averageRating || 0;
  const totalRatings = expert.performance?.totalRatings || 0;
  const cases = expert.performance?.casesHandled || 0;

  const getInitials = (name: string) =>
    (name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <TouchableOpacity style={styles.expertCard} onPress={onSelect} activeOpacity={0.75}>
      <View style={styles.expertHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(expert.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.expertName}>{expert.name}</Text>
          <Text style={styles.expertRole}>{roleLabel}</Text>
          {expert.currentOrganization && (
            <Text style={styles.expertOrg} numberOfLines={1}>
              {expert.currentOrganization}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </View>

      {/* Stats */}
      <View style={styles.expertStats}>
        <View style={styles.statChip}>
          <Ionicons name="star" size={13} color={COLORS.amber} />
          <Text style={styles.statChipText}>
            {rating > 0 ? rating.toFixed(1) : "New"}
            {totalRatings > 0 && <Text style={styles.statChipSub}> ({totalRatings})</Text>}
          </Text>
        </View>
        <View style={styles.statChip}>
          <Ionicons name="briefcase-outline" size={13} color={COLORS.textLight} />
          <Text style={styles.statChipText}>{cases} case{cases !== 1 ? "s" : ""}</Text>
        </View>
        <View style={styles.statChip}>
          <Ionicons name="time-outline" size={13} color={COLORS.textLight} />
          <Text style={styles.statChipText}>{expert.yearsOfExperience}+ yrs</Text>
        </View>
      </View>

      {/* Specializations */}
      {expert.specializations?.length > 0 && (
        <View style={styles.specRow}>
          {expert.specializations.slice(0, 4).map((s: string) => (
            <View key={s} style={styles.specChip}>
              <Text style={styles.specChipText}>{s}</Text>
            </View>
          ))}
          {expert.specializations.length > 4 && (
            <Text style={styles.specMore}>+{expert.specializations.length - 4}</Text>
          )}
        </View>
      )}

      {/* Badges */}
      {expert.badges?.length > 0 && (
        <View style={styles.badgeRow}>
          {expert.badges.slice(0, 3).map((badgeKey: string) => {
            const cfg = BADGE_CONFIG[badgeKey];
            if (!cfg) return null;
            return (
              <Ionicons key={badgeKey} name={cfg.icon as any} size={14} color={cfg.color} style={{ marginRight: 6 }} />
            );
          })}
        </View>
      )}

      {/* Bio preview */}
      {expert.bio && (
        <Text style={styles.bioPreview} numberOfLines={2}>{expert.bio}</Text>
      )}
    </TouchableOpacity>
  );
};

// ─── Locked State (Free plan) ─────────────────────────────────────────────────

const LockedScreen = ({ onUpgrade }: { onUpgrade: () => void }) => (
  <View style={styles.lockedContainer}>
    <View style={styles.lockedIcon}>
      <Ionicons name="lock-closed" size={32} color={COLORS.amber} />
    </View>
    <Text style={styles.lockedTitle}>Expert Consultations</Text>
    <Text style={styles.lockedDesc}>
      Get your crop diagnosis reviewed by verified agricultural experts.
      This feature is available on Basic and Premium plans.
    </Text>

    <View style={styles.lockedFeatures}>
      {[
        "Connect with verified extension officers & agronomists",
        "Get personalized treatment advice for your crops",
        "Basic plan: 5 sessions/month · Premium: unlimited",
      ].map((f, i) => (
        <View key={i} style={styles.lockedFeatureRow}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
          <Text style={styles.lockedFeatureText}>{f}</Text>
        </View>
      ))}
    </View>

    <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
      <Text style={styles.upgradeBtnText}>View Plans</Text>
      <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ExpertChatScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const scanId = params.scanId as string | undefined;

  const [experts, setExperts]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matchedByCrop, setMatchedByCrop] = useState(false);
  const [cropType, setCropType]     = useState<string | null>(null);

  const [activeCropFilter, setActiveCropFilter] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const plan = user?.subscription?.plan;
  const role = user?.role;
  const isLocked = plan === "free" || !plan;

  const fetchExperts = useCallback(async () => {
    try {
      const res = await listExperts({
        scanId: !activeCropFilter ? scanId : undefined,
        cropType: activeCropFilter || undefined,
        sortBy: sortBy as any,
      });
      setExperts(res.data.experts);
      setMatchedByCrop(res.data.matchedByCrop);
      setCropType(res.data.cropType);
    } catch (err) {
      console.error("Failed to fetch experts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [scanId, activeCropFilter, sortBy]);

  useEffect(() => {
    if (!isLocked) fetchExperts();
    else setLoading(false);
  }, [activeCropFilter, sortBy]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExperts();
  };

  const handleSelectExpert = (expert: any) => {
    router.push({
      pathname: "../fileCaseScreen",
      params: {
        expertUserId: expert.userId,
        expertName: expert.name,
        scanId: scanId || "",
      },
    });
  };

  if (isLocked) {
    return (
      <View style={styles.container}>
        <View style={styles.navHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Talk to an Expert</Text>
          <View style={{ width: 36 }} />
        </View>
        <LockedScreen onUpgrade={() => router.push("/(onboarding)/plans")} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Talk to an Expert</Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortMenu(!showSortMenu)}>
          <Ionicons name="filter-outline" size={18} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      {/* Sort menu */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sortOption, sortBy === opt.value && styles.sortOptionActive]}
              onPress={() => { setSortBy(opt.value); setShowSortMenu(false); }}
            >
              <Text style={[styles.sortOptionText, sortBy === opt.value && styles.sortOptionTextActive]}>
                {opt.label}
              </Text>
              {sortBy === opt.value && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Session counter for Basic plan */}
      {plan === "basic" && (
        <View style={styles.sessionBanner}>
          <Ionicons name="chatbubbles-outline" size={14} color={COLORS.primary} />
          <Text style={styles.sessionBannerText}>
            {Math.max(0, 5 - (user?.usage?.expertSessionsUsed || 0))} of 5 sessions remaining this month
          </Text>
        </View>
      )}

      {/* Match banner */}
      {!loading && (
        <View style={[styles.matchBanner, matchedByCrop ? styles.matchBannerSuccess : styles.matchBannerInfo]}>
          <Ionicons
            name={matchedByCrop ? "checkmark-circle" : "information-circle-outline"}
            size={16}
            color={matchedByCrop ? COLORS.primary : COLORS.textLight}
          />
          <Text style={[styles.matchBannerText, matchedByCrop && { color: COLORS.primary }]}>
            {matchedByCrop
              ? `${experts.length} expert${experts.length !== 1 ? "s" : ""} specializing in ${cropType}`
              : cropType
              ? `No ${cropType} specialists found — showing all experts`
              : `Showing all available experts`}
          </Text>
        </View>
      )}

      {/* Crop filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
      >
        {CROP_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, activeCropFilter === f.value && styles.filterChipActive]}
            onPress={() => setActiveCropFilter(f.value)}
          >
            <Text style={[styles.filterChipText, activeCropFilter === f.value && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Expert list */}
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
              <Ionicons name="people-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No experts available</Text>
              <Text style={styles.emptyDesc}>
                Try a different crop filter or check back later.
              </Text>
            </View>
          ) : (
            experts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                onSelect={() => handleSelectExpert(expert)}
              />
            ))
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
  sortBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center",
  },
  navTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },

  sortMenu: {
    position: "absolute", top: 100, right: 20, zIndex: 10,
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, paddingVertical: 6, minWidth: 160,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  sortOption: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, paddingHorizontal: 14,
  },
  sortOptionActive: { backgroundColor: COLORS.primaryLight },
  sortOptionText: { fontSize: 13, color: COLORS.textDark },
  sortOptionTextActive: { color: COLORS.primary, fontWeight: "600" },

  sessionBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.primaryLight, paddingVertical: 8, paddingHorizontal: 20,
  },
  sessionBannerText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },

  matchBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10, paddingHorizontal: 20,
  },
  matchBannerSuccess: { backgroundColor: COLORS.primaryLight },
  matchBannerInfo:    { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  matchBannerText: { fontSize: 12, color: COLORS.textLight, fontWeight: "500", flex: 1 },

  filterScroll: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexGrow: 0 },
  filterScrollContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: "center" },
  filterChip: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 14, backgroundColor: COLORS.white, alignSelf: "flex-start"
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 12, color: COLORS.textDark, fontWeight: "500" },
  filterChipTextActive: { color: COLORS.white },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, paddingBottom: 40 },

  emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark, marginTop: 12 },
  emptyDesc:  { fontSize: 13, color: COLORS.textLight, textAlign: "center", marginTop: 4 },

  // Expert card
  expertCard: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 12,
  },
  expertHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  avatarText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  expertName: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  expertRole: { fontSize: 12, color: COLORS.primary, fontWeight: "600", marginTop: 1 },
  expertOrg:  { fontSize: 11, color: COLORS.textLight, marginTop: 2 },

  expertStats: { flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  statChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.background, borderRadius: 6,
    paddingVertical: 4, paddingHorizontal: 8,
  },
  statChipText: { fontSize: 11, color: COLORS.textDark, fontWeight: "600" },
  statChipSub:  { color: COLORS.textLight, fontWeight: "400" },

  specRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8, alignItems: "center" },
  specChip: {
    backgroundColor: COLORS.primaryLight, borderRadius: 6,
    paddingVertical: 3, paddingHorizontal: 8,
  },
  specChipText: { fontSize: 10, color: COLORS.primary, fontWeight: "600", textTransform: "capitalize" },
  specMore: { fontSize: 10, color: COLORS.textLight, fontWeight: "600" },

  badgeRow: { flexDirection: "row", marginBottom: 8 },

  bioPreview: { fontSize: 12, color: COLORS.textLight, lineHeight: 17 },

  // Locked state
  lockedContainer: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 50 },
  lockedIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.amberLight,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
    borderWidth: 1, borderColor: COLORS.amberBorder,
  },
  lockedTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textDark, marginBottom: 8 },
  lockedDesc: { fontSize: 13, color: COLORS.textLight, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  lockedFeatures: { width: "100%", gap: 12, marginBottom: 28 },
  lockedFeatureRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  lockedFeatureText: { flex: 1, fontSize: 13, color: COLORS.textDark, lineHeight: 19 },
  upgradeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15,
    paddingHorizontal: 32, width: "100%",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  upgradeBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
});

export default ExpertChatScreen;