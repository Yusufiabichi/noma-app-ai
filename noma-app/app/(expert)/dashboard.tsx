import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { getVerificationStatus, savePushToken } from "@/src/api/expert.api";

const COLORS = {
  primary: "#16A34A",
  primaryLight: "#f0fdf4",
  primaryBorder: "#bbf7d0",
  background: "#f8f8f8",
  white: "#ffffff",
  textDark: "#1f2937",
  textLight: "#6b7280",
  border: "#e5e7eb",
  amber: "#d97706",
  amberLight: "#fffbeb",
  amberBorder: "#fde68a",
  error: "#dc2626",
  errorLight: "#fef2f2",
};

// ─── Stage Config ─────────────────────────────────────────────────────────────

const STAGES = [
  {
    id: "1",
    number: 1,
    title: "Professional Profile",
    description: "Tell us about your agricultural background and specializations.",
    screen: "/(expert)/profile",
    icon: "person-outline",
  },
  {
    id: "2",
    number: 2,
    title: "Identity & Document Verification",
    description:
      "Upload your government ID and agricultural credentials for review.",
    screen: "/(expert)/documents",
    icon: "document-text-outline",
  },
  {
    id: "3",
    number: 3,
    title: "Competency Assessment",
    description:
      "25-question crop diagnosis test. 70% to pass. 30-minute limit.",
    screen: "/(expert)/assessment",
    icon: "school-outline",
  },
];

