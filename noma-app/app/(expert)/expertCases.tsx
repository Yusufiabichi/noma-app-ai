import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getExpertAssignedCases } from "@/src/api/expertChat.api";
import { useApiCall } from "@/src/hooks/useApiCall";
import ErrorState from "@/app/components/ErrorState";

const COLORS = {
  primary: "#16A34A", primaryLight: "#f0fdf4", primaryBorder: "#bbf7d0",
  background: "#f8f8f8", white: "#ffffff", textDark: "#1f2937",
  textLight: "#6b7280", border: "#e5e7eb", error: "#dc2626",
  errorLight: "#fef2f2", amber: "#d97706", amberLight: "#fffbeb",
  amberBorder: "#fde68a", blue: "#2563eb", blueLight: "#eff6ff",
};

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; icon: string;
}> = {
  pending:     { label: "Needs response",  color: COLORS.amber,   bg: COLORS.amberLight,   icon: "time-outline"             },
  accepted:    { label: "Accepted",        color: COLORS.blue,    bg: COLORS.blueLight,    icon: "eye-outline"              },
  in_progress: { label: "In Progress",     color: COLORS.primary, bg: COLORS.primaryLight, icon: "refresh-outline"          },
  resolved:    { label: "Resolved",        color: COLORS.primary, bg: COLORS.primaryLight, icon: "checkmark-circle-outline" },
  declined:    { label: "Declined",        color: COLORS.error,   bg: COLORS.errorLight,   icon: "close-circle-outline"     },
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  low:      { color: COLORS.primary, bg: COLORS.primaryLight },
  moderate: { color: COLORS.amber,   bg: COLORS.amberLight   },
  high:     { color: COLORS.error,   bg: COLORS.errorLight   },
  severe:   { color: COLORS.error,   bg: COLORS.errorLight   },
};

const TABS = [
  { label: "All",         value: ""            },
  { label: "Pending",     value: "pending"     },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved",    value: "resolved"    },
  { label: "Declined",    value: "declined"    },
];

// ─── Case Card ────────────────────────────────────────────────────────────────

