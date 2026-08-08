import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getCaseDetail } from "@/src/api/expertChat.api";
import { useAlert } from '@/src/context/AlertContext';
import { useLanguage } from '@/src/context/LanguageContext';
import client from "@/src/api/client";

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
  pending:     { label: "Awaiting expert response", color: COLORS.amber,   bg: COLORS.amberLight,   icon: "time-outline"             },
  accepted:    { label: "Expert is reviewing",      color: COLORS.blue,    bg: COLORS.blueLight,    icon: "eye-outline"              },
  in_progress: { label: "In progress",              color: COLORS.primary, bg: COLORS.primaryLight, icon: "refresh-outline"          },
  resolved:    { label: "Resolved",                 color: COLORS.primary, bg: COLORS.primaryLight, icon: "checkmark-circle-outline" },
  declined:    { label: "Declined",                 color: COLORS.error,   bg: COLORS.errorLight,   icon: "close-circle-outline"     },
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  low:      { color: COLORS.primary, bg: COLORS.primaryLight },
  moderate: { color: COLORS.amber,   bg: COLORS.amberLight   },
  high:     { color: COLORS.error,   bg: COLORS.errorLight   },
  severe:   { color: COLORS.error,   bg: COLORS.errorLight   },
};

// ─── Rating Modal ─────────────────────────────────────────────────────────────

