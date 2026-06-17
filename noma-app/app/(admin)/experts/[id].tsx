import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image, TextInput, Modal, Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { adminGetExpertDetail, adminReviewExpert } from "@/src/api/admin.api";
import { useApiCall } from "@/src/hooks/useApiCall";
import ErrorState from "@/app/components/ErrorState";

const COLORS = {
  primary: "#16A34A", primaryLight: "#f0fdf4", primaryBorder: "#bbf7d0",
  background: "#f8f8f8", white: "#ffffff", textDark: "#1f2937",
  textLight: "#6b7280", border: "#e5e7eb", error: "#dc2626",
  errorLight: "#fef2f2", amber: "#d97706", amberLight: "#fffbeb",
  blue: "#2563eb", blueLight: "#eff6ff",
};

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

const DOC_TYPE_LABELS: Record<string, string> = {
  NIN: "National Identification Number (NIN)",
  NationalID: "National ID Card",
  DriversLicense: "Driver's License",
  Passport: "International Passport",
  VotersCard: "Voter's Card",
  Degree: "Agricultural Degree Certificate",
  AgronomyCert: "Agronomy Certificate",
  PlantPathologyCert: "Plant Pathology Certificate",
  AppointmentLetter: "Extension Officer Appointment Letter",
  MembershipCert: "Agricultural Body Membership Certificate",
  EmploymentLetter: "Employment Letter",
};

const DOC_STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  pending:  { color: COLORS.amber,   bg: COLORS.amberLight,   icon: "time-outline"        },
  approved: { color: COLORS.primary, bg: COLORS.primaryLight, icon: "checkmark-circle"     },
  rejected: { color: COLORS.error,   bg: COLORS.errorLight,   icon: "close-circle"         },
};

// ─── Document Card ────────────────────────────────────────────────────────────

