import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { adminListCases, adminGetCaseDetail, adminUpdateCase } from "@/src/api/admin.api";

const COLORS = {
  primary: "#16A34A", primaryLight: "#f0fdf4", primaryBorder: "#bbf7d0",
  background: "#f8f8f8", white: "#ffffff", textDark: "#1f2937",
  textLight: "#6b7280", border: "#e5e7eb", error: "#dc2626",
  errorLight: "#fef2f2", amber: "#d97706", amberLight: "#fffbeb",
  blue: "#2563eb", blueLight: "#eff6ff",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:     { label: "Pending",     color: COLORS.amber,   bg: COLORS.amberLight,   icon: "time-outline"           },
  accepted:    { label: "Accepted",    color: COLORS.blue,    bg: COLORS.blueLight,    icon: "checkmark-circle-outline"},
  in_progress: { label: "In Progress", color: COLORS.primary, bg: COLORS.primaryLight, icon: "refresh-outline"        },
  resolved:    { label: "Resolved",    color: COLORS.primary, bg: COLORS.primaryLight, icon: "checkmark-done-outline" },
  declined:    { label: "Declined",    color: COLORS.error,   bg: COLORS.errorLight,   icon: "close-circle-outline"   },
};

const STATUS_TABS = [
  { label: "All",         value: ""            },
  { label: "Pending",     value: "pending"     },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved",    value: "resolved"    },
  { label: "Declined",    value: "declined"    },
];

