import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from '@/src/hooks/useAuth';
import { useLanguage } from '@/src/context/LanguageContext';
import WeatherCard from '@/app/components/WeatherCard';
import Data from '@/constants/data.json';

const FarmerHomeScreen = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

  const isExpert = user?.role === 'expert';
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

        {/* Quick Action Row */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push('../recentDiagnosis' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: '#fffbeb' }]}>
              <Ionicons name="time-outline" size={20} color="#d97706" />
            </View>
            <Text style={styles.quickBtnLabel}>Scan History</Text>
            <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.quickDivider} />

          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => (
                isExpert ? router.push('../expertCases' as any) : router.push('../farmerCases' as any)
            )}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="briefcase-outline" size={20} color="#2563eb" />
            </View>
            <Text style={styles.quickBtnLabel}>My Cases</Text>
            <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Quick Options */}
        <View style={styles.cardRow}>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/fertilizer-advice")}
            activeOpacity={0.85}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#F0FDF4' }]}>
              <MaterialCommunityIcons name="spray-bottle" size={26} color="#16A34A" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardText}>
                {language === "english" ? Data.en.home.cards_text[0] : Data.ha.home.cards_text[0]}
              </Text>
              <Text style={styles.cardSub}>Soil nutrients</Text>
            </View>
            <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/disease-guide")}
            activeOpacity={0.85}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#FEF2F2' }]}>
              <MaterialIcons name="pest-control" size={26} color="#DC2626" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardText}>
                {language === "english" ? Data.en.home.cards_text[1] : Data.ha.home.cards_text[1]}
              </Text>
              <Text style={styles.cardSub}>Pest control</Text>
            </View>
            <View style={[styles.dot, { backgroundColor: '#DC2626' }]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/farming-tips")}
            activeOpacity={0.85}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
              <FontAwesome5 name="leaf" size={24} color="#2563EB" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardText}>
                {language === "english" ? Data.en.home.cards_text[2] : Data.ha.home.cards_text[2]}
              </Text>
              <Text style={styles.cardSub}>Best practices</Text>
            </View>
            <View style={[styles.dot, { backgroundColor: '#2563EB' }]} />
          </TouchableOpacity>

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
  quickRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 25,
    overflow: 'hidden',
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  quickDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 10,
  },

cardRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 20,
  gap: 10,
},
card: {
  backgroundColor: '#fff',
  borderRadius: 18,
  flex: 1,
  alignItems: 'center',
  paddingVertical: 18,
  paddingHorizontal: 8,
  borderWidth: 0.5,
  borderColor: '#E5E7EB',
  elevation: 2,
  shadowColor: '#000',
  shadowOpacity: 0.04,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  gap: 10,
},
iconWrap: {
  width: 52,
  height: 52,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
},
cardBody: {
  alignItems: 'center',
  gap: 3,
},
cardText: {
  fontSize: 13,
  fontWeight: '600',
  textAlign: 'center',
  color: '#111827',
  paddingHorizontal: 4,
},
cardSub: {
  fontSize: 11,
  color: '#9CA3AF',
  textAlign: 'center',
},
dot: {
  width: 6,
  height: 6,
  borderRadius: 3,
},

});

export default FarmerHomeScreen;