const DocumentCard = ({
  title, doc,
}: { title: string; doc: any }) => {
  const isPdf = doc?.cloudinaryUrl?.toLowerCase().endsWith(".pdf");
  const cfg = DOC_STATUS_CONFIG[doc?.status] || DOC_STATUS_CONFIG.pending;

  const openDocument = () => {
    if (doc?.cloudinaryUrl) Linking.openURL(doc.cloudinaryUrl);
  };

  return (
    <View style={styles.docCard}>
      <View style={styles.docCardHeader}>
        <Text style={styles.docCardTitle}>{title}</Text>
        <View style={[styles.docStatusBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
          <Text style={[styles.docStatusText, { color: cfg.color }]}>
            {doc?.status || "pending"}
          </Text>
        </View>
      </View>

      <Text style={styles.docTypeLabel}>
        {DOC_TYPE_LABELS[doc?.type] || doc?.type || "—"}
      </Text>

      {doc?.cloudinaryUrl ? (
        <TouchableOpacity style={styles.docPreview} onPress={openDocument} activeOpacity={0.8}>
          {isPdf ? (
            <View style={styles.pdfPreview}>
              <Ionicons name="document-text" size={32} color={COLORS.error} />
              <Text style={styles.pdfPreviewText}>PDF Document</Text>
            </View>
          ) : (
            <Image source={{ uri: doc.cloudinaryUrl }} style={styles.docImage} resizeMode="cover" />
          )}
          <View style={styles.docPreviewOverlay}>
            <Ionicons name="expand-outline" size={16} color={COLORS.white} />
            <Text style={styles.docPreviewOverlayText}>Tap to view full size</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.docMissing}>
          <Ionicons name="alert-circle-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.docMissingText}>No document uploaded</Text>
        </View>
      )}
    </View>
  );
};

// ─── Rejection Reason Modal ────────────────────────────────────────────────────

const RejectModal = ({
  visible, onClose, onConfirm, loading,
}: {
  visible: boolean; onClose: () => void;
  onConfirm: (reason: string, notes: string) => void; loading: boolean;
}) => {
  const [reason, setReason] = useState("");
  const [notes, setNotes]   = useState("");
  const [error, setError]   = useState("");

  const QUICK_REASONS = [
    "Document image is blurry or unreadable",
    "Document does not match the stated ID type",
    "Professional credential could not be verified",
    "Document appears to be expired",
    "Information on document doesn't match profile details",
  ];

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }
    onConfirm(reason.trim(), notes.trim());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <Text style={modal.title}>Reject Documents</Text>
          <Text style={modal.subtitle}>
            This reason will be shown to the expert. Be clear and constructive.
          </Text>

          <Text style={modal.label}>Quick reasons</Text>
          <View style={modal.quickReasons}>
            {QUICK_REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[modal.quickChip, reason === r && modal.quickChipActive]}
                onPress={() => { setReason(r); setError(""); }}
              >
                <Text style={[modal.quickChipText, reason === r && modal.quickChipTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={modal.label}>Rejection reason <Text style={{ color: COLORS.error }}>*</Text></Text>
          <TextInput
            style={[modal.input, error && { borderColor: COLORS.error }]}
            placeholder="Explain why these documents are being rejected..."
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={3}
            value={reason}
            onChangeText={(v) => { setReason(v); setError(""); }}
          />
          {error ? <Text style={modal.errorText}>{error}</Text> : null}

          <Text style={modal.label}>Internal notes <Text style={modal.optional}>(not shown to expert)</Text></Text>
          <TextInput
            style={modal.input}
            placeholder="Any internal notes for the admin team..."
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={2}
            value={notes}
            onChangeText={setNotes}
          />

          <View style={modal.actions}>
            <TouchableOpacity style={modal.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={modal.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modal.rejectBtn, loading && { opacity: 0.65 }]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Text style={modal.rejectBtnText}>Confirm Rejection</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const AdminExpertDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, loading, error, retry } = useApiCall(
    () => adminGetExpertDetail(id),
    [id]
  );

  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const profile = data?.profile;

  const handleApprove = () => {
    Alert.alert(
      "Approve Documents",
      `Confirm that ${profile?.user?.name}'s documents are valid? They'll unlock the competency assessment immediately.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            setApproveLoading(true);
            try {
              await adminReviewExpert(id, { action: "approve" });
              Alert.alert("Approved", `${profile?.user?.name} can now take the assessment.`, [
                { text: "OK", onPress: () => retry() },
              ]);
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.error?.message || "Failed to approve");
            } finally {
              setApproveLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (reason: string, notes: string) => {
    setRejectLoading(true);
    try {
      await adminReviewExpert(id, { action: "reject", rejectionReason: reason, notes });
      setRejectModalVisible(false);
      Alert.alert("Rejected", "The expert has been notified.", [
        { text: "OK", onPress: () => retry() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error?.message || "Failed to reject");
    } finally {
      setRejectLoading(false);
    }
  };

  const getInitials = (name: string) =>
    (name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Expert Review</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : !profile ? (
        <ErrorState
          title="Expert not found"
          message="This profile may have been removed."
          icon="person-remove-outline"
          onRetry={retry}
        />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Identity header */}
            <View style={styles.identityCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(profile.user?.name)}</Text>
              </View>
              <Text style={styles.name}>{profile.user?.name || "Unknown"}</Text>
              <Text style={styles.phone}>{profile.user?.phone}</Text>
              {profile.user?.email && <Text style={styles.phone}>{profile.user.email}</Text>}

              <View style={[
                styles.statusBadge,
                { backgroundColor: STATUS_CONFIG[profile.overallStatus]?.bg || COLORS.background }
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  { color: STATUS_CONFIG[profile.overallStatus]?.color || COLORS.textLight }
                ]}>
                  {STATUS_CONFIG[profile.overallStatus]?.label || profile.overallStatus}
                </Text>
              </View>

              <Text style={styles.joinedDate}>
                Joined {profile.user?.createdAt
                  ? new Date(profile.user.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                  : "—"}
              </Text>
            </View>

            {/* Rejection notice if previously rejected */}
            {profile.overallStatus === "rejected" && profile.rejectionReason && (
              <View style={styles.rejectionNotice}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rejectionTitle}>Previously rejected</Text>
                  <Text style={styles.rejectionText}>{profile.rejectionReason}</Text>
                </View>
              </View>
            )}

            {/* Already reviewed notice */}
            {profile.adminReviewedBy && (
              <View style={styles.reviewedNotice}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.textLight} />
                <Text style={styles.reviewedText}>
                  Last reviewed by {profile.adminReviewedBy?.name || "an admin"}
                  {profile.reviewedAt && ` on ${new Date(profile.reviewedAt).toLocaleDateString()}`}
                </Text>
              </View>
            )}

            {/* Professional Profile */}
            <Text style={styles.sectionTitle}>Professional Profile</Text>
            <View style={styles.section}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>
                  {ROLE_LABELS[profile.currentRole] || profile.currentRole || "—"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Organization</Text>
                <Text style={styles.infoValue}>{profile.currentOrganization || "—"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Experience</Text>
                <Text style={styles.infoValue}>
                  {profile.yearsOfExperience != null ? `${profile.yearsOfExperience} years` : "—"}
                </Text>
              </View>
              {profile.linkedIn && (
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => Linking.openURL(profile.linkedIn)}
                >
                  <Text style={styles.infoLabel}>LinkedIn</Text>
                  <Text style={[styles.infoValue, { color: COLORS.blue }]} numberOfLines={1}>
                    View Profile →
                  </Text>
                </TouchableOpacity>
              )}

              {profile.specializations?.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.infoLabel}>Specializations</Text>
                  <View style={styles.chipRow}>
                    {profile.specializations.map((s: string) => (
                      <View key={s} style={styles.chip}>
                        <Text style={styles.chipText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {profile.bio && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.infoLabel}>Bio</Text>
                  <Text style={styles.bioText}>{profile.bio}</Text>
                </View>
              )}
            </View>

            {/* Documents */}
            <Text style={styles.sectionTitle}>Submitted Documents</Text>
            <DocumentCard title="Government ID" doc={profile.governmentId} />
            <DocumentCard title="Professional Credential" doc={profile.professionalDoc} />

            {/* Assessment (if completed) */}
            {profile.assessment?.completedAt && (
              <>
                <Text style={styles.sectionTitle}>Assessment Result</Text>
                <View style={styles.section}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Score</Text>
                    <Text style={[
                      styles.infoValue,
                      { color: profile.assessment.passed ? COLORS.primary : COLORS.error }
                    ]}>
                      {profile.assessment.score}%
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Result</Text>
                    <Text style={styles.infoValue}>
                      {profile.assessment.passed ? "Passed ✓" : "Failed"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Attempts used</Text>
                    <Text style={styles.infoValue}>{profile.assessment.attemptCount}/3</Text>
                  </View>
                </View>
              </>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Sticky action bar — only when pending review */}
          {profile.overallStatus === "pending_review" && (
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={styles.rejectActionBtn}
                onPress={() => setRejectModalVisible(true)}
                disabled={approveLoading}
              >
                <Ionicons name="close" size={18} color={COLORS.error} />
                <Text style={styles.rejectActionText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approveActionBtn, approveLoading && { opacity: 0.65 }]}
                onPress={handleApprove}
                disabled={approveLoading}
              >
                {approveLoading
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : (
                    <>
                      <Ionicons name="checkmark" size={18} color={COLORS.white} />
                      <Text style={styles.approveActionText}>Approve</Text>
                    </>
                  )
                }
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <RejectModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        onConfirm={handleReject}
        loading={rejectLoading}
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
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 20 },

  identityCard: {
    backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.border, padding: 20, alignItems: "center", marginBottom: 16,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  avatarText: { color: COLORS.white, fontSize: 22, fontWeight: "700" },
  name: { fontSize: 17, fontWeight: "700", color: COLORS.textDark },
  phone: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14, marginTop: 10 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  joinedDate: { fontSize: 11, color: COLORS.textLight, marginTop: 8 },

  rejectionNotice: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: COLORS.errorLight, borderWidth: 1, borderColor: "#fecaca",
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  rejectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.error },
  rejectionText: { fontSize: 12, color: COLORS.error, marginTop: 3, lineHeight: 17 },

  reviewedNotice: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.white, borderRadius: 8, padding: 10, marginBottom: 16,
  },
  reviewedText: { fontSize: 11, color: COLORS.textLight, flex: 1 },

  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textDark, marginBottom: 10, marginTop: 4 },
  section: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: 12, color: COLORS.textLight },
  infoValue: { fontSize: 13, fontWeight: "600", color: COLORS.textDark, flexShrink: 1, textAlign: "right" },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  chip: { backgroundColor: COLORS.primaryLight, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  chipText: { fontSize: 11, color: COLORS.primary, fontWeight: "600", textTransform: "capitalize" },
  bioText: { fontSize: 13, color: COLORS.textDark, lineHeight: 19, marginTop: 4 },

  // Document cards
  docCard: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 12,
  },
  docCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  docCardTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  docStatusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  docStatusText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  docTypeLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 10 },
  docPreview: { borderRadius: 10, overflow: "hidden", position: "relative" },
  docImage: { width: "100%", height: 180, backgroundColor: COLORS.background },
  pdfPreview: {
    height: 180, backgroundColor: COLORS.errorLight,
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  pdfPreviewText: { fontSize: 12, color: COLORS.error, fontWeight: "600" },
  docPreviewOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.55)", flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8,
  },
  docPreviewOverlayText: { fontSize: 11, color: COLORS.white, fontWeight: "600" },
  docMissing: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.background, borderRadius: 8, padding: 12,
  },
  docMissingText: { fontSize: 12, color: COLORS.textLight },

  // Sticky action bar
  actionBar: {
    flexDirection: "row", gap: 10, padding: 16,
    backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border,
    position: "absolute", bottom: 0, left: 0, right: 0,
  },
  rejectActionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderWidth: 1.5, borderColor: COLORS.error,
    borderRadius: 12, paddingVertical: 13,
  },
  rejectActionText: { color: COLORS.error, fontWeight: "700", fontSize: 14 },
  approveActionBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 13,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  approveActionText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, maxHeight: "85%",
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.textDark, marginBottom: 4 },
  subtitle: { fontSize: 12, color: COLORS.textLight, marginBottom: 16, lineHeight: 17 },
  label: { fontSize: 12, fontWeight: "600", color: COLORS.textDark, marginBottom: 8, marginTop: 4 },
  optional: { color: COLORS.textLight, fontWeight: "400" },
  quickReasons: { gap: 8, marginBottom: 8 },
  quickChip: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 12, backgroundColor: COLORS.background,
  },
  quickChipActive: { backgroundColor: COLORS.errorLight, borderColor: "#fecaca" },
  quickChipText: { fontSize: 12, color: COLORS.textDark },
  quickChipTextActive: { color: COLORS.error, fontWeight: "600" },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    backgroundColor: COLORS.background, padding: 12,
    fontSize: 13, color: COLORS.textDark, minHeight: 70, textAlignVertical: "top", marginBottom: 4,
  },
  errorText: { fontSize: 11, color: COLORS.error, marginBottom: 8 },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingVertical: 12, alignItems: "center",
  },
  cancelBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.textDark },
  rejectBtn: {
    flex: 2, backgroundColor: COLORS.error,
    borderRadius: 10, paddingVertical: 12, alignItems: "center",
  },
  rejectBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.white },
});

export default AdminExpertDetailScreen;