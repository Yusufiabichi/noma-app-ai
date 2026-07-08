import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useLanguage } from '@/src/context/LanguageContext';
import { SafeAreaView } from "react-native-safe-area-context";
import { isOnline } from '@/src/utils/network';
import { syncPendingScans } from '@/src/services/syncService';
import * as localScanService from '@/src/services/localScanService';
import logger from '@/src/utils/logger';
import { useAuth } from '@/src/hooks/useAuth';
import { getLanguageCode } from '@/src/utils/useLanguageCode'
import IssueCard from '@/app/components/IssueCard';


interface ScanResult {
  status?: string;
  disease?: string;
  name?: string;
  cropType?: string;
  cropDetected?: string;
  confidence?: number;
  severity?: string;
  recommendations?: string[];
  futurePrevention?: string[];
  language?: string;
  isOnline?: boolean;
  isFallback?: boolean;
  localScanId?: string;
  scanId?: string;
}

const TreatmentRecommendationScreen = () => {
  const params = useLocalSearchParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const CONFIDENCE_THRESHOLD = 0.6;
  const isLowConfidence = scanResult
    ? (scanResult.confidence ?? 0) < CONFIDENCE_THRESHOLD
    : false;
  const languageCode = useMemo(() => {
          return language === 'hausa' ? 'ha' : 'en';
    }, [language]);

  useEffect(() => {
    const loadScanResult = async () => {
      try {
        if (params.scanResult) {
          let result: ScanResult;

          if (typeof params.scanResult === 'string') {
            try {
              result = JSON.parse(params.scanResult);
            } catch (e) {
              logger.error('Failed to parse scanResult string', { value: params.scanResult });
              throw new Error('Invalid scan result format');
            }
          } else {
            result = params.scanResult as unknown as ScanResult;
          }

          setScanResult(result);

          // If offline/pending, show pending UI
          if (result.status === 'pending') {
            setIsPending(true);
          }
        }
      } catch (error: any) {
        logger.error('Failed to load scan result', {
          message: error.message,
          params: params.scanResult
        });
        Alert.alert('Error', 'Failed to load scan results: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }

    };

    loadScanResult();
  }, [params.scanResult]);

  const handleSyncNow = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    setSyncError(null);

    try {
      const online = await isOnline();
      if (!online) {
        setSyncError('Device is still offline');
        return;
      }

      // Call sync service
      const result = await syncPendingScans(user.id);
      
      if (result.synced > 0) {
        // Reload the scan result
        const updatedScan = await localScanService.getScanById(scanResult?.localScanId);
        if (updatedScan) {
          setScanResult({
            isOnline: true,
            disease: updatedScan.disease,
            name: updatedScan.diseaseName, // Use name stored from backend
            cropType: updatedScan.cropDetected,
            confidence: updatedScan.confidence,
            severity: updatedScan.severity,
            recommendations: updatedScan.parseRecommendations(),
            futurePrevention: updatedScan.parseFuturePrevention(),
            isFallback: updatedScan.isFallback,
          });

          setIsPending(false);
          Alert.alert('Success', 'Scan analysis complete!');
        }
      } else if (result.failed > 0) {
        setSyncError('Analysis failed. Please try again later.');
      }
    } catch (error) {
      logger.error('Sync failed', error);
      setSyncError(error.message || 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#000" size="large" />
        <Text style={{ color: "#000", fontSize: 15 }}>
          {isPending ? 'Your scan is pending analysis...' : 'Our AI Model is analysing the picture.....'}
        </Text>
      </View>
    );
  }

  // Pending analysis UI
  if (isPending || scanResult?.status === 'pending') {
    return (
      <SafeAreaView edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>Analysis Pending</Text>

          <View style={styles.pendingCard}>
            <Ionicons name="cloud-offline-outline" size={64} color="#ffb347" />
            <Text style={styles.pendingTitle}>Device Offline</Text>
            <Text style={styles.pendingInfo}>
              Your scan has been saved locally and is waiting for analysis.
            </Text>
            <Text style={styles.pendingSubInfo}>
              {languageCode === 'ha'
                ? 'Hada wayarka da intanet don ci gaba da bincike.'
                : 'Connect to the internet for immediate analysis, or analysis will proceed automatically when you are back online.'}
            </Text>

            <View style={styles.cropInfo}>
              <Text style={styles.cropLabel}>Crop Type:</Text>
              <Text style={styles.cropValue}>{scanResult?.cropType || 'Not specified'}</Text>
            </View>

            {syncError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{syncError}</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.syncButton}
              onPress={handleSyncNow}
              disabled={loading}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="white" />
              <Text style={styles.buttonText}>
                {loading ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.push('./')}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Analysis complete UI
  if (!scanResult?.disease) {
    return (
      <SafeAreaView>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>No Results</Text>
          <View style={styles.issueCard}>
            <Text style={styles.issueTitle}>No analysis results available</Text>
          </View>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => router.push('./')}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }



  return (
    <SafeAreaView edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Analysis Results</Text>

        {/* Detected Issue */}
        <IssueCard
          diseaseName={scanResult?.name || scanResult?.disease || 'Unknown issue'}
          cropType={scanResult?.cropDetected || scanResult?.cropType || 'Unknown crop'}
          confidence={scanResult?.confidence || 0}
          severity={scanResult?.severity}
        />

        {/* Low Confidence Warning Banner */}
          {isLowConfidence && (
            <View style={styles.lowConfidenceBanner}>
              <Ionicons name="alert-circle-outline" size={22} color="#7c4a00" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.lowConfidenceTitle}>
                  {languageCode === 'ha' ? 'Rashin Tabbas' : 'Low Confidence Result'}
                </Text>
                <Text style={styles.lowConfidenceText}>
                  {languageCode === 'ha'
                    ? 'Ingancin binciken ya yi ƙasa da kashi 60%. Don Allah tuntubi ƙwararren masanin aikin gona don tabbataccen bayani.'
                    : 'Our model is less than 60% confident in this diagnosis. Please consult an agronomist for an accurate assessment before taking action.'}
                </Text>
              </View>
            </View>
          )}

          {scanResult?.isFallback && !isLowConfidence && (
              <View style={styles.fallbackBanner}>
                <Ionicons name="information-circle-outline" size={18} color="#7c4a00" />
                <Text style={styles.fallbackText}>
                  {languageCode === 'ha'
                    ? 'Ba mu sami bayanan wannan cuta a cikin kundin mu ba. Muna bada shawarar tintubar Masana.'
                    : 'Specific data for this disease is not yet in our database. Showing general recommendations — consult an agronomist for targeted advice.'}
                </Text>
              </View>
            )}

        {/* Recommended Treatment */}
        {!isLowConfidence && scanResult?.recommendations && scanResult.recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medkit-outline" size={20} color="#2e7d32" />
              <Text style={styles.sectionTitle}>
                {languageCode === 'ha' ? 'Yi wannan Yanzu' : 'Recommended Treatment'}
              </Text>
            </View>
            {scanResult.recommendations.map((item, index) => (
              <View key={index} style={styles.listContainer}>
                <View style={styles.listHeader}>
                  <View style={styles.listNumberBox}>
                    <Text style={styles.listNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Show this instead of recommendations when confidence is low */}
        {isLowConfidence && (
          <View style={styles.expertPromptCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={32} color="#0052cc" />
            <Text style={styles.expertPromptTitle}>
              {languageCode === 'ha' ? 'Tuntubi Ƙwararru' : 'Expert Consultation Needed'}
            </Text>
            <Text style={styles.expertPromptText}>
              {languageCode === 'ha'
                ? 'Bamu da tabbacin sakamakon binciken da mukayi akan shukarku. Yi magana da ƙwararren masanin don samun ingantacciyar shawara.'
                : 'The scan result is uncertain. Chat with a certified agronomist to get accurate treatment advice for your crop.'}
            </Text>
          </View>
        )}

        {/* Future Prevention */}
        {!isLowConfidence && scanResult?.futurePrevention && scanResult.futurePrevention.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#0052cc" />
              <Text style={styles.sectionTitle}>
                {languageCode === 'ha' ? 'Hanyoyin Rigakafi' : 'Future Prevention'}
              </Text>
            </View>

            {scanResult.futurePrevention.map((item, index) => (
              <View key={index} style={styles.listContainer}>
                <View style={styles.listHeader}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#2e7d32" />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
              style={[
                styles.confirmButton,
                isLowConfidence && styles.confirmButtonDisabled,
                scanResult?.isFallback && styles.confirmButtonDisabled,
              ]}
              onPress={() => router.push('./')}
              disabled={isLowConfidence, scanResult?.isFallback}
            >
            <Text style={styles.buttonText}>
              {languageCode === 'ha' ? "Zanyi wannan" : "I will do this"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.expertButton,
            isLowConfidence && styles.expertButtonHighlighted,
            ]}
            onPress={() => router.push('../(tabs)/expertChat')}
          >
            <Text style={styles.buttonText}>
              {languageCode === "ha" ? "Tambayi Kwararru" : "Ask Expert"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  loader: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f0fff4' 
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
    color: "#111",
  },
fallbackBanner: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  backgroundColor: '#fff8e1',
  borderWidth: 1,
  borderColor: '#ffe0b2',
  borderRadius: 10,
  padding: 12,
  marginBottom: 16,
  gap: 8,
},
fallbackText: {
  flex: 1,
  fontSize: 13,
  color: '#7c4a00',
  lineHeight: 18,
},
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginLeft: 6,
  },
  listContainer: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  listNumberBox: {
    backgroundColor: "#e8f5e9",
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  listNumber: {
    fontWeight: "700",
    color: "#16A34A",
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10,
  },
  expertButton: {
    flex: 1,
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  syncButton: {
    flex: 1,
    backgroundColor: "#0052cc",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginRight: 10,
  },
  backButton: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  pendingCard: {
    backgroundColor: "#fff8e1",
    borderWidth: 1,
    borderColor: "#ffe0b2",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ff8f00",
    marginTop: 12,
    marginBottom: 8,
  },
  pendingInfo: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  pendingSubInfo: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  cropInfo: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: "100%",
  },
  cropLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  cropValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textTransform: "capitalize",
  },
  errorBox: {
    backgroundColor: "#ffebee",
    borderColor: "#ef5350",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignSelf: "stretch",
  },
  errorText: {
    color: "#c62828",
    fontSize: 12,
    textAlign: "center",
  },
lowConfidenceBanner: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  backgroundColor: '#fff3e0',
  borderWidth: 1,
  borderColor: '#ffb74d',
  borderRadius: 12,
  padding: 14,
  marginBottom: 20,
},
lowConfidenceTitle: {
  fontSize: 15,
  fontWeight: '700',
  color: '#7c4a00',
  marginBottom: 4,
},
lowConfidenceText: {
  fontSize: 13,
  color: '#7c4a00',
  lineHeight: 18,
},
expertPromptCard: {
  alignItems: 'center',
  backgroundColor: '#e8f0fe',
  borderWidth: 1,
  borderColor: '#b3c8f5',
  borderRadius: 12,
  padding: 24,
  marginBottom: 25,
},
expertPromptTitle: {
  fontSize: 17,
  fontWeight: '700',
  color: '#0052cc',
  marginTop: 12,
  marginBottom: 8,
},
expertPromptText: {
  fontSize: 14,
  color: '#0052cc',
  textAlign: 'center',
  lineHeight: 20,
},
confirmButtonDisabled: {
  backgroundColor: '#b0bec5',  // greyed out
},
expertButtonHighlighted: {
  backgroundColor: '#0041a8',  // darker blue, more prominent
},
});

export default TreatmentRecommendationScreen;
