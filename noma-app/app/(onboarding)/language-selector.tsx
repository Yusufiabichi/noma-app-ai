import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLanguage } from "@/src/context/LanguageContext";
import AnimatedGreeting from "@/app/components/AnimatedGreeting";

// Taken from the NomaApp logo: forest wordmark, leaf greens, brand green
const COLORS = {
  primary: "#16A34A",
  ink: "#0E3B2C",
  background: "#F6F9F4",
  white: "#ffffff",
  textDark: "#1f2937",
  textLight: "#5F6B63",
  border: "#E3E8E0",
  selectedBg: "#F0FDF4",
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

// Which greeting to show when a language is picked (see AnimatedGreeting)
const GREETING_INDEX: Record<string, number> = { english: 0, hausa: 1, yoruba: 2 };

const LanguageSelectorScreen = () => {
  const router = useRouter();
  const { setLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");
  const [greetingFocus, setGreetingFocus] = useState<number | null>(null);

  const selectLanguage = (code: string) => {
    setSelectedLanguage(code);
    setGreetingFocus(GREETING_INDEX[code] ?? null);
  };

  const handleSelectLanguage = async () => {
    setLanguage(selectedLanguage as "english" | "hausa" | "yoruba");
    router.replace("/(onboarding)/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("@/assets/images/NomaApp_logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="NomaApp"
        />

        <View style={styles.header}>
          <AnimatedGreeting focusIndex={greetingFocus} />
          <Text style={styles.headerSubtitle}>Choose the language you want to use NomaApp in.</Text>
        </View>

        <View style={styles.languagesContainer}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[
                styles.languageOption,
                selectedLanguage === lang.code && styles.languageOptionSelected,
              ]}
              onPress={() => selectLanguage(lang.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedLanguage === lang.code }}
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
          <Text style={styles.acceptButtonText}>Continue</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you accept the{" "}
          <Text style={styles.termsLink}>terms of use</Text> and the{" "}
          <Text style={styles.termsLink}>privacy policy</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 40,
    marginLeft: -4,
    marginBottom: 48,
  },
  header: {
    marginBottom: 36,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: COLORS.textLight,
    marginTop: 20,
    maxWidth: 300,
  },
  languagesContainer: {
    marginBottom: 30,
    gap: 10,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  languageOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.selectedBg,
  },
  languageContent: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.ink,
    marginBottom: 3,
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
    borderColor: "#B8C4BB",
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
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 12,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
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
