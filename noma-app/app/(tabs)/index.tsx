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
import { getScans } from '@/src/api/scans.api';

const RECENT_SCANS_CACHE_KEY = '@nomaapp_recent_scans_cache';

export default function HomeScreen() {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [diagnosisHistory, setDiagnosisHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user?.role === 'farmer') {
      loadCachedHistory();
      fetchHistory();
    }
  }, [user]);

  const loadCachedHistory = async () => {
    try {
      const cacheKey = `${RECENT_SCANS_CACHE_KEY}_${user?._id || user?.id}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        setDiagnosisHistory(JSON.parse(cachedData));
      }
    } catch (error) {
      console.error('Failed to load cached diagnosis history', error);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await getScans({ limit: 3 });
      if (response.scans && Array.isArray(response.scans)) {
        const topThree = response.scans.slice(0, 3);
        setDiagnosisHistory(topThree);

        // Update Cache
        const cacheKey = `${RECENT_SCANS_CACHE_KEY}_${user?._id || user?.id}`;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(topThree));
      }
    } catch (error) {
      console.error('Failed to fetch diagnosis history', error);
    } finally {
      setLoadingHistory(false);
    }
  };

   if (user?.role === 'admin') {
     return <AdminDashboard />;
   }

   if (user?.role === 'expert') {
       return <ExpertHomeView userName={user?.name || 'Expert'} />;
   }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'english' ? 'en-US' : 'ha-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'diagnosed':
      case 'completed':
        return styles.completedBadge;
      case 'pending':
      case 'processing':
        return styles.pendingBadge;
      case 'failed':
        return styles.failedBadge;
      default:
        return styles.pendingBadge;
    }
  };

  const getStatusText = (status: string) => {
    if (language === 'hausa') {
      switch (status) {
        case 'diagnosed': return 'An kammala';
        case 'pending': return 'Ana jira';
        case 'processing': return 'Ana dubawa';
        case 'failed': return 'Ya gaza';
        default: return status;
      }
    }
    return status === 'diagnosed' ? 'completed' : status;
  };

  return (
    <ScrollView style={styles.container}>
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
      <TouchableOpacity style={styles.scanButton}
        onPress={()=> router.push("/cropscan")}
      >
        <FontAwesome name="camera" size={20} color="#fff" />
        <Text style={styles.scanText}>
            {language==="english" ? Data.en.home.scan_text : Data.ha.home.scan_text}
        </Text>
      </TouchableOpacity>

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

      {/* Recent Diagnosis History */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>
          {language === 'english' ? 'Recent diagnosis history' : 'Tarihin bincike na kwanan nan'}
        </Text>
      </View>

      <View style={styles.historyList}>
        {loadingHistory ? (
          <ActivityIndicator color="#16A34A" style={{ marginVertical: 20 }} />
        ) : !Array.isArray(diagnosisHistory) || diagnosisHistory.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>
              {language === 'english' ? 'No recent scans found' : 'Ba a sami tarihin bincike ba'}
            </Text>
          </View>
        ) : (
          diagnosisHistory.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.historyCard}
              onPress={() => {
                if (item.status === 'diagnosed') {
                  router.push({
                    pathname: '/treatment-rec',
                    params: {
                      scanResult: JSON.stringify({
                        disease: item.diagnosis?.disease,
                        name: item.diagnosis?.name,
                        cropType: item.cropType,
                        confidence: item.diagnosis?.confidence,
                        severity: item.diagnosis?.severity,
                        recommendations: item.diagnosis?.recommendations,
                        futurePrevention: item.diagnosis?.futurePrevention,
                        language: item.diagnosis?.language,
                        isOnline: true,
                        scanId: item._id,
                      })
                    }
                  });
                }
              }}
            >
              <View style={styles.historyRow}>
                <View style={styles.historyTextBlock}>
                  <Text style={styles.historyName}>
                    {item.diagnosis?.name || `${item.cropType.toUpperCase()} scan`}
                  </Text>
                  <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <View
                  style={[
                    styles.historyBadge,
                    getStatusBadge(item.status),
                  ]}
                >
                  <Text
                    style={[
                      styles.historyBadgeText,
                      item.status === 'failed' && styles.failedBadgeText,
                    ]}
                  >
                    {getStatusText(item.status)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
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
  historyHeader: {
    marginTop: 32,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#122C27',
    marginBottom: 4,
  },
  historySubtitle: {
    color: '#5C5C5C',
    fontSize: 13,
    lineHeight: 18,
  },
  historyList: {
    marginBottom: 20,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F5ED',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  historyTextBlock: {
    flex: 1,
    paddingRight: 10,
  },
  historyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#122C27',
  },
  historyDate: {
    marginTop: 4,
    fontSize: 12,
    color: '#7C8B88',
  },
  historyDetails: {
    color: '#5C5C5C',
    fontSize: 13,
    lineHeight: 19,
  },
  historyBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    minWidth: 90,
    alignItems: 'center',
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#13775A',
    textTransform: 'capitalize',
  },
  completedBadge: {
    backgroundColor: '#E3F8EE',
  },
  pendingBadge: {
    backgroundColor: '#FEF6E5',
  },
  failedBadge: {
    backgroundColor: '#F9E8E8',
  },
  failedBadgeText: {
    color: '#C62828',
  },
  emptyHistory: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8F5ED',
  },
  emptyHistoryText: {
    color: '#7C8B88',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
