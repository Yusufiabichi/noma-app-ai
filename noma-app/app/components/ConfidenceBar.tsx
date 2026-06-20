import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";

interface ConfidenceBarProps {
  confidence: number; // 0 to 1 (e.g. 0.84)
}

const getConfidenceColor = (pct: number) => {
  if (pct < 60) return { fill: "#d97706", bg: "#fff8e1", text: "#7c4a00" }; // amber — low
  if (pct < 80) return { fill: "#3b6d11", bg: "#eaf3de", text: "#27500a" }; // mid green
  return { fill: "#16A34A", bg: "#e8f5e9", text: "#15803d" };               // strong green — high
};

const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ confidence }) => {
  const targetPct = Math.round(confidence * 100);
  const colors = getConfidenceColor(targetPct);

  const widthAnim  = useRef(new Animated.Value(0)).current;
  const [displayedPct, setDisplayedPct] = useState(0);

  useEffect(() => {
    // Animate the bar fill
    Animated.timing(widthAnim, {
      toValue: targetPct,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width animation can't use native driver
      delay: 150,
    }).start();

    // Animate the number count-up in sync
    const duration = 1200;
    const startDelay = 150;
    const startTime = Date.now() + startDelay;
    let frame: number;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      if (elapsed < 0) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayedPct(Math.round(eased * targetPct));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [targetPct]);

  const widthInterpolated = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Confidence score</Text>
        <Text style={[styles.percentText, { color: colors.text }]}>{displayedPct}%</Text>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { width: widthInterpolated, backgroundColor: colors.fill },
          ]}
        />
      </View>

      <View style={styles.scaleRow}>
        <Text style={styles.scaleLabel}>Low</Text>
        <Text style={styles.scaleLabel}>High</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  label: { fontSize: 13, color: "#6b7280" },
  percentText: { fontSize: 20, fontWeight: "700" },
  track: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4 },
  scaleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  scaleLabel: { fontSize: 11, color: "#9ca3af" },
});

export default ConfidenceBar;