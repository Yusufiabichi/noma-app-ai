// app/index.js
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { router } from 'expo-router';
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
  const { user } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);



 if (user?.role === 'admin')  return <AdminDashboard />;
 if (user?.role === 'expert') return <ExpertHomeView userName={user?.name || ''} />;
 if (user?.role === 'farmer') return <FarmerHomeScreen />;


  return (
    <ScrollView>
    </ScrollView>
  );
}

