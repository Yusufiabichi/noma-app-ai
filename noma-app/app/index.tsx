import React, { useEffect, useState } from "react";
import { View, Image, Animated, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { useLanguage } from "@/src/context/LanguageContext";

const AppSplashScreen = () => {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const { loading } = useLanguage();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    // Keep the native splash screen visible until we explicitly hide it.
    SplashScreen.preventAutoHideAsync().catch(() => {
      // ignore if already hidden or unavailable
    });

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const checkOnboardingStatus = async () => {
      try {
        const hasCompleted = await AsyncStorage.getItem("hasCompletedOnboarding");

        timer = setTimeout(async () => {
          if (hasCompleted === "true") {
            router.replace("/(tabs)");
          } else {
            router.replace("/(onboarding)/language-selector");
          }
          await SplashScreen.hideAsync();
        }, 2000);
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        timer = setTimeout(async () => {
          router.replace("/(onboarding)/language-selector");
          await SplashScreen.hideAsync();
        }, 2000);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (!loading) {
      checkOnboardingStatus();
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
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

export default AppSplashScreen;