// ─── Case Detail Modal ────────────────────────────────────────────────────────
const CaseDetailModal = ({
  visible, caseId, onClose, onUpdate,
}: {
  visible: boolean; caseId: string | null;
  onClose: () => void; onUpdate: () => void;
}) => {
  const [caseData, setCaseData]       = useState<any>(null);
  const [loading, setLoading]         = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote]     = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    if (visible && caseId) {
      setLoading(true);
      setAdminNote("");
      setShowNoteInput(false);
      setPendingAction(null);
      adminGetCaseDetail(caseId)
        .then(res => setCaseData(res.data.case))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [visible, caseId]);

  const handleAction = (action: string) => {
    setPendingAction(action);
    setShowNoteInput(true);
  };

  const confirmAction = async () => {
    if (!pendingAction || !caseId) return;
    setActionLoading(true);
    try {
      await adminUpdateCase(caseId, { action: pendingAction as any, adminNote });
      onUpdate();
      onClose();
      Alert.alert("Done", `Case ${pendingAction}d successfully.`);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error?.message || `Failed to ${pendingAction} case`);
    } finally {
      setActionLoading(false);
    }
  };

  const status = caseData?.status;
  const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const canResolve  = ["pending", "accepted", "in_progress"].includes(status);
  const canDecline  = ["pending", "accepted"].includes(status);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={modal.container}>
        {/* Header */}
        <View style={modal.header}>
          <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
            <Ionicons name="close" size={20} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={modal.headerTitle}>Case Detail</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View style={modal.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : caseData ? (
          <ScrollView contentContainerStyle={modal.content}>
            {/* Status */}
            <View style={[modal.statusBanner, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
              <Text style={[modal.statusText, { color: cfg.color }]}>{cfg.label}</Text>
              <Text style={modal.statusDate}>
                {new Date(caseData.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {/* Diagnosis Snapshot */}
            <View style={modal.section}>
              <Text style={modal.sectionTitle}>Diagnosis</Text>
              <View style={modal.infoRow}>
                <Text style={modal.infoLabel}>Crop</Text>
                <Text style={modal.infoValue}>{caseData.diagnosisSnapshot?.cropType || "—"}</Text>
              </View>
              <View style={modal.infoRow}>
                <Text style={modal.infoLabel}>Disease</Text>
                <Text style={modal.infoValue}>{caseData.diagnosisSnapshot?.disease || "—"}</Text>
              </View>
              <View style={modal.infoRow}>
                <Text style={modal.infoLabel}>Severity</Text>
                <Text style={modal.infoValue}>{caseData.diagnosisSnapshot?.severity || "—"}</Text>
              </View>
              <View style={modal.infoRow}>
                <Text style={modal.infoLabel}>Confidence</Text>
                <Text style={modal.infoValue}>
                  {caseData.diagnosisSnapshot?.confidence
                    ? `${Math.round(caseData.diagnosisSnapshot.confidence)}%`
                    : "—"}
                </Text>
              </View>
            </View>

            {/* Farmer */}
            <View style={modal.section}>
              <Text style={modal.sectionTitle}>Farmer</Text>
              <View style={modal.infoRow}>
                <Text style={modal.infoLabel}>Name</Text>
                <Text style={modal.infoValue}>{caseData.farmer?.name || "—"}</Text>
              </View>
              <View style={modal.infoRow}>
                <Text style={modal.infoLabel}>Phone</Text>
                <Text style={modal.infoValue}>{caseData.farmer?.phone || "—"}</Text>
              </View>
              {caseData.farmerNote && (
                <View style={modal.noteBox}>
                  <Text style={modal.noteLabel}>Farmer's note</Text>
                  <Text style={modal.noteText}>{caseData.farmerNote}</Text>
                </View>
              )}
            </View>

            {/* Expert */}
            <View style={modal.section}>
              <Text style={modal.sectionTitle}>Assigned Expert</Text>
              <View style={modal.infoRow}>
                <Text style={modal.infoLabel}>Name</Text>
                <Text style={modal.infoValue}>{caseData.expert?.name || "—"}</Text>
              </View>
              <View style={modal.infoRow}>
                <Text style={modal.infoLabel}>Phone</Text>
                <Text style={modal.infoValue}>{caseData.expert?.phone || "—"}</Text>
              </View>
            </View>

            {/* Expert Response */}
            {caseData.expertResponse?.message && (
              <View style={modal.section}>
                <Text style={modal.sectionTitle}>Expert Response</Text>
                <View style={modal.responseBox}>
                  <Text style={modal.responseText}>{caseData.expertResponse.message}</Text>
                  <Text style={modal.responseDate}>
                    {new Date(caseData.expertResponse.respondedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Rating */}
            {caseData.rating && (
              <View style={modal.section}>
                <Text style={modal.sectionTitle}>Farmer Rating</Text>
                <View style={modal.infoRow}>
                  <Text style={modal.infoLabel}>Stars</Text>
                  <View style={modal.starsRow}>
                    {[1,2,3,4,5].map(s => (
                      <Ionicons
                        key={s}
                        name={s <= caseData.rating.stars ? "star" : "star-outline"}
                        size={14}
                        color={COLORS.amber}
                      />
                    ))}
                  </View>
                </View>
                <View style={modal.infoRow}>
                  <Text style={modal.infoLabel}>Helpful?</Text>
                  <Text style={modal.infoValue}>{caseData.rating.helpful ? "Yes" : "No"}</Text>
                </View>
              </View>
            )}

            {/* Admin Note Input */}
            {showNoteInput && (
              <View style={modal.section}>
                <Text style={modal.sectionTitle}>
                  Admin Note for "{pendingAction}"
                </Text>
                <TextInput
                  style={modal.noteInput}
                  placeholder="Add a note (optional)..."
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  numberOfLines={3}
                  value={adminNote}
                  onChangeText={setAdminNote}
                />
                <View style={modal.confirmRow}>
                  <TouchableOpacity
                    style={modal.cancelActionBtn}
                    onPress={() => { setShowNoteInput(false); setPendingAction(null); }}
                  >
                    <Text style={modal.cancelActionText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      modal.confirmActionBtn,
                      pendingAction === "decline" && modal.confirmActionBtnDanger,
                      actionLoading && { opacity: 0.65 },
                    ]}
                    onPress={confirmAction}
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? <ActivityIndicator size="small" color={COLORS.white} />
                      : <Text style={modal.confirmActionText}>
                          Confirm {pendingAction?.charAt(0).toUpperCase()}{pendingAction?.slice(1)}
                        </Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Action buttons */}
            {!showNoteInput && (
              <View style={modal.actionsRow}>
                {canResolve && (
                  <TouchableOpacity
                    style={modal.resolveBtn}
                    onPress={() => handleAction("resolve")}
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} />
                    <Text style={modal.resolveBtnText}>Mark Resolved</Text>
                  </TouchableOpacity>
                )}
                {canDecline && (
                  <TouchableOpacity
                    style={modal.declineBtn}
                    onPress={() => handleAction("decline")}
                  >
                    <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
                    <Text style={modal.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AdminCasesScreen = () => {
  const router = useRouter();
  const [cases, setCases]           = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState("");
  const [search, setSearch]         = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [detailVisible, setDetailVisible]   = useState(false);

  const fetchCases = useCallback(async () => {
    try {
      const res = await adminListCases({ status: activeTab || undefined, search: search || undefined });
      setCases(res.data.cases);
      setStatusCounts(res.data.statusCounts || {});
    } catch (err) {
      console.error("Failed to fetch cases:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    setLoading(true);
    fetchCases();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const openDetail = (id: string) => {
    setSelectedCaseId(id);
    setDetailVisible(true);
  };

  const totalCases = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Case Oversight</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search farmer, expert or disease..."
          placeholderTextColor={COLORS.textLight}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchCases}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(""); fetchCases(); }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status tabs */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabScrollContent}
      >
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.value !== "" && statusCounts[tab.value] > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.value && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.value && styles.tabBadgeTextActive]}>
                  {statusCounts[tab.value]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Total count */}
      {!loading && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>
            {cases.length} case{cases.length !== 1 ? "s" : ""}
            {activeTab ? ` · ${STATUS_CONFIG[activeTab]?.label}` : " · All"}
          </Text>
        </View>
      )}

      {/* Cases list */}
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
          {cases.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No cases found</Text>
              <Text style={styles.emptyDesc}>
                {activeTab ? `No ${STATUS_CONFIG[activeTab]?.label.toLowerCase()} cases` : "No cases yet"}
              </Text>
            </View>
          ) : (
            cases.map(c => {
              const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
              return (
                <TouchableOpacity
                  key={c._id}
                  style={styles.caseCard}
                  onPress={() => openDetail(c._id)}
                  activeOpacity={0.75}
                >
                  {/* Status strip */}
                  <View style={[styles.caseStatusStrip, { backgroundColor: cfg.color }]} />

                  <View style={styles.caseCardContent}>
                    <View style={styles.caseCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.caseCrop}>
                          {c.diagnosisSnapshot?.cropType || "Unknown crop"} ·{" "}
                          <Text style={styles.caseDisease}>
                            {c.diagnosisSnapshot?.disease || "Unknown disease"}
                          </Text>
                        </Text>
                        <Text style={styles.caseDate}>
                          {new Date(c.createdAt).toLocaleDateString("en-NG", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </Text>
                      </View>
                      <View style={[styles.caseStatusBadge, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                        <Text style={[styles.caseStatusText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>

                    <View style={styles.caseParties}>
                      <View style={styles.caseParty}>
                        <Ionicons name="person-outline" size={12} color={COLORS.textLight} />
                        <Text style={styles.casePartyText}>{c.farmer?.name || "—"}</Text>
                      </View>
                      <Ionicons name="arrow-forward-outline" size={12} color={COLORS.border} />
                      <View style={styles.caseParty}>
                        <Ionicons name="school-outline" size={12} color={COLORS.primary} />
                        <Text style={[styles.casePartyText, { color: COLORS.primary }]}>
                          {c.expert?.name || "—"}
                        </Text>
                      </View>
                    </View>

                    {c.diagnosisSnapshot?.severity && (
                      <Text style={styles.caseSeverity}>
                        Severity: {c.diagnosisSnapshot.severity}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      <CaseDetailModal
        visible={detailVisible}
        caseId={selectedCaseId}
        onClose={() => setDetailVisible(false)}
        onUpdate={fetchCases}
      />
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

  tabScroll: { flexGrow: 0, marginTop: 10 },
  tabScrollContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 8, alignItems: "center" },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 14,
    backgroundColor: COLORS.white, alignSelf: "flex-start",
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, color: COLORS.textDark, fontWeight: "600" },
  tabTextActive: { color: COLORS.white },
  tabBadge: { backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabBadgeText: { fontSize: 10, fontWeight: "700", color: COLORS.textDark },
  tabBadgeTextActive: { color: COLORS.white },

  countBar: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  countText: { fontSize: 12, color: COLORS.textLight, fontWeight: "500" },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, paddingBottom: 40 },

  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textDark, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },

  caseCard: {
    flexDirection: "row", backgroundColor: COLORS.white, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 10, overflow: "hidden",
  },
  caseStatusStrip: { width: 4 },
  caseCardContent: { flex: 1, padding: 14 },
  caseCardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  caseCrop: { fontSize: 13, fontWeight: "600", color: COLORS.textDark },
  caseDisease: { color: COLORS.error, fontWeight: "700" },
  caseDate: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  caseStatusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  caseStatusText: { fontSize: 10, fontWeight: "700" },
  caseParties: { flexDirection: "row", alignItems: "center", gap: 8 },
  caseParty: { flexDirection: "row", alignItems: "center", gap: 4 },
  casePartyText: { fontSize: 11, color: COLORS.textLight, fontWeight: "500" },
  caseSeverity: { fontSize: 11, color: COLORS.textLight, marginTop: 6, textTransform: "capitalize" },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  statusBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  statusText: { fontSize: 13, fontWeight: "700", flex: 1 },
  statusDate: { fontSize: 11, color: COLORS.textLight },

  section: {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: "700", color: COLORS.textLight,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 5,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: 12, color: COLORS.textLight },
  infoValue: { fontSize: 13, fontWeight: "600", color: COLORS.textDark, textTransform: "capitalize" },

  noteBox: {
    backgroundColor: COLORS.background, borderRadius: 8,
    padding: 10, marginTop: 8,
  },
  noteLabel: { fontSize: 10, color: COLORS.textLight, marginBottom: 4, fontWeight: "600" },
  noteText: { fontSize: 13, color: COLORS.textDark, lineHeight: 18 },

  responseBox: {
    backgroundColor: COLORS.primaryLight, borderRadius: 8, padding: 12,
  },
  responseText: { fontSize: 13, color: COLORS.textDark, lineHeight: 18 },
  responseDate: { fontSize: 11, color: COLORS.textLight, marginTop: 6 },

  starsRow: { flexDirection: "row", gap: 2 },

  noteInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    backgroundColor: COLORS.background, padding: 12,
    fontSize: 14, color: COLORS.textDark,
    minHeight: 80, textAlignVertical: "top", marginBottom: 12,
  },
  confirmRow: { flexDirection: "row", gap: 10 },
  cancelActionBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingVertical: 11, alignItems: "center",
  },
  cancelActionText: { fontSize: 13, fontWeight: "600", color: COLORS.textDark },
  confirmActionBtn: {
    flex: 2, backgroundColor: COLORS.primary,
    borderRadius: 10, paddingVertical: 11, alignItems: "center",
  },
  confirmActionBtnDanger: { backgroundColor: COLORS.error },
  confirmActionText: { fontSize: 13, fontWeight: "700", color: COLORS.white },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  resolveBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12,
  },
  resolveBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  declineBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderWidth: 1, borderColor: COLORS.error,
    borderRadius: 10, paddingVertical: 12,
  },
  declineBtnText: { color: COLORS.error, fontWeight: "700", fontSize: 13 },
});

export default AdminCasesScreen;