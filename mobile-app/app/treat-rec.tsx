import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TreatmentRecommendation() {
  const data = {
    disease_name: "Rice Blast",
    local_name: "Cizon Shinkafa",
    symptoms: [
      "Spindle-shaped lesions with brown borders",
      "Neck rot near panicle",
    ],
    severity_thresholds: {
      mild: "<10% tillers",
      moderate: "10-30%",
      severe: ">30%",
    },
    non_chemical_controls: [
      "Use balanced fertilizer",
      "Improve water management",
      "Plant resistant varieties",
    ],
    weather_constraints:
      "Avoid spraying if rain is forecast within the next 12 hours.",
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{data.disease_name}</Text>
        <Text style={styles.subtitle}>{data.local_name}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms</Text>
          {data.symptoms.map((s, idx) => (
            <Text key={idx} style={styles.itemText}>• {s}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Severity Thresholds</Text>
          <Text style={styles.itemText}>Mild: {data.severity_thresholds.mild}</Text>
          <Text style={styles.itemText}>Moderate: {data.severity_thresholds.moderate}</Text>
          <Text style={styles.itemText}>Severe: {data.severity_thresholds.severe}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Non-Chemical Controls</Text>
          {data.non_chemical_controls.map((n, idx) => (
            <Text key={idx} style={styles.itemText}>• {n}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weather Constraints</Text>
          <Text style={styles.itemText}>{data.weather_constraints}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => Alert.alert("Action", "You chose to follow the treatment.")}
          >
            <Text style={styles.primaryButtonText}>I will do this</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => Alert.alert("Ask Expert", "Connecting to an agricultural expert...")}
          >
            <Text style={styles.secondaryButtonText}>Ask Expert</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: 16 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a73e8",
    marginBottom: 6,
  },
  itemText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#1a73e8",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: "#1a73e8",
    backgroundColor: "#fff",
  },
  secondaryButtonText: {
    color: "#1a73e8",
    fontWeight: "600",
    fontSize: 16,
  },
});
