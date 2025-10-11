import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

export default function CheckResultScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Analysis Results Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Analysis Results</Text>

        {/* Detected Issue */}
        <View style={styles.issueBox}>
          <Text style={styles.issueLabel}>⚠️ Detected Issue</Text>
          <Text style={styles.issueName}>Early Blight</Text>
          <Text style={styles.issueDetails}>Confidence: 94% • Severity: Moderate</Text>
        </View>

        {/* Recommended Treatment */}
        <Text style={styles.sectionTitle}>Recommended Treatment</Text>
        <View style={styles.listBox}>
          <Text style={styles.listItem}>1. Remove affected leaves immediately</Text>
          <Text style={styles.listItem}>2. Apply copper-based fungicide</Text>
          <Text style={styles.listItem}>3. Improve air circulation around plants</Text>
          <Text style={styles.listItem}>4. Avoid overhead watering</Text>
        </View>

        {/* Future Prevention */}
        <Text style={styles.sectionTitle}>🛡 Future Prevention</Text>
        <View style={styles.listBox}>
          <Text style={styles.listItem}>• Rotate crops yearly</Text>
          <Text style={styles.listItem}>• Maintain proper spacing</Text>
          <Text style={styles.listItem}>• Use disease-resistant varieties</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.saveButton]}>
            <Text style={styles.buttonText}>Save to Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.helpButton]}>
            <Text style={styles.buttonText}>Get Expert Help</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1e293b",
  },
  issueBox: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  issueLabel: {
    color: "#b91c1c",
    fontWeight: "bold",
    marginBottom: 4,
  },
  issueName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#dc2626",
  },
  issueDetails: {
    fontSize: 14,
    color: "#7f1d1d",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    color: "#111827",
  },
  listBox: {
    marginBottom: 12,
  },
  listItem: {
    fontSize: 15,
    marginBottom: 6,
    color: "#374151",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: "#16a34a",
  },
  helpButton: {
    backgroundColor: "#2563eb",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
