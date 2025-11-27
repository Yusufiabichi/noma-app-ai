import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { SafeAreaView } from "react-native-safe-area-context";


import { getByCrop } from '../data/useTreatment.js';
import { getById } from '../data/useTreatment.js';

import treatment from "../../assets/data/treatments.json";

type severityProps = {
  severity: string
}


const [confidence, setConfidence] = useState(90)

const severit = ["high", "moderate", "low"]

const diseaseId = "bean_rust";
  const treatmentData = getById(diseaseId);
  console.log(treatmentData);
  // console.log(treatmentData?.severities.high.future_prevention_ha);
  // console.log(treatmentData?.severities.high.recommended_treatment_en);
  // console.log(treatmentData?.severities.high.recommended_treatment_ha);

  const [severity, setSeverity] = useState("high");

const checkSeverity = (props: severityProps) => {
 if(severity === "high"){
    return treatmentData?.severities.high;
 } 
 else if( severity === "moderate"){
  return treatmentData?.severities.moderate;
 } 
 else if(severity === "low"){
  return treatmentData?.severities.low;
 }
}
// how to call the function and stored its value in new variable

// const checkedSeverity = checkSeverity(severity);


const TreatmentRecommendationScreen = () => {

  const { language, setLanguage } = useLanguage();

  return (
    <SafeAreaView>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Analysis Results</Text>

      {/* Detected Issue */}
      <View style={styles.issueCard}>
        <View style={styles.issueHeader}>
          <Ionicons name="warning-outline" size={20} color="#c0392b" />
          <Text style={styles.issueLabel}>Detected Issue</Text>
        </View>
        <Text style={styles.issueTitle}>{language === 'english' ? treatmentData?.name_en : treatmentData?.name_ha}</Text>
        <Text style={styles.issueCrop}>Crop: {treatmentData?.crop}</Text>
        <Text style={styles.issueInfo}>{`Confidence: ${confidence}% • Severity: ${severity} `}</Text>
      </View>

      {/* Recommended Treatment */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="medkit-outline" size={20} color="#2e7d32" />
          <Text style={styles.sectionTitle}>Recommended Treatment</Text>
        </View>

        {/* check for current language and severity and display treatment recommendation based on that */}
        {treatmentData?.severities.high.recommended_treatment_ha.map((item, index) => (
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
    </SafeAreaView>
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
  issueCrop: {
    fontSize: 16,
    fontWeight: "500",
    color: "#b34b4b",
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