const RatingModal = ({
  visible, onClose, onSubmit, loading,
}: {
  visible: boolean; onClose: () => void;
  onSubmit: (stars: number, helpful: boolean) => void;
  loading: boolean;
}) => {
  const [stars, setStars]     = useState(0);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const scaleAnim             = React.useRef(new Animated.Value(0.88)).current;
  const opacityAnim           = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStars(0);
      setHelpful(null);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleSubmit = () => {
    if (stars === 0) {
      showAlert({
        title: isHausa ? 'Zabi Adadi' : 'Please select a rating',
        message: isHausa ? 'Danna tauraro don bayar da adadin gamsuwa da wannan shawara.' : 'Tap a star to rate this consultation.',
        buttons: [{ text: isHausa ? 'Yarda' : 'OK' }]
      });
      return;
    }
    if (helpful === null) {
      showAlert({
        title: isHausa ? 'Taimako' : 'Was it helpful?',
        message: isHausa ? 'Da fatan za a zabi "E" ko "A\'a".' : 'Please select Yes or No.',
        buttons: [{ text: isHausa ? 'Yarda' : 'OK' }]
      });
      return;
    }
    onSubmit(stars, helpful);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[ratingModal.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[ratingModal.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Icon */}
          <View style={ratingModal.iconWrap}>
            <Ionicons name="star" size={32} color={COLORS.amber} />
          </View>

          <Text style={ratingModal.title}>Rate this consultation</Text>
          <Text style={ratingModal.subtitle}>
            Your feedback helps improve expert quality on NomaApp.
          </Text>

          {/* Star selector */}
          <View style={ratingModal.starsRow}>
            {[1, 2, 3, 4, 5].map(s => (
              <TouchableOpacity key={s} onPress={() => setStars(s)} activeOpacity={0.7}>
                <Ionicons
                  name={s <= stars ? "star" : "star-outline"}
                  size={36}
                  color={s <= stars ? COLORS.amber : COLORS.border}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Helpful */}
          <Text style={ratingModal.helpfulLabel}>Was this advice helpful?</Text>
          <View style={ratingModal.helpfulRow}>
            <TouchableOpacity
              style={[ratingModal.helpfulBtn, helpful === true && ratingModal.helpfulBtnActive]}
              onPress={() => setHelpful(true)}
            >
              <Ionicons
                name="thumbs-up-outline"
                size={18}
                color={helpful === true ? COLORS.white : COLORS.textLight}
              />
              <Text style={[ratingModal.helpfulBtnText, helpful === true && { color: COLORS.white }]}>
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ratingModal.helpfulBtn, helpful === false && ratingModal.helpfulBtnNo]}
              onPress={() => setHelpful(false)}
            >
              <Ionicons
                name="thumbs-down-outline"
                size={18}
                color={helpful === false ? COLORS.white : COLORS.textLight}
              />
              <Text style={[ratingModal.helpfulBtnText, helpful === false && { color: COLORS.white }]}>
                No
              </Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={ratingModal.actions}>
            <TouchableOpacity style={ratingModal.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={ratingModal.cancelBtnText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ratingModal.submitBtn, loading && { opacity: 0.65 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Text style={ratingModal.submitBtnText}>Submit Rating</Text>
              }
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const FarmerCaseDetailScreen = () => {
  const router  = useRouter();
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { showAlert } = useAlert();
  const { language } = useLanguage();
  const isHausa = language === 'hausa';

  const [caseData, setCaseData]     = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  const fetchCase = async () => {
    try {
      const res = await getCaseDetail(caseId);
      setCaseData(res.data.case);
    } catch (err) {
      console.error("Failed to fetch case:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (caseId) fetchCase(); }, [caseId]);

  const handleRatingSubmit = async (stars: number, helpful: boolean) => {
    setRatingLoading(true);
    try {
      await client.post(`/experts/cases/${caseId}/rate`, { stars, helpful });
      setRatingVisible(false);
      await fetchCase(); // refresh to show new rating
      showAlert({
        title: isHausa ? 'Godiya' : 'Thank you!',
        message: isHausa ? 'An aika da ra\'ayoyin ku.' : 'Your rating has been submitted.',
        buttons: [{ text: isHausa ? 'Yarda' : 'OK' }]
      });
    } catch (err: any) {
      showAlert({
        title: isHausa ? 'Kuskure' : 'Error',
        message: isHausa
          ? 'An kasa aika ra\'ayin. Da fatan a sake gwadawa.'
          : (err.response?.data?.error?.message || "Failed to submit rating."),
        buttons: [{ text: isHausa ? 'Yarda' : 'OK' }]
      });
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!caseData) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={40} color={COLORS.error} />
        <Text style={styles.notFoundText}>Case not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const snap       = caseData.diagnosisSnapshot || {};
  const statusCfg  = STATUS_CONFIG[caseData.status] || STATUS_CONFIG.pending;
  const severityCfg = SEVERITY_CONFIG[snap.severity] || SEVERITY_CONFIG.moderate;
  const isResolved  = caseData.status === "resolved";
  const isPending   = caseData.status === "pending";
  const hasResponse = !!caseData.expertResponse?.message;
  const hasRating   = !!caseData.rating;
  const canRate     = isResolved && hasResponse && !hasRating;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Case Detail</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusCfg.bg }]}>
          <Ionicons name={statusCfg.icon as any} size={18} color={statusCfg.color} />
          <Text style={[styles.statusBannerText, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
          <Text style={styles.statusDate}>
            {new Date(caseData.createdAt).toLocaleDateString("en-NG", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </Text>
        </View>

        {/* Pending waiting note */}
        {isPending && (
          <View style={styles.waitingNote}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.waitingNoteText}>
              The expert has been notified and will respond within 24 hours.
              You'll get a push notification when they reply.
            </Text>
          </View>
        )}

        {/* Low confidence flag */}
        {snap.isLowConfidence && (
          <View style={styles.lowConfBanner}>
            <Ionicons name="alert-circle" size={16} color="#7c4a00" />
            <Text style={styles.lowConfText}>
              This was a low-confidence AI diagnosis. The expert was briefed to
              provide a more accurate assessment.
            </Text>
          </View>
        )}

        {/* Diagnosis snapshot */}
        <Text style={styles.sectionTitle}>Diagnosis</Text>
        <View style={styles.diagnosisCard}>
          <View style={styles.diagnosisHeader}>
            <View style={styles.bugCircle}>
              <Ionicons name="bug-outline" size={18} color={COLORS.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cropLabel}>
                {snap.cropType?.toUpperCase() || "—"}
              </Text>
              <Text style={styles.diseaseName}>
                {snap.disease?.replace(/_/g, " ") || "Unknown disease"}
              </Text>
            </View>
          </View>
          <View style={styles.diagnosisMeta}>
            <View style={[styles.severityPill, { backgroundColor: severityCfg.bg }]}>
              <Ionicons name="warning-outline" size={12} color={severityCfg.color} />
              <Text style={[styles.severityText, { color: severityCfg.color }]}>
                {snap.severity || "—"} severity
              </Text>
            </View>
            {snap.confidence && (
              <View style={styles.confidencePill}>
                <Text style={styles.confidenceText}>
                  {Math.round(snap.confidence * 100)}% confidence
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Expert assigned */}
        <Text style={styles.sectionTitle}>Assigned Expert</Text>
        <View style={styles.expertCard}>
          <View style={styles.expertAvatar}>
            <Text style={styles.expertAvatarText}>
              {(caseData.expert?.name || "E")
                .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.expertName}>{caseData.expert?.name || "—"}</Text>
          </View>
          <View style={styles.expertVerifiedBadge}>
            <Ionicons name="shield-checkmark" size={12} color={COLORS.primary} />
            <Text style={styles.expertVerifiedText}>Verified</Text>
          </View>
        </View>

        {/* Farmer's note */}
        {caseData.farmerNote && (
          <>
            <Text style={styles.sectionTitle}>Your Note</Text>
            <View style={styles.noteCard}>
              <Ionicons name="chatbubble-outline" size={15} color={COLORS.textLight} style={{ marginRight: 8 }} />
              <Text style={styles.noteText}>{caseData.farmerNote}</Text>
            </View>
          </>
        )}

        {/* Expert response */}
        <Text style={styles.sectionTitle}>Expert Response</Text>
        {hasResponse ? (
          <View style={styles.responseCard}>
            <View style={styles.responseHeader}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              <Text style={styles.responseHeaderText}>
                {caseData.expert?.name || "Expert"} responded
              </Text>
              {caseData.expertResponse?.respondedAt && (
                <Text style={styles.responseDate}>
                  {new Date(caseData.expertResponse.respondedAt).toLocaleDateString("en-NG", {
                    day: "numeric", month: "short",
                  })}
                </Text>
              )}
            </View>
            <Text style={styles.responseText}>{caseData.expertResponse.message}</Text>
          </View>
        ) : (
          <View style={styles.noResponseCard}>
            <Ionicons name="hourglass-outline" size={20} color={COLORS.textLight} />
            <Text style={styles.noResponseText}>
              {isPending
                ? "Waiting for expert to respond..."
                : "No response provided for this case."}
            </Text>
          </View>
        )}

        {/* Rating section */}
        {isResolved && (
          <>
            <Text style={styles.sectionTitle}>Your Rating</Text>
            {hasRating ? (
              <View style={styles.ratingCard}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Ionicons
                      key={s}
                      name={s <= caseData.rating.stars ? "star" : "star-outline"}
                      size={22}
                      color={COLORS.amber}
                    />
                  ))}
                </View>
                <View style={styles.helpfulRow}>
                  <Ionicons
                    name={caseData.rating.helpful ? "thumbs-up" : "thumbs-down"}
                    size={14}
                    color={caseData.rating.helpful ? COLORS.primary : COLORS.error}
                  />
                  <Text style={styles.helpfulText}>
                    {caseData.rating.helpful ? "You found this helpful" : "You found this unhelpful"}
                  </Text>
                </View>
              </View>
            ) : canRate ? (
              <TouchableOpacity
                style={styles.rateBtn}
                onPress={() => setRatingVisible(true)}
              >
                <Ionicons name="star-outline" size={18} color={COLORS.white} />
                <Text style={styles.rateBtnText}>Rate this consultation</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Rating modal */}
      <RatingModal
        visible={ratingVisible}
        onClose={() => setRatingVisible(false)}
        onSubmit={handleRatingSubmit}
        loading={ratingLoading}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText:     { fontSize: 15, fontWeight: "600", color: COLORS.textDark },
  backLink:         { marginTop: 8 },
  backLinkText:     { fontSize: 14, color: COLORS.primary, fontWeight: "600" },

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
  content:  { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48 },

  // Status banner
  statusBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, padding: 14, marginBottom: 14,
  },
  statusBannerText: { flex: 1, fontSize: 14, fontWeight: "700" },
  statusDate:       { fontSize: 11, color: COLORS.textLight },

  waitingNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.border, padding: 12, marginBottom: 14,
  },
  waitingNoteText: { flex: 1, fontSize: 12, color: COLORS.textLight, lineHeight: 17 },

  lowConfBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#fff8e1", borderWidth: 1, borderColor: COLORS.amberBorder,
    borderRadius: 10, padding: 12, marginBottom: 14,
  },
  lowConfText: { flex: 1, fontSize: 12, color: "#92400e", lineHeight: 17 },

  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textDark, marginBottom: 10, marginTop: 8 },

  // Diagnosis card
  diagnosisCard: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 16,
  },
  diagnosisHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  bugCircle: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.errorLight,
    alignItems: "center", justifyContent: "center",
  },
  cropLabel:   { fontSize: 10, color: COLORS.textLight, fontWeight: "700", letterSpacing: 0.4, marginBottom: 3 },
  diseaseName: { fontSize: 17, fontWeight: "700", color: COLORS.textDark, textTransform: "capitalize" },
  diagnosisMeta: { flexDirection: "row", gap: 8 },
  severityPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10,
  },
  severityText:  { fontSize: 11, fontWeight: "600" },
  confidencePill:{ backgroundColor: COLORS.background, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  confidenceText:{ fontSize: 11, color: COLORS.textLight, fontWeight: "500" },

  // Expert card
  expertCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 16,
  },
  expertAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  expertAvatarText:    { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  expertName:          { fontSize: 14, fontWeight: "700", color: COLORS.textDark },
  expertPhone:         { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  expertVerifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.primaryLight, borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 10,
  },
  expertVerifiedText: { fontSize: 11, fontWeight: "600", color: COLORS.primary },

  // Note card
  noteCard: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 16,
  },
  noteText: { flex: 1, fontSize: 13, color: COLORS.textDark, lineHeight: 19 },

  // Response card
  responseCard: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.primaryBorder, padding: 14, marginBottom: 16,
  },
  responseHeader: {
    flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10,
  },
  responseHeaderText: { flex: 1, fontSize: 13, fontWeight: "700", color: COLORS.primary },
  responseDate:       { fontSize: 11, color: COLORS.textLight },
  responseText:       { fontSize: 14, color: COLORS.textDark, lineHeight: 22 },

  noResponseCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 16, marginBottom: 16, justifyContent: "center",
  },
  noResponseText: { fontSize: 13, color: COLORS.textLight },

  // Rating
  ratingCard: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 16, marginBottom: 16, alignItems: "center",
  },
  starsRow:   { flexDirection: "row", gap: 6, marginBottom: 10 },
  helpfulRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  helpfulText:{ fontSize: 13, color: COLORS.textLight },

  rateBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: COLORS.amber, borderRadius: 12, paddingVertical: 14,
    shadowColor: COLORS.amber, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, marginBottom: 16,
  },
  rateBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
});

const ratingModal = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 24,
  },
  card: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 24,
    width: "100%", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 10,
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.amberLight, alignItems: "center",
    justifyContent: "center", marginBottom: 16,
  },
  title:    { fontSize: 18, fontWeight: "700", color: COLORS.textDark, marginBottom: 6 },
  subtitle: { fontSize: 13, color: COLORS.textLight, textAlign: "center", lineHeight: 18, marginBottom: 20 },
  starsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  helpfulLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textDark, marginBottom: 10 },
  helpfulRow:   { flexDirection: "row", gap: 10, marginBottom: 24 },
  helpfulBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 11,
  },
  helpfulBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  helpfulBtnNo:     { backgroundColor: COLORS.error,   borderColor: COLORS.error   },
  helpfulBtnText:   { fontSize: 14, fontWeight: "600", color: COLORS.textLight },
  actions:    { flexDirection: "row", gap: 10, width: "100%" },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingVertical: 12, alignItems: "center",
  },
  cancelBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.textLight },
  submitBtn: {
    flex: 2, backgroundColor: COLORS.amber,
    borderRadius: 10, paddingVertical: 12, alignItems: "center",
  },
  submitBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.white },
});

export default FarmerCaseDetailScreen;