import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#16A34A", primaryLight: "#f0fdf4",
  background: "#f8f8f8", white: "#ffffff",
  textDark: "#1f2937", textLight: "#6b7280",
  border: "#e5e7eb", error: "#dc2626", errorLight: "#fef2f2",
  amber: "#d97706", amberLight: "#fffbeb",
};

/**
 * Maps common error codes/situations to a friendly title, message, and icon.
 * Extend this as new error codes appear in your API.
 */
const ERROR_PRESETS: Record<string, { icon: string; title: string; message: string }> = {
  NETWORK_ERROR: {
    icon: "cloud-offline-outline",
    title: "No internet connection",
    message: "Check your connection and try again.",
  },
  TIMEOUT: {
    icon: "time-outline",
    title: "Request timed out",
    message: "The server took too long to respond. Please try again.",
  },
  SERVER_ERROR: {
    icon: "server-outline",
    title: "Something went wrong",
    message: "Our servers ran into an issue. We're on it — please try again shortly.",
  },
  NOT_FOUND: {
    icon: "search-outline",
    title: "Not found",
    message: "We couldn't find what you're looking for.",
  },
  UNAUTHORIZED: {
    icon: "lock-closed-outline",
    title: "Session expired",
    message: "Please log in again to continue.",
  },
  FORBIDDEN: {
    icon: "shield-outline",
    title: "Access restricted",
    message: "You don't have permission to view this.",
  },
  DEFAULT: {
    icon: "alert-circle-outline",
    title: "Something went wrong",
    message: "Please try again. If the problem continues, contact support.",
  },
};

/**
 * Inspects an error (typically an axios error) and returns a friendly preset.
 */
export const getErrorPreset = (error: any) => {
  if (!error) return ERROR_PRESETS.DEFAULT;

  // No response at all = network issue
  if (!error.response) {
    if (error.code === "ECONNABORTED") return ERROR_PRESETS.TIMEOUT;
    return ERROR_PRESETS.NETWORK_ERROR;
  }

  const status = error.response?.status;
  const code = error.response?.data?.error?.code;

  if (code && ERROR_PRESETS[code]) return ERROR_PRESETS[code];
  if (status === 401) return ERROR_PRESETS.UNAUTHORIZED;
  if (status === 403) return ERROR_PRESETS.FORBIDDEN;
  if (status === 404) return ERROR_PRESETS.NOT_FOUND;
  if (status >= 500)  return ERROR_PRESETS.SERVER_ERROR;

  // Use server-provided message if present, but keep a friendly title
  if (error.response?.data?.error?.message) {
    return {
      icon: ERROR_PRESETS.DEFAULT.icon,
      title: ERROR_PRESETS.DEFAULT.title,
      message: error.response.data.error.message,
    };
  }

  return ERROR_PRESETS.DEFAULT;
};

interface ErrorStateProps {
  error?: any;                  // raw error object (optional — used to auto-pick preset)
  title?: string;                // override title
  message?: string;              // override message
  icon?: string;                  // override icon
  onRetry: () => void;            // retry handler — required
  retryLabel?: string;            // default "Try Again"
  compact?: boolean;              // smaller inline version vs full-screen
}

/**
 * Friendly error state with a retry button.
 * Use this anywhere an API call can fail — lists, detail screens, forms.
 *
 * Usage:
 *   <ErrorState error={error} onRetry={fetchData} />
 *   <ErrorState title="Custom title" message="Custom message" onRetry={fetchData} compact />
 */
const ErrorState: React.FC<ErrorStateProps> = ({
  error, title, message, icon, onRetry, retryLabel = "Try Again", compact = false,
}) => {
  const preset = error ? getErrorPreset(error) : ERROR_PRESETS.DEFAULT;

  const finalIcon    = icon    || preset.icon;
  const finalTitle   = title   || preset.title;
  const finalMessage = message || preset.message;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name={finalIcon as any} size={20} color={COLORS.error} />
        <View style={{ flex: 1 }}>
          <Text style={styles.compactTitle}>{finalTitle}</Text>
          <Text style={styles.compactMessage}>{finalMessage}</Text>
        </View>
        <TouchableOpacity style={styles.compactRetryBtn} onPress={onRetry}>
          <Ionicons name="refresh" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={finalIcon as any} size={36} color={COLORS.error} />
      </View>
      <Text style={styles.title}>{finalTitle}</Text>
      <Text style={styles.message}>{finalMessage}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <Ionicons name="refresh" size={16} color={COLORS.white} />
        <Text style={styles.retryBtnText}>{retryLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32, paddingVertical: 60,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.errorLight, alignItems: "center",
    justifyContent: "center", marginBottom: 18,
  },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.textDark, marginBottom: 6, textAlign: "center" },
  message: { fontSize: 13, color: COLORS.textLight, textAlign: "center", lineHeight: 19, marginBottom: 24 },
  retryBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 13, paddingHorizontal: 28,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  retryBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },

  // Compact (inline banner) variant
  compactContainer: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.errorLight, borderWidth: 1,
    borderColor: "#fecaca", borderRadius: 12, padding: 12, margin: 16,
  },
  compactTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  compactMessage: { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  compactRetryBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
});

export default ErrorState;