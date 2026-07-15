import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  FontAwesome,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth, setUserData } from '@/src/hooks/useAuth';
import Data from '@/constants/data.json'
import { getCurrentUser } from '@/src/api/auth.api';
import { getVerificationStatus, getExpertCases} from '@/src/api/expert.api';
import WeatherCard from '@/app/components/WeatherCard'
import { useLanguage } from '@/src/context/LanguageContext';
// Implement GetExpertCases function in the api

interface Performance {
  casesHandled: number;
  averageRating: number;
  trialCasesRemaining: number;
}

interface ExpertProfile {
  overallStatus: string;
  currentStage: string;
  performance: Performance;
}

interface Case {
  _id: string;
  farmerName?: string;
  status: string;
  // ... other fields
}

export default function ExpertDashboard() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
      try {
        const res = await getVerificationStatus();
        setProfile(res.data.profile);
      } catch (err) {
        console.error("Failed to fetch verification status:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  useEffect(() => {
    fetchStatus();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16A34A" />

        {/* Scan Button */}
          <TouchableOpacity style={styles.scanButton}
            onPress={()=> router.push("/cropscan")}
          >
            <FontAwesome name="camera" size={20} color="#fff" />
            <Text style={styles.scanText}>
                {language==="english" ? Data.en.home.scan_text : Data.ha.home.scan_text}
            </Text>
          </TouchableOpacity>
      </View>
    );
  }

return (
    <View style={styles.container}>
     <WeatherCard />
    </View>
)

  const isApproved = profile?.overallStatus === 'approved';
  const isFullyApproved = isApproved && profile?.currentStage === 'complete';

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={fetchProfile}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }





  // ---- Not verified ----
  if (!isApproved) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Expert Account Not Verified</Text>
        <Text style={styles.subText}>
          Your expert account is pending verification. Please complete your profile
          verification to access expert tools.
        </Text>
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={() => router.push('/(expert)/dashboard')}
        >
          <Text style={styles.verifyButtonText}>Verify Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---- Partially verified (approved but not complete) ----
  if (!isApproved) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Verification Incomplete</Text>
        <Text style={styles.subText}>
          Your profile is approved but some steps are pending. Please complete your
          profile setup.
        </Text>
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={() => router.push('/(expert)/dashboard')}
        >
          <Text style={styles.verifyButtonText}>Complete Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---- Fully verified: show dashboard ----
  if(!isFullyApproved){
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.welcome}>
        Welcome, {user?.name || 'Expert'}!
      </Text>

      {/* Performance Card */}
      <View style={styles.performanceCard}>
        <Text style={styles.sectionTitle}>Your Performance</Text>
        <View style={styles.perfRow}>
          <View style={styles.perfStat}>
            <Text style={styles.perfValue}>
              {profile?.performance?.casesHandled ?? 0}
            </Text>
            <Text style={styles.perfLabel}>Cases</Text>
          </View>
          <View style={styles.perfDivider} />
          <View style={styles.perfStat}>
            <Text style={styles.perfValue}>
              {profile?.performance?.averageRating?.toFixed(1) ?? '—'}
            </Text>
            <Text style={styles.perfLabel}>Avg Rating</Text>
          </View>
          <View style={styles.perfDivider} />
          <View style={styles.perfStat}>
            <Text style={styles.perfValue}>
              {profile?.performance?.trialCasesRemaining ?? 20}
            </Text>
            <Text style={styles.perfLabel}>Trial Left</Text>
          </View>
        </View>
      </View>

      {/* Cases Button */}
      <TouchableOpacity
        style={styles.casesButton}
        onPress={() => router.push('../(expert)/expertCases')}
      >
        <Text style={styles.casesButtonText}>View All Cases</Text>
      </TouchableOpacity>

      {/* Recent Cases (optional) */}
      {cases.length > 0 && (
        <View style={styles.recentCases}>
          <Text style={styles.sectionTitle}>Recent Cases</Text>
          {cases.slice(0, 3).map((item) => (
            <View key={item._id} style={styles.caseItem}>
              <Text style={styles.caseName}>{item.farmerName || 'Farmer'}</Text>
              <Text style={styles.caseStatus}>{item.status}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  ); }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFFB',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#c62828',
    fontSize: 16,
    textAlign: 'center',
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
  retryText: {
    color: '#16A34A',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '700',
    color: '#122C27',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#122C27',
    textAlign: 'center',
    marginBottom: 12,
  },
  subText: {
    fontSize: 16,
    color: '#5C5C5C',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  verifyButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F5ED',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#122C27',
    marginBottom: 16,
  },
  perfRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  perfStat: {
    alignItems: 'center',
  },
  perfValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#122C27',
  },
  perfLabel: {
    fontSize: 13,
    color: '#7C8B88',
    marginTop: 4,
  },
  perfDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E8F5ED',
  },
  casesButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  casesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  recentCases: {
    marginBottom: 30,
  },
  caseItem: {
    backgroundColor: '#F9F9F9',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#122C27',
  },
  caseStatus: {
    fontSize: 13,
    color: '#7C8B88',
    textTransform: 'capitalize',
  },
});