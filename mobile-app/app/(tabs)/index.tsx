// app/index.js
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { router } from 'expo-router';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Data from '../constants/data.json'


export default function HomeScreen() {
  const [wheather, setWeather] = useState(32);
  // const [language, setLanguage] = useState("ha")
  const { language, setLanguage } = useLanguage();
  // console.log(Data);
  return (
    
    <ScrollView style={styles.container}>
      {/* Location Card */}
      <View style={styles.locationCard}>
        <View>
          <Text style={styles.locationName}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#fff" />
            Kano, Nigeria
          </Text>
          <Text style={styles.temperature}>{wheather}°C</Text>
          {wheather >= 30 ? <Text style={styles.conditionText}>
            {language==="english" ? Data.en.condition_text[0]: Data.ha.condition_text[0]}
            </Text>: <Text style={styles.conditionText}>
              {language==="english" ? Data.en.condition_text[1]: Data.ha.condition_text[1]}
              </Text>}
          {wheather >= 30 ? 
          <View style={styles.statusBox}>
            <Text style={styles.statusRed}>
              {language==="english" ? Data.en.status_text.bad: Data.ha.status_text.bad}
            </Text>
          </View> :
          <View style={styles.statusBox}>
            <Feather name="check-square" size={16} color="#00B894" />
            <Text style={styles.statusText}>
              {language==="english" ? Data.en.status_text.good: Data.ha.status_text.good}
            </Text>
          </View> }
          
        </View>
        <View style={styles.sunIcon}>
          <Feather name="sun" size={28} color="#fff" />
        </View>
      </View>

      {/* Welcome Message */}
      <Text style={styles.welcomeTitle}>
        {language==="english" ? Data.en.welcome_title: Data.ha.welcome_title}
      </Text>
      <Text style={styles.subtitle}>
        {language==="english" ? Data.en.welcome_subtitle: Data.ha.welcome_subtitle}
      </Text>

      {/* Scan Button */}
      <TouchableOpacity style={styles.scanButton}
        onPress={()=> router.push("../crop-scan")}
      >
        <FontAwesome name="camera" size={20} color="#fff" />
        <Text style={styles.scanText}>
            {language==="english" ? Data.en.scan_text : Data.ha.scan_text}
        </Text>
      </TouchableOpacity>

      {/* Quick Options */}
      <View style={styles.cardRow}>
        <TouchableOpacity style={styles.card}
        onPress={()=> router.push("../fertilizer-advice")}>
          <MaterialCommunityIcons name="spray-bottle" size={30} color="#00B894" />
          <Text style={styles.cardText}>
            {language==="english" ? Data.en.cards_text[0] : Data.ha.cards_text[0]}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}
        onPress={()=> router.push("../disease-guide")}>
          <MaterialIcons name="pest-control" size={30} color="#c62828" />
          <Text style={styles.cardText}>
            {language==="english" ? Data.en.cards_text[1] : Data.ha.cards_text[1]}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}
        onPress={()=> router.push("../farming-tips")}>
          <FontAwesome5 name="leaf" size={28} color="#00B894" />
          <Text style={styles.cardText}>
            {language==="english" ? Data.en.cards_text[2]: Data.ha.cards_text[2]}
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
    backgroundColor: '#00B894',
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
    color: '#00B894',
    marginLeft: 5,
    fontSize: 12,
  },
  statusRed: {
    color: '#c62828',
    marginLeft: 5,
    fontSize: 12,
  },
  sunIcon: {
    backgroundColor: '#00A982',
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
    backgroundColor: '#00B894',
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
    borderColor: "#00B894",
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