const BADGE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  verified_identity:  { label: "Verified Identity",     icon: "shield-checkmark", color: COLORS.primary },
  ag_professional:    { label: "Ag Professional",       icon: "leaf",             color: COLORS.primary },
  passed_assessment:  { label: "Certified Expert",      icon: "ribbon",           color: COLORS.amber   },
  top_rated:          { label: "Top Rated",             icon: "star",             color: COLORS.amber   },
  cases_100_plus:     { label: "100+ Cases Solved",     icon: "trophy",           color: COLORS.primary },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusChip = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    incomplete:     { label: "Incomplete",      bg: COLORS.background,  text: COLORS.textLight },
    pending_review: { label: "Under Review",    bg: COLORS.amberLight,  text: COLORS.amber     },
    approved:       { label: "Approved",        bg: COLORS.primaryLight, text: COLORS.primary  },
    rejected:       { label: "Action Required", bg: COLORS.errorLight,  text: COLORS.error     },
  };
  const c = config[status] || config.incomplete;
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <Text style={[styles.chipText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
};

const StageCard = ({
  stage,
  currentStage,
  overallStatus,
  assessmentScore,
  onPress,
}: {
  stage: (typeof STAGES)[0];
  currentStage: string;
  overallStatus: string;
  assessmentScore?: number;
  onPress: () => void;
}) => {
  const stageNum  = stage.id;
  const isCurrent = currentStage === stageNum;
  const isDone    = currentStage > stageNum || currentStage === "complete";
  const isLocked  =
    stageNum === "2" && currentStage === "1" ||
    stageNum === "3" && (currentStage === "1" || currentStage === "2");

  // Stage 2 is locked after submission until admin approves
  const isPendingReview = stageNum === "2" && overallStatus === "pending_review";
  const isRejected      = stageNum === "2" && overallStatus === "rejected";

  const getBorderColor = () => {
    if (isDone) return COLORS.primary;
    if (isCurrent) return COLORS.primary;
    return COLORS.border;
  };

  const getStatusLabel = () => {
    if (stageNum === "3" && isDone && assessmentScore !== undefined) {
      return `Passed · ${assessmentScore}%`;
    }
    if (isPendingReview) return "Under review";
    if (isRejected) return "Rejected — resubmit";
    if (isDone) return "Completed";
    if (isCurrent) return "In progress";
    return "Locked";
  };

  const getStatusColor = () => {
    if (isRejected) return COLORS.error;
    if (isDone) return COLORS.primary;
    if (isCurrent) return COLORS.amber;
    return COLORS.textLight;
  };

  return (
    <TouchableOpacity
      style={[styles.stageCard, { borderColor: getBorderColor() }]}
      onPress={onPress}
      disabled={isLocked || isPendingReview}
      activeOpacity={0.75}
    >
      {/* Left indicator */}
      <View
        style={[
          styles.stageIndicator,
          isDone && styles.stageIndicatorDone,
          isCurrent && !isDone && styles.stageIndicatorCurrent,
          isLocked && styles.stageIndicatorLocked,
        ]}
      >
        {isDone ? (
          <Ionicons name="checkmark" size={16} color={COLORS.white} />
        ) : (
          <Ionicons
            name={isLocked ? "lock-closed" : (stage.icon as any)}
            size={16}
            color={isLocked ? COLORS.textLight : COLORS.white}
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.stageContent}>
        <View style={styles.stageRow}>
          <Text style={styles.stageTitle}>{stage.title}</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={isLocked ? COLORS.border : COLORS.textLight}
          />
        </View>
        <Text style={styles.stageDesc}>{stage.description}</Text>
        <Text style={[styles.stageStatus, { color: getStatusColor() }]}>
          {getStatusLabel()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ExpertVerificationDashboard = () => {
  const router = useRouter();
  const [profile, setProfile]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getVerificationStatus();
      setProfile(res.data.profile);
    } catch (err) {
      console.error("Failed to fetch verification status:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Register push token on mount
  const registerPushToken = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await savePushToken(token);
    } catch (err) {
      // Non-fatal
    }
  };

  useEffect(() => {
    fetchStatus();
    registerPushToken();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const handleStagePress = (stage: (typeof STAGES)[0]) => {
    router.push(stage.screen as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const currentStage    = profile?.stage || "1";
  const overallStatus   = profile?.overallStatus || "incomplete";
  const isFullyApproved = overallStatus === "approved" && currentStage === "complete";

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
        <Image
          source={require("@/assets/nomaapplogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <StatusChip status={overallStatus} />
      </View>

      {/* Approved Banner */}
      {isFullyApproved && (
        <View style={styles.approvedBanner}>
          <Ionicons name="checkmark-circle" size={28} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.approvedTitle}>You are a Verified Expert!</Text>
            <Text style={styles.approvedSub}>
              You can now accept farmer consultation requests.
            </Text>
          </View>
        </View>
      )}

      {/* Rejection Alert */}
      {overallStatus === "rejected" && (
        <View style={styles.rejectionBanner}>
          <Ionicons name="warning-outline" size={20} color={COLORS.error} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rejectionTitle}>Documents not accepted</Text>
            <Text style={styles.rejectionSub}>
              {profile?.rejectionReason ||
                "Please resubmit clearer documents. Tap Stage 2 to resubmit."}
            </Text>
          </View>
        </View>
      )}

      {/* Pending Review Notice */}
      {overallStatus === "pending_review" && (
        <View style={styles.pendingBanner}>
          <Ionicons name="time-outline" size={20} color={COLORS.amber} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pendingTitle}>Documents under review</Text>
            <Text style={styles.pendingSub}>
              Our team reviews within 48 hours. We'll notify you when done.
            </Text>
          </View>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Verification Progress</Text>
          <Text style={styles.progressPercent}>
            {isFullyApproved
              ? "100%"
              : currentStage === "3"
              ? "67%"
              : currentStage === "2"
              ? "33%"
              : "0%"}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: isFullyApproved
                  ? "100%"
                  : currentStage === "3"
                  ? "67%"
                  : currentStage === "2"
                  ? "33%"
                  : "5%",
              },
            ]}
          />
        </View>
      </View>

      {/* Stage Cards */}
      <Text style={styles.sectionTitle}>Verification Steps</Text>
      {STAGES.map((stage) => (
        <StageCard
          key={stage.id}
          stage={stage}
          currentStage={currentStage}
          overallStatus={overallStatus}
          assessmentScore={profile?.assessment?.score}
          onPress={() => handleStagePress(stage)}
        />
      ))}

      {/* Badges */}
      {isFullyApproved && profile?.displayBadges?.length > 0 && (
        <View style={styles.badgeSection}>
          <Text style={styles.sectionTitle}>Your Badges</Text>
          <View style={styles.badgeRow}>
            {profile.displayBadges.map((badgeKey: string) => {
              const badge = BADGE_CONFIG[badgeKey];
              if (!badge) return null;
              return (
                <View key={badgeKey} style={styles.badge}>
                  <Ionicons name={badge.icon as any} size={16} color={badge.color} />
                  <Text style={[styles.badgeText, { color: badge.color }]}>
                    {badge.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Performance Summary (post-approval) */}
      {isFullyApproved && (
        <View style={styles.performanceCard}>
          <Text style={styles.sectionTitle}>Your Performance</Text>
          <View style={styles.perfRow}>
            <View style={styles.perfStat}>
              <Text style={styles.perfValue}>
                {profile?.performance?.casesHandled ?? 0}
              </Text>
              <Text style={styles.perfLabel}>Cases</Text>
            </View>
            <View style={styles.perfDivider} />
            <View style={styles.perfStat}>
              <Text style={styles.perfValue}>
                {profile?.performance?.averageRating?.toFixed(1) ?? "—"}
              </Text>
              <Text style={styles.perfLabel}>Avg Rating</Text>
            </View>
            <View style={styles.perfDivider} />
            <View style={styles.perfStat}>
              <Text style={styles.perfValue}>
                {profile?.performance?.trialCasesRemaining ?? 20}
              </Text>
              <Text style={styles.perfLabel}>Trial Left</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  content:          { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  logo: { width: 140, height: 44 },

  chip: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  chipText: { fontSize: 12, fontWeight: "600" },

  approvedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  approvedTitle: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  approvedSub:   { fontSize: 12, color: "#15803d", marginTop: 2 },

  rejectionBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  rejectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.error },
  rejectionSub:   { fontSize: 12, color: COLORS.error, marginTop: 2, lineHeight: 17 },

  pendingBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.amberLight,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  pendingTitle: { fontSize: 13, fontWeight: "700", color: COLORS.amber },
  pendingSub:   { fontSize: 12, color: COLORS.amber, marginTop: 2, lineHeight: 17 },

  progressSection: { marginBottom: 24 },
  progressHeader:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressTitle:   { fontSize: 13, fontWeight: "600", color: COLORS.textDark },
  progressPercent: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  progressTrack:   {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 12,
  },

  stageCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 12,
  },
  stageIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.textLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  stageIndicatorDone:    { backgroundColor: COLORS.primary },
  stageIndicatorCurrent: { backgroundColor: COLORS.primary },
  stageIndicatorLocked:  { backgroundColor: COLORS.border },
  stageContent:          { flex: 1 },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  stageTitle:  { fontSize: 14, fontWeight: "700", color: COLORS.textDark, flex: 1 },
  stageDesc:   { fontSize: 12, color: COLORS.textLight, lineHeight: 17, marginBottom: 6 },
  stageStatus: { fontSize: 12, fontWeight: "600" },

  badgeSection: { marginTop: 8, marginBottom: 16 },
  badgeRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },

  performanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 8,
  },
  perfRow:     { flexDirection: "row", alignItems: "center" },
  perfStat:    { flex: 1, alignItems: "center" },
  perfValue:   { fontSize: 22, fontWeight: "700", color: COLORS.primary },
  perfLabel:   { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  perfDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
});

export default ExpertVerificationDashboard;