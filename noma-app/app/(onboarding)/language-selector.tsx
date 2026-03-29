import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import { useLanguage } from "@/src/context/LanguageContext";

const COLORS = {
  primary: "#16A34A",
  background: "#f8f8f8",
  white: "#ffffff",
  textDark: "#1f2937",
  textLight: "#6b7280",
  border: "#e5e7eb",
};

const languages = [
  {
    id: "english",
    name: "English",
    subtitle: "Farming in your language",
    code: "english",
  },
  {
    id: "hausa",
    name: "Hausa",
    subtitle: "Noma da yaren ku",
    code: "hausa",
  },
  {
    id: "yoruba",
    name: "Yorùbá",
    subtitle: "Iroko ni ara ẹ",
    code: "yoruba",
  },
];

const LanguageSelectorScreen = () => {
  const router = useRouter();
  const { setLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");

  const handleSelectLanguage = async () => {
    setLanguage(selectedLanguage as "english" | "hausa" | "yoruba");
    router.replace("/(onboarding)/login");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hello!</Text>
          <Text style={styles.headerSubtitle}>Select your NomaApp language</Text>
        </View>

        <View style={styles.languagesContainer}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[
                styles.languageOption,
                selectedLanguage === lang.code && styles.languageOptionSelected,
              ]}
              onPress={() => setSelectedLanguage(lang.code)}
            >
              <View style={styles.languageContent}>
                <Text
                  style={[
                    styles.languageName,
                    selectedLanguage === lang.code &&
                      styles.languageNameSelected,
                  ]}
                >
                  {lang.name}
                </Text>
                <Text
                  style={[
                    styles.languageSubtitle,
                    selectedLanguage === lang.code &&
                      styles.languageSubtitleSelected,
                  ]}
                >
                  {lang.subtitle}
                </Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedLanguage === lang.code && styles.radioButtonSelected,
                ]}
              >
                {selectedLanguage === lang.code && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Accept Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleSelectLanguage}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          I read and accept the{" "}
          <Text style={styles.termsLink}>terms of use</Text> and the{" "}
          <Text style={styles.termsLink}>privacy policy</Text>.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  languagesContainer: {
    marginBottom: 30,
    gap: 12,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  languageOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#f0fdf4",
  },
  languageContent: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  languageNameSelected: {
    color: COLORS.primary,
  },
  languageSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  languageSubtitleSelected: {
    color: COLORS.primary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.textLight,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default LanguageSelectorScreen;
