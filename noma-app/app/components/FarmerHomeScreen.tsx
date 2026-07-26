import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/hooks/useAuth';
import { useLanguage } from '@/src/context/LanguageContext';
import WeatherCard from '@/app/components/WeatherCard';
import Data from '@/constants/data.json';

const FarmerHomeScreen = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

//   isExpert = user?.role === 'expert';
//   isFarmer = user?.role === 'farmer';

  const onRefresh = async () => {
    setRefreshing(true);
    // add any data refresh calls here if needed
    setRefreshing(false);
  };

  const lang = language === 'english' ? Data.en : Data.ha;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#16A34A"
          colors={["#16A34A"]}
        />
      }
    >
      {/* Weather Card */}
      <WeatherCard />

       {/* Welcome Message */}
        <Text style={styles.welcomeTitle}>
          {language === "english"
            ? `Welcome, ${user?.name || "Farmer"}!`
            : `Barka da Zuwa, ${user?.name || "Manomi"}!`}
        </Text>
        <Text style={styles.subtitle}>
          {language==="english" ? Data.en.home.welcome_subtitle: Data.ha.home.welcome_subtitle}
        </Text>

      {/* Scan Button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => router.push('/cropscan' as any)}
        activeOpacity={0.85}
      >
        <Ionicons name="camera" size={22} color="#fff" />
        <Text style={styles.scanText}>{lang.home.scan_text}</Text>
      </TouchableOpacity>

      {/* Quick Options */}
      {/* Quick Options */}
      <View style={styles.quickOptions}>
        {[
          {
            icon: 'time-outline',
            label: lang.home.quick_options?.history || 'Scan History',
            sub: 'View past diagnoses',
            onPress: () => router.push('../recentDiagnosis' as any),
            color: '#d97706',
            bg: '#fffbeb',
          },
          {
            icon: 'briefcase-outline',
            label: lang.home.quick_options?.cases || 'My Cases',
            sub: 'Track your cases',
            onPress: () => router.push('../farmerCases' as any),
            color: '#7c3aed',
            bg: '#f5f3ff',
          },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.quickCard, { backgroundColor: item.bg }]}
            onPress={item.onPress}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={styles.quickContent}>
              <Text style={[styles.quickLabel, { color: item.color }]}>{item.label}</Text>
              <Text style={styles.quickSub}>{item.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={item.color} style={styles.quickArrow} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFFB',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  scanButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 6,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    color: '#5C5C5C',
    textAlign: 'center',
    marginBottom: 15,
  },
  quickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  quickCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    backgroundColor: '#fff',
    minHeight: 90,
    marginBottom: 12,
    position: 'relative',
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickContent: {
    flex: 1,
  },
  quickLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  quickSub: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  quickArrow: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -8,
  },
});

export default FarmerHomeScreen;