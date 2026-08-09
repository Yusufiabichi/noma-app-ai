// app/index.js
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { router, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/src/context/LanguageContext';
import { useAuth } from '@/src/hooks/useAuth';
import Data from '@/constants/data.json'
import WeatherCard from '../components/WeatherCard';
import AdminDashboard from '../(admin)/adminDashboard'
import ExpertHomeView from '../(expert)/expertHomeView';
import FarmerHomeScreen from '@/app/components/FarmerHomeScreen';

const RECENT_SCANS_CACHE_KEY = '@nomaapp_recent_scans_cache';

export default function HomeScreen() {
  const { language, setLanguage } = useLanguage();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

useEffect(() => {
  // If not loading and no user — redirect to login
  if (!loading && !user) {
    router.replace('../(onboarding)/login');
  }
}, [user, loading]);

if (loading || !user) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FFFB' }}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
}


 if (user?.role === 'admin')  return <AdminDashboard />;
 if (user?.role === 'expert') return <ExpertHomeView userName={user?.name || ''} />;
 if (user?.role === 'farmer') return <FarmerHomeScreen />;


  return (
    <ScrollView>
    </ScrollView>
  );
}

