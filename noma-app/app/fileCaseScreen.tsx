import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Image, TextInput, Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createCase } from "@/src/api/expertChat.api";
import { getScanById } from "@/src/api/scan.api"; // assumes this exists for fetching scan detail

const COLORS = {
  primary: "#16A34A", primaryLight: "#f0fdf4", primaryBorder: "#bbf7d0",
  background: "#f8f8f8", white: "#ffffff", textDark: "#1f2937",
  textLight: "#6b7280", border: "#e5e7eb", error: "#dc2626",
  errorLight: "#fef2f2", amber: "#d97706", amberLight: "#fffbeb",
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  low:      { color: COLORS.primary, bg: COLORS.primaryLight },
  moderate: { color: COLORS.amber,   bg: COLORS.amberLight   },
  high:     { color: COLORS.error,   bg: COLORS.errorLight   },
  severe:   { color: COLORS.error,   bg: COLORS.errorLight   },
};

const FileCaseScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const expertUserId = params.expertUserId as string;
  const expertName   = params.expertName as string;
  const scanId       = params.scanId as string;

  const [scan, setScan]       = useState<any>(null);
  const [note, setNote]       = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [sessionsRemaining, setSessionsRemaining] = useState<string | number>("");

  useEffect(() => {
    const fetchScan = async () => {
      if (!scanId) {
        setLoading(false);
        return;
      }
      try {
        const res = await getScanById(scanId);
        setScan(res.data.scan);
      } catch (err) {
        console.error("Failed to fetch scan:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchScan();
  }, [scanId]);

  const handleSubmit = async () => {
    if (!scanId) {
      Alert.alert("No diagnosis selected", "Please select a diagnosis to attach to this case.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createCase({
        expertUserId,
        scanId,
        farmerNote: note.trim() || undefined,
      });
      setSessionsRemaining(res.data.sessionsRemaining);
      setSubmitted(true);
    } catch (err: any) {
      const errCode = err.response?.data?.error?.code;
      if (errCode === "FEATURE_LOCKED") {
        Alert.alert(
          "Upgrade required",
          "Expert consultations require Basic or Premium plan.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "View Plans", onPress: () => router.push("/(onboarding)/plans") },
          ]
        );
      } else if (errCode === "SESSION_LIMIT_REACHED") {
        Alert.alert(
          "Session limit reached",
          err.response?.data?.error?.message || "Upgrade to Premium for unlimited sessions.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Upgrade", onPress: () => router.push("/(onboarding)/plans") },
          ]
        );
      } else {
        Alert.alert("Error", err.response?.data?.error?.message || "Failed to submit case.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Confirmation Screen ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.confirmContent}>
          <View style={styles.confirmIcon}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.confirmTitle}>Case submitted!</Text>
          <Text style={styles.confirmDesc}>
            Your diagnosis has been sent to <Text style={{ fontWeight: "700" }}>{expertName}</Text>.
            You'll be notified when they respond — usually within 24 hours.
          </Text>

          {typeof sessionsRemaining === "number" && (
            <View style={styles.sessionInfo}>
              <Ionicons name="chatbubbles-outline" size={14} color={COLORS.primary} />
              <Text style={styles.sessionInfoText}>
                {sessionsRemaining} expert session{sessionsRemaining !== 1 ? "s" : ""} remaining this month
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/(farmer)/cases" as any)}
          >
            <Text style={styles.primaryBtnText}>View My Cases</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push("/(tabs)" as any)}
          >
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Main Form ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Review & Send</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sending to */}
        <View style={styles.toCard}>
          <View style={styles.toAvatar}>
            <Text style={styles.toAvatarText}>
              {(expertName || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toLabel}>Sending diagnosis to</Text>
            <Text style={styles.toName}>{expertName}</Text>
          </View>
        </View>

        {/* Diagnosis preview */}
        <Text style={styles.sectionTitle}>Attached Diagnosis</Text>
        {loading ? (
          <View style={styles.scanLoading}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : scan ? (
          <View style={styles.scanCard}>
            {scan.imageUrl && (
              <Image source={{ uri: scan.imageUrl }} style={styles.scanImage} />
            )}
            <View style={styles.scanInfo}>
              <View style={styles.scanRow}>
                <Text style={styles.scanCrop}>{scan.cropType}</Text>
                {scan.diagnosis?.severity && (
                  <View style={[
                    styles.severityBadge,
                    { backgroundColor: SEVERITY_CONFIG[scan.diagnosis.severity]?.bg || COLORS.background }
                  ]}>
                    <Text style={[
                      styles.severityText,
                      { color: SEVERITY_CONFIG[scan.diagnosis.severity]?.color || COLORS.textLight }
                    ]}>
                      {scan.diagnosis.severity}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.scanDisease}>{scan.diagnosis?.disease || "Unknown"}</Text>
              {scan.diagnosis?.confidence && (
                <Text style={styles.scanConfidence}>
                  {Math.round(scan.diagnosis.confidence)}% confidence
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noScanWarning}>
            <Ionicons name="warning-outline" size={18} color={COLORS.error} />
            <Text style={styles.noScanText}>
              No diagnosis attached. Please go back and select a scan from your history.
            </Text>
          </View>
        )}

        {/* Note */}
        <Text style={styles.sectionTitle}>
          Additional Note <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe anything else the expert should know — e.g. when symptoms started, weather conditions, treatments already tried..."
          placeholderTextColor={COLORS.textLight}
          multiline
          numberOfLines={4}
          maxLength={500}
          value={note}
          onChangeText={setNote}
        />
        <Text style={styles.charCount}>{note.length}/500</Text>

        {/* Info note */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>
            The expert will review your diagnosis and respond with personalized advice.
            You'll get a notification when they reply.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (submitting || !scan) && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting || !scan}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Send to Expert</Text>
              <Ionicons name="send" size={16} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  toCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 24,
  },
  toAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  toAvatarText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  toLabel: { fontSize: 11, color: COLORS.textLight },
  toName:  { fontSize: 15, fontWeight: "700", color: COLORS.textDark, marginTop: 2 },

  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textDark, marginBottom: 10 },
  optional: { color: COLORS.textLight, fontWeight: "400" },

  scanLoading: { padding: 20, alignItems: "center" },
  scanCard: {
    flexDirection: "row", backgroundColor: COLORS.white, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, overflow: "hidden", marginBottom: 24,
  },
  scanImage: { width: 90, height: 90 },
  scanInfo: { flex: 1, padding: 12, justifyContent: "center" },
  scanRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  scanCrop: { fontSize: 12, color: COLORS.textLight, fontWeight: "600", textTransform: "capitalize" },
  severityBadge: { borderRadius: 6, paddingVertical: 2, paddingHorizontal: 8 },
  severityText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  scanDisease: { fontSize: 15, fontWeight: "700", color: COLORS.textDark, marginBottom: 2 },
  scanConfidence: { fontSize: 12, color: COLORS.textLight },

  noScanWarning: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: COLORS.errorLight, borderWidth: 1, borderColor: "#fecaca",
    borderRadius: 10, padding: 12, marginBottom: 24,
  },
  noScanText: { flex: 1, fontSize: 12, color: COLORS.error, lineHeight: 17 },

  textArea: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    backgroundColor: COLORS.white, padding: 12,
    fontSize: 14, color: COLORS.textDark, minHeight: 100, textAlignVertical: "top",
  },
  charCount: { fontSize: 11, color: COLORS.textLight, textAlign: "right", marginTop: 4, marginBottom: 20 },

  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: COLORS.primaryLight, borderWidth: 1,
    borderColor: COLORS.primaryBorder, borderRadius: 10, padding: 12, marginBottom: 24,
  },
  infoText: { flex: 1, fontSize: 12, color: "#15803d", lineHeight: 17 },

  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "600" },

  // Confirmation
  confirmContent: { flexGrow: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 60 },
  confirmIcon: { marginBottom: 20 },
  confirmTitle: { fontSize: 22, fontWeight: "700", color: COLORS.textDark, marginBottom: 10 },
  confirmDesc: { fontSize: 14, color: COLORS.textLight, textAlign: "center", lineHeight: 21, marginBottom: 20 },
  sessionInfo: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.primaryLight, borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 14, marginBottom: 28,
  },
  sessionInfoText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15,
    alignItems: "center", width: "100%", marginBottom: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
  secondaryBtn: { paddingVertical: 12, alignItems: "center", width: "100%" },
  secondaryBtnText: { color: COLORS.textLight, fontSize: 14, fontWeight: "600" },
});

export default FileCaseScreen;