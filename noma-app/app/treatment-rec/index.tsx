import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { LanguageProvider, useLanguage } from '../../src/context/LanguageContext';
import { SafeAreaView } from "react-native-safe-area-context";
import { isOnline } from '@/src/utils/network';
import { syncPendingScans } from '@/src/services/syncService';
import * as localScanService from '@/src/services/localScanService';
import logger from '@/src/utils/logger';
import { useAuth } from '@/src/hooks/useAuth';
import { getById } from '../../src/data/useTreatment.js';

interface ScanResult {
  status?: string;
  disease?: string;
  cropType?: string;
  cropDetected?: string;
  confidence?: number;
  severity?: string;
  recommendations?: string[];
  futurePrevention?: string[];
  language?: string;
  isOnline?: boolean;
  localScanId?: string;
  scanId?: string;
}

const TreatmentRecommendationScreen = () => {
  const params = useLocalSearchParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [treatmentData, setTreatmentData] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const loadScanResult = async () => {
      try {
        if (params.scanResult) {
          const result = JSON.parse(params.scanResult as string);
          setScanResult(result);
          
          // If online and we have disease, try to get treatment data
          if (result.isOnline && result.disease) {
            const treatData = getById(result.disease);
            if (treatData) {
              setTreatmentData(treatData);
            }
          }
          
          // If offline/pending, show pending UI
          if (result.status === 'pending') {
            setIsPending(true);
          }
        }
      } catch (error) {
        logger.error('Failed to load scan result', error);
        Alert.alert('Error', 'Failed to load scan results');
      } finally {
        setLoading(false);
      }
    };

    loadScanResult();
  }, [params]);

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
            cropType: updatedScan.cropDetected,
            confidence: updatedScan.confidence,
            severity: updatedScan.severity,
            recommendations: updatedScan.parseRecommendations(),
            futurePrevention: updatedScan.parseFuturePrevention(),
          });
          
          const treatData = getById(updatedScan.disease);
          if (treatData) {
            setTreatmentData(treatData);
          }
          
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
              {language === 'hausa' 
                ? 'Jiya wayyo intaneciyin zuwa ta ci gaba da bincike.'
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
        <View style={styles.issueCard}>
          <View style={styles.issueHeader}>
            <Ionicons name="warning-outline" size={20} color="#c0392b" />
            <Text style={styles.issueLabel}>
              {language === 'hausa' ? 'Matsalar da Muka Gano' : 'Detected Issue'}
            </Text>
          </View>
          <Text style={styles.issueTitle}>
            {language === 'english' ? treatmentData?.name_en : treatmentData?.name_ha || scanResult.disease}
          </Text>
          <Text style={styles.issueCrop}>Crop: {scanResult?.cropDetected || scanResult?.cropType}</Text>
          <Text style={styles.issueInfo}>
            {`Confidence: ${Math.round((scanResult?.confidence || 0) * 100)}% • Severity: ${scanResult?.severity || 'unknown'}`}
          </Text>
        </View>

        {/* Recommended Treatment */}
        {scanResult?.recommendations && scanResult.recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medkit-outline" size={20} color="#2e7d32" />
              <Text style={styles.sectionTitle}>
                {language === 'hausa' ? 'Yi wannan Yanzu' : 'Recommended Treatment'}
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

        {/* Future Prevention */}
        {scanResult?.futurePrevention && scanResult.futurePrevention.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#0052cc" />
              <Text style={styles.sectionTitle}>
                {language === 'hausa' ? 'Hanyoyin Rigakafi' : 'Future Prevention'}
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
            style={styles.confirmButton}
            onPress={() => router.push('./')}
          >
            <Text style={styles.buttonText}>
              {language === 'hausa' ? "Zanyi wannan" : "I will do this"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.expertButton}
            onPress={() => router.push('./')}
          >
            <Text style={styles.buttonText}>
              {language === "hausa" ? "Tambayi Kwararru" : "Ask Expert"}
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
  issueCard: {
    backgroundColor: "#fdecea",
    borderWidth: 1,
    borderColor: "#f5c6cb",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  issueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  issueLabel: {
    color: "#c0392b",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 5,
  },
  issueTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#b22222",
    marginBottom: 5,
  },
  issueCrop: {
    fontSize: 16,
    fontWeight: "500",
    color: "#b34b4b",
  },
  issueInfo: {
    fontSize: 14,
    color: "#b34b4b",
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
});

export default TreatmentRecommendationScreen;