const CaseCard = ({ item, onPress }: { item: any; onPress: () => void }) => {
  const statusCfg   = STATUS_CONFIG[item.status]                         || STATUS_CONFIG.pending;
  const severityCfg = SEVERITY_CONFIG[item.diagnosisSnapshot?.severity]  || SEVERITY_CONFIG.moderate;
  const isPending   = item.status === "pending";

  return (
    <TouchableOpacity
      style={[styles.caseCard, isPending && styles.caseCardUrgent]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.statusStrip, { backgroundColor: statusCfg.color }]} />

      <View style={styles.caseBody}>
        {/* Top row */}
        <View style={styles.caseTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.caseCropLabel}>
              {item.diagnosisSnapshot?.cropType?.toUpperCase() || "—"}
            </Text>
            <Text style={styles.caseDisease} numberOfLines={1}>
              {item.diagnosisSnapshot?.disease?.replace(/_/g, " ") || "Unknown disease"}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon as any} size={11} color={statusCfg.color} />
            <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.caseMeta}>
          <View style={[styles.severityPill, { backgroundColor: severityCfg.bg }]}>
            <Ionicons name="warning-outline" size={11} color={severityCfg.color} />
            <Text style={[styles.severityText, { color: severityCfg.color }]}>
              {item.diagnosisSnapshot?.severity || "—"} severity
            </Text>
          </View>
          {item.diagnosisSnapshot?.confidence && (
            <Text style={styles.confidenceText}>
              {Math.round(item.diagnosisSnapshot.confidence * 100)}% confidence
            </Text>
          )}
          {item.diagnosisSnapshot?.isLowConfidence && (
            <View style={styles.lowConfFlag}>
              <Ionicons name="alert-circle" size={11} color="#7c4a00" />
              <Text style={styles.lowConfFlagText}>Low confidence</Text>
            </View>
          )}
        </View>

        {/* Farmer info */}
        <View style={styles.farmerRow}>
          <Ionicons name="person-outline" size={13} color={COLORS.textLight} />
          <Text style={styles.farmerName}>
            {item.farmer?.name || "Unknown farmer"}
          </Text>
        </View>

        {/* Farmer note preview */}
        {item.farmerNote && (
          <View style={styles.notePreview}>
            <Ionicons name="chatbubble-outline" size={12} color={COLORS.textLight} />
            <Text style={styles.notePreviewText} numberOfLines={1}>
              {item.farmerNote}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.caseFooter}>
          <Text style={styles.caseDate}>
            {new Date(item.createdAt).toLocaleDateString("en-NG", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </Text>
          {isPending && (
            <View style={styles.respondNudge}>
              <Text style={styles.respondNudgeText}>Respond now</Text>
              <Ionicons name="arrow-forward" size={12} color={COLORS.primary} />
            </View>
          )}
          {item.rating?.stars && (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons
                  key={s}
                  name={s <= item.rating.stars ? "star" : "star-outline"}
                  size={11}
                  color={COLORS.amber}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ExpertCasesScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("");

  const { data, loading, refreshing, error, retry, refresh } = useApiCall(
    () => getExpertAssignedCases(),
    []
  );

  const allCases: any[] = data?.cases || [];

  // Client-side tab filter
  const filtered = activeTab
    ? allCases.filter(c => c.status === activeTab)
    : allCases;

  // Count per status for badges
  const counts = TABS.reduce<Record<string, number>>((acc, tab) => {
    if (tab.value) {
      acc[tab.value] = allCases.filter(c => c.status === tab.value).length;
    }
    return acc;
  }, {});

  const pendingCount = counts["pending"] || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <View style={styles.navTitleRow}>
          <Text style={styles.navTitle}>Assigned Cases</Text>
          {pendingCount > 0 && (
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Summary strip */}
      {!loading && !error && allCases.length > 0 && (
        <View style={styles.summaryStrip}>
          <Text style={styles.summaryText}>
            {allCases.length} case{allCases.length !== 1 ? "s" : ""} total
          </Text>
          {pendingCount > 0 && (
            <View style={styles.pendingAlert}>
              <Ionicons name="alert-circle" size={12} color={COLORS.amber} />
              <Text style={styles.pendingAlertText}>
                {pendingCount} need{pendingCount === 1 ? "s" : ""} your response
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Status tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabScrollContent}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.value && counts[tab.value] > 0 && (
              <View style={[
                styles.tabBadge,
                activeTab === tab.value && styles.tabBadgeActive,
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  activeTab === tab.value && styles.tabBadgeTextActive,
                ]}>
                  {counts[tab.value]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>
                {activeTab
                  ? `No ${activeTab.replace("_", " ")} cases`
                  : "No cases assigned yet"}
              </Text>
              <Text style={styles.emptyDesc}>
                {activeTab
                  ? "Try a different filter to see other cases."
                  : "Farmer consultation cases assigned to you will appear here once submitted."}
              </Text>
            </View>
          ) : (
            filtered.map(item => (
              <CaseCard
                key={item._id}
                item={item}
                onPress={() => router.push({
                  pathname: "/(expert)/caseDetail",
                  params: { caseId: item._id },
                } as any)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },

  navHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center",
  },
  navTitleRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  navTitle:     { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  navBadge: {
    backgroundColor: COLORS.amber, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  navBadgeText: { fontSize: 10, fontWeight: "700", color: COLORS.white },

  summaryStrip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  summaryText:   { fontSize: 12, color: COLORS.textLight, fontWeight: "500" },
  pendingAlert:  { flexDirection: "row", alignItems: "center", gap: 4 },
  pendingAlertText: { fontSize: 11, color: COLORS.amber, fontWeight: "600" },

  tabScroll:        { flexGrow: 0, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabScrollContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: "center" },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 14,
    backgroundColor: COLORS.white, alignSelf: "flex-start",
  },
  tabActive:          { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText:            { fontSize: 12, color: COLORS.textDark, fontWeight: "600" },
  tabTextActive:      { color: COLORS.white },
  tabBadge:           { backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeActive:     { backgroundColor: "rgba(255,255,255,0.25)" },
  tabBadgeText:       { fontSize: 10, fontWeight: "700", color: COLORS.textDark },
  tabBadgeTextActive: { color: COLORS.white },

  listContent: { padding: 16, paddingBottom: 40 },

  caseCard: {
    flexDirection: "row", backgroundColor: COLORS.white, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, overflow: "hidden",
  },
  caseCardUrgent: { borderColor: COLORS.amberBorder },
  statusStrip:    { width: 4 },
  caseBody:       { flex: 1, padding: 14 },
  caseTopRow:     { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  caseCropLabel:  { fontSize: 10, color: COLORS.textLight, fontWeight: "700", letterSpacing: 0.4, marginBottom: 2 },
  caseDisease:    { fontSize: 15, fontWeight: "700", color: COLORS.textDark, textTransform: "capitalize" },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8,
    marginLeft: 8, alignSelf: "flex-start",
  },
  statusBadgeText: { fontSize: 10, fontWeight: "700" },

  caseMeta:    { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  severityPill:{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8 },
  severityText:{ fontSize: 10, fontWeight: "600" },
  confidenceText: { fontSize: 11, color: COLORS.textLight },
  lowConfFlag: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#fff8e1", borderRadius: 20, paddingVertical: 3, paddingHorizontal: 7,
  },
  lowConfFlagText: { fontSize: 10, color: "#7c4a00", fontWeight: "600" },

  farmerRow:    { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  farmerName:   { fontSize: 12, color: COLORS.textLight, fontWeight: "500" },
  notePreview:  { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.background, borderRadius: 8, padding: 8, marginBottom: 8 },
  notePreviewText: { flex: 1, fontSize: 12, color: COLORS.textLight },

  caseFooter:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  caseDate:         { fontSize: 11, color: COLORS.textLight },
  respondNudge:     { flexDirection: "row", alignItems: "center", gap: 4 },
  respondNudgeText: { fontSize: 11, color: COLORS.primary, fontWeight: "700" },
  ratingRow:        { flexDirection: "row", gap: 2 },

  emptyContainer: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle:     { fontSize: 16, fontWeight: "700", color: COLORS.textDark, marginTop: 16 },
  emptyDesc:      { fontSize: 13, color: COLORS.textLight, textAlign: "center", lineHeight: 19, marginTop: 6 },
});

export default ExpertCasesScreen;