import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Data from "../../constants/data.json";
import { useLanguage } from "../../src/context/LanguageContext";

// Define types for the weather data and reverse geocode
interface WeatherData {
  temp: number;
  condition: string;
}

interface GeoLocation {
  city?: string;
  country?: string;
}

export default function WeatherCard(): JSX.Element {
  const { language } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);


  
  useEffect(() => {
    setTimeout(()=>{
      (async () => {
        try {
          // Request location permissions
          const { status } = await Location.requestForegroundPermissionsAsync();
  
          if (status !== "granted") {
            setLocationName("Location unavailable");
            setWeather({ temp: 32, condition: "Hot & Dry" });
            setLoading(false);
            return;
          }
  
          // Get current GPS coordinates
          const location = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = location.coords;
  
          // Reverse geocode to get city name
          const [geo]: GeoLocation[] = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });
  
          setLocationName(`${geo?.city || "Unknown"}, ${geo?.country || ""}`);
  
          // Fetch weather data from Open-Meteo
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
          const response = await fetch(weatherUrl);
          const data = await response.json();
  
          const temp: number = data.current_weather?.temperature ?? 32;
          const condition: string = temp >= 30 ? "Hot & Dry" : "Cool & Humid";
  
          setWeather({ temp, condition });
        } catch (error) {
          console.error("Error fetching weather:", error);
          setWeather({ temp: 32, condition: "Hot & Dry" });
        } finally {
          setLoading(false);
        }
      })();
    }, 2000);
  }, []);

  if (loading) {
    return (
      <View style={styles.locationCard}>
        <ActivityIndicator color="#fff" size="small" />
        <Text style={{ color: "#fff", marginLeft: 10 }}>Loading weather...</Text>
      </View>
    );
  }

  // Fallback if weather is null
  if (!weather) return <></>;

  const wheather = weather.temp;
  const condition = weather.condition;

  return (
    <View style={styles.locationCard}>
      <View>
        <Text style={styles.locationName}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#fff" />{" "}
          {locationName}
        </Text>
        <Text style={styles.temperature}>{wheather}°C</Text>
        <Text style={styles.conditionText}>{condition}</Text>

        {wheather >= 30 ? (
          <View style={styles.statusBox}>
          <Ionicons name="warning-outline" size={16} color="#c0392b" />
            <Text style={styles.statusRed}>
              {language === "english"
                ? Data.en.home.status_text.bad
                : Data.ha.home.status_text.bad}
            </Text>
          </View>
        ) : (
          <View style={styles.statusBox}>
            <Feather name="check-square" size={16} color="#16A34A" />
            <Text style={styles.statusText}>
              {language === "english"
                ? Data.en.home.status_text.good
                : Data.ha.home.status_text.good}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.sunIcon}>
        <Feather name="sun" size={28} color="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  locationCard: {
    backgroundColor: "#16A34A",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    marginVertical: 4,
  },
  temperature: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "600",
  },
  conditionText: {
    color: "#c8e6c9",
    fontSize: 16,
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8FFF2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 5,
  },
  statusText: {
    color: "#16A34A",
    marginLeft: 5,
    fontSize: 12,
  },
  statusRed: {
    color: "#c62828",
    marginLeft: 5,
    fontSize: 12,
  },
  sunIcon: {
    backgroundColor: "#0468295b",
    padding: 12,
    borderRadius: 12,
  },
});
