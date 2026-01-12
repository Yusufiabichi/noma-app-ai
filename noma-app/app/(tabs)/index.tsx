// app/index.js
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/src/context/LanguageContext';
import Data from '@/constants/data.json'
import WeatherCard from '../components/WeatherCard';


export default function HomeScreen() {
  const { language, setLanguage } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  


  return (

    <ScrollView style={styles.container}>
      <WeatherCard />

      {/* Welcome Message */}
      <Text style={styles.welcomeTitle}>
        {language==="english" ? Data.en.home.welcome_title: Data.ha.home.welcome_title}
      </Text>
      <Text style={styles.subtitle}>
        {language==="english" ? Data.en.home.welcome_subtitle: Data.ha.home.welcome_subtitle}
      </Text>

      {/* Scan Button */}
      <TouchableOpacity style={styles.scanButton}
        onPress={()=> router.push("../crop-scan")}
      >
        <FontAwesome name="camera" size={20} color="#fff" />
        <Text style={styles.scanText}>
            {language==="english" ? Data.en.home.scan_text : Data.ha.home.scan_text}
        </Text>
      </TouchableOpacity>

      {/* Quick Options */}
      <View style={styles.cardRow}>
        <TouchableOpacity style={styles.card}
        onPress={()=> router.push("../fertilizer-advice")}>
          <MaterialCommunityIcons name="spray-bottle" size={30} color="#16A34A" />
          <Text style={styles.cardText}>
            {language==="english" ? Data.en.home.cards_text[0] : Data.ha.home.cards_text[0]}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}
        onPress={()=> router.push("../disease-guide")}>
          <MaterialIcons name="pest-control" size={30} color="#c62828" />
          <Text style={styles.cardText}>
            {language==="english" ? Data.en.home.cards_text[1] : Data.ha.home.cards_text[1]}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}
        onPress={()=> router.push("../farming-tips")}>
          <FontAwesome5 name="leaf" size={28} color="#1a73e8" />
          <Text style={styles.cardText}>
            {language==="english" ? Data.en.home.cards_text[2]: Data.ha.home.cards_text[2]}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFFB',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  locationCard: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLabel: {
    color: '#E0FFEF',
    fontSize: 14,
  },
  locationName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    marginVertical: 4,
  },
  temperature: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 600,
  },
  conditionText: {
    color: "#c8e6c9",
    fontSize: 16,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FFF2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 5,
  },
  statusText: {
    color: '#16A34A',
    marginLeft: 5,
    fontSize: 12,
  },
  statusRed: {
    color: '#c62828',
    marginLeft: 5,
    fontSize: 12,
  },
  sunIcon: {
    backgroundColor: '#16A34A',
    padding: 12,
    borderRadius: 12,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 35,
    textAlign: 'center',
  },
  subtitle: {
    color: '#5C5C5C',
    textAlign: 'center',
    marginBottom: 30,
  },
  scanButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 45,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '30%',
    alignItems: 'center',
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: "#16A34A",
  },
  cardText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    color: '#2C2C2C',
    paddingHorizontal: 6,
  },
});
