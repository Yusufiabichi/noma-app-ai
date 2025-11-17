import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

const TreatmentRecommendationScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Analysis Results</Text>

      {/* Detected Issue */}
      <View style={styles.issueCard}>
        <View style={styles.issueHeader}>
          <Ionicons name="warning-outline" size={20} color="#c0392b" />
          {/* <Ionicons name="arrow-undo-sharp" size={20} color="#c0392b" />
          <Ionicons name="arrow-back-circle" size={20} color="#c0392b" />
                <Ionicons name="checkmark-outline" size={20} color="#c0392b" /> */}
          <Text style={styles.issueLabel}>Detected Issue</Text>
        </View>
        <Text style={styles.issueTitle}>Early Blight</Text>
        <Text style={styles.issueInfo}>Confidence: 94% • Severity: Moderate</Text>
      </View>

      {/* Recommended Treatment */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="medkit-outline" size={20} color="#2e7d32" />
          <Text style={styles.sectionTitle}>Recommended Treatment</Text>
        </View>

        {[
          "Remove affected leaves immediately",
          "Apply copper-based fungicide",
          "Improve air circulation around plants",
          "Avoid overhead watering",
        ].map((item, index) => (
          <View key={index} style={styles.listContainer}>
            <View style={styles.listHeader}>
              <View style={styles.listNumberBox}>
                <Text style={styles.listNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.listText}>{item}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Future Prevention */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#0052cc" />
          <Text style={styles.sectionTitle}>Future Prevention</Text>
        </View>

        {[
          "Rotate crops yearly",
          "Maintain proper spacing",
          "Use disease-resistant varieties",
        ].map((item, index) => (
          <View key={index} style={styles.listContainer}>
            <View style={styles.listHeader}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#2e7d32" />
              <Text style={styles.listText}>{item}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.confirmButton} 
          onPress={() => 
            router.push('./')
          }>
          <Text style={styles.buttonText}>I will do this</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.expertButton} 
          onPress={() => 
            router.push('./')
          }>
          <Text style={styles.buttonText}>Ask Expert</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
    color: "#111",
  },
  issueCard: {
    backgroundColor: "#fdecea",
    borderWidth: 1,
    borderColor: "#f5c6cb",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  issueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  issueLabel: {
    color: "#c0392b",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 5,
  },
  issueTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#b22222",
    marginBottom: 5,
  },
  issueInfo: {
    fontSize: 14,
    color: "#b34b4b",
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginLeft: 6,
  },
  listContainer: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  listNumberBox: {
    backgroundColor: "#e8f5e9",
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  listNumber: {
    fontWeight: "700",
    color: "#16A34A",
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10,
  },
  expertButton: {
    flex: 1,
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TreatmentRecommendationScreen;
