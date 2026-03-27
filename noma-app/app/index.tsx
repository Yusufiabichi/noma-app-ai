import React, { useEffect, useState } from "react";
import { View, Image, Animated, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "@/src/context/LanguageContext";

const SplashScreen = () => {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const { loading } = useLanguage();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasCompleted = await AsyncStorage.getItem("hasCompletedOnboarding");
        
        // Navigate after 2000ms
        const timer = setTimeout(() => {
          if (!loading) {
            if (hasCompleted === "true") {
              router.replace("/(tabs)");
            } else {
              router.replace("/(onboarding)/language-selector");
            }
          }
        }, 2000);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // Default to onboarding if there's an error
        const timer = setTimeout(() => {
          if (!loading) {
            router.replace("/(onboarding)/language-selector");
          }
        }, 2000);

        return () => clearTimeout(timer);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (!loading) {
      checkOnboardingStatus();
    }
  }, [loading]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <Image
          source={require("@/assets/nomaapplogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
});

export default SplashScreen;
