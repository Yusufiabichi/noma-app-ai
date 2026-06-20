import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import ConfidenceBar from "./ConfidenceBar";

interface IssueCardProps {
  diseaseName: string;
  cropType: string;
  confidence: number;   // 0 to 1
  severity?: string;
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  low:      { color: "#15803d", bg: "#e8f5e9", icon: "checkmark-circle-outline" },
  moderate: { color: "#b45309", bg: "#fff8e1", icon: "alert-circle-outline"     },
  high:     { color: "#b91c1c", bg: "#fdecea", icon: "warning-outline"          },
  severe:   { color: "#b91c1c", bg: "#fdecea", icon: "warning-outline"          },
  unknown:  { color: "#6b7280", bg: "#f3f4f6", icon: "help-circle-outline"      },
};

const IssueCard: React.FC<IssueCardProps> = ({
  diseaseName, cropType, confidence, severity = "unknown",
}) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const sevConfig = SEVERITY_CONFIG[severity?.toLowerCase()] || SEVERITY_CONFIG.unknown;

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="bug-outline" size={20} color="#b91c1c" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Detected issue</Text>
          <Text style={styles.diseaseName}>{diseaseName}</Text>
        </View>
      </View>

      {/* Meta row — crop + severity */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="leaf-outline" size={14} color="#6b7280" />
          <Text style={styles.metaText}>{cropType}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={[styles.severityPill, { backgroundColor: sevConfig.bg }]}>
          <Ionicons name={sevConfig.icon as any} size={13} color={sevConfig.color} />
          <Text style={[styles.severityText, { color: sevConfig.color }]}>
            {severity.charAt(0).toUpperCase() + severity.slice(1)} severity
          </Text>
        </View>
      </View>

      {/* Confidence bar */}
      <View style={styles.divider} />
      <ConfidenceBar confidence={confidence} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1d4ce",
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fdecea",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: "#6b7280",
    textTransform: "capitalize",
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#e5e7eb",
  },
  severityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  severityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 14,
  },
});

export default IssueCard;