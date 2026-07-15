import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator, Animated, Easing,
} from "react-native";
import * as Location from "expo-location";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Data from "../../constants/data.json";
import { useLanguage } from "../../src/context/LanguageContext";

interface WeatherData { temp: number; condition: string; humidity?: number; windspeed?: number; }
interface GeoLocation { city?: string; country?: string; }

export default function WeatherCard(): JSX.Element {
  const { language } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationName("Location unavailable");
          setWeather({ temp: 32, condition: "Hot & Dry", humidity: 35, windspeed: 10 });
          setLoading(false);
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const [geo]: GeoLocation[] = await Location.reverseGeocodeAsync({ latitude, longitude });
        setLocationName(`${geo?.city || "Unknown"}, ${geo?.country || ""}`);

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m`
        );
        const data = await res.json();
        const temp: number = data.current_weather?.temperature ?? 32;
        const windspeed: number = data.current_weather?.windspeed ?? 10;
        const humidity: number = data.hourly?.relativehumidity_2m?.[0] ?? 45;
        const condition: string = temp >= 30 ? "Hot & Dry" : "Cool & Humid";
        setWeather({ temp, condition, humidity, windspeed });
      } catch (e) {
        setWeather({ temp: 32, condition: "Hot & Dry", humidity: 35, windspeed: 10 });
      } finally {
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      }
    })();
  }, []);

  const isHot = (weather?.temp ?? 0) >= 30;
  const cardBg = isHot ? "#16A34A" : "#0284C7";

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: "#16A34A", justifyContent: "center", flexDirection: "row", gap: 10 }]}>
        <ActivityIndicator color="#fff" size="small" />
        <Text style={{ color: "#fff", fontSize: 14 }}>Fetching weather...</Text>
      </View>
    );
  }

  if (!weather) return <></>;

  return (
    <Animated.View style={[styles.card, { backgroundColor: cardBg, opacity: fadeAnim }]}>
      {/* Pulse ring behind icon */}
      <View style={styles.iconArea}>
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
        <Animated.View style={styles.iconCircle}>
          {isHot ? (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Feather name="sun" size={36} color="#fff" />
            </Animated.View>
          ) : (
            <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
              <Ionicons name="rainy-outline" size={36} color="#fff" />
            </Animated.View>
          )}
        </Animated.View>
      </View>

      {/* Location */}
      <View style={styles.locRow}>
        <MaterialCommunityIcons name="map-marker" size={14} color="rgba(255,255,255,.8)" />
        <Text style={styles.locText}>{locationName}</Text>
      </View>

      {/* Temp */}
      <Text style={styles.temp}>{Math.round(weather.temp)}°C</Text>
      <Text style={styles.cond}>{weather.condition}</Text>

      {/* Status badge */}
      {isHot ? (
        <View style={styles.badgeWarn}>
          <Ionicons name="warning-outline" size={13} color="#fca5a5" />
          <Text style={styles.badgeWarnText}>
            {language === "english" ? Data.en.home.status_text.bad : Data.ha.home.status_text.bad}
          </Text>
        </View>
      ) : (
        <View style={styles.badgeGood}>
          <Feather name="check-circle" size={13} color="#16A34A" />
          <Text style={styles.badgeGoodText}>
            {language === "english" ? Data.en.home.status_text.good : Data.ha.home.status_text.good}
          </Text>
        </View>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Humidity</Text>
          <Text style={styles.statValue}>{weather.humidity ?? "--"}%</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Wind</Text>
          <Text style={styles.statValue}>{Math.round(weather.windspeed ?? 0)} km/h</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Feels like</Text>
          <Text style={styles.statValue}>{Math.round(weather.temp - 2)}°C</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 20,
    paddingBottom: 16,
    overflow: "hidden",
  },
  iconArea: {
    position: "absolute",
    right: 20,
    top: 18,
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,.2)",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
    paddingRight: 80,
  },
  locText: {
    color: "rgba(255,255,255,.85)",
    fontSize: 13,
    fontWeight: "500",
  },
  temp: {
    color: "#fff",
    fontSize: 46,
    fontWeight: "600",
    lineHeight: 50,
  },
  cond: {
    color: "rgba(255,255,255,.7)",
    fontSize: 14,
    marginBottom: 12,
  },
  badgeGood: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  badgeGoodText: { color: "#16A34A", fontSize: 12, fontWeight: "600" },
  badgeWarn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(220,38,38,.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,.35)",
    marginBottom: 14,
  },
  badgeWarnText: { color: "#fca5a5", fontSize: 12, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,.15)",
    paddingTop: 12,
  },
  stat: { flex: 1, alignItems: "center" },
  statLabel: { color: "rgba(255,255,255,.55)", fontSize: 11, marginBottom: 2 },
  statValue: { color: "#fff", fontSize: 14, fontWeight: "500" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,.15)" },
});