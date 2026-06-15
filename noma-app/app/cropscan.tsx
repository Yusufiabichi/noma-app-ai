import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  FlatList,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import { useAuth } from '@/src/hooks/useAuth';
import client from '@/src/api/client';
import * as localScanService from '@/src/services/localScanService';
import { isOnline } from '@/src/utils/network';
import logger from '@/src/utils/logger';
import { createScan } from '@/src/api/scans.api'
import { pollUntilDiagnosed } from '@/src/utils/pollScan'
import { getLanguageCode } from '@/src/utils/useLanguageCode'

const CROPS = [
  { id: 'maize', name: 'Maize', scientificName: 'Masara', category: 'Cereals' },
  { id: 'rice', name: 'Rice', scientificName: 'shinkafa', category: 'Cereals' },
  { id: 'tomato', name: 'Tomato', scientificName: 'Tumatur', category: 'Vegetables' },
  { id: 'beans', name: 'Beans', scientificName: 'Wake', category: 'Legumes' },
  { id: 'cassava', name: 'Cassava', scientificName: 'Rogo', category: 'Tubers' },
  { id: 'cabbage', name: 'Cabbage', scientificName: 'Kabeji', category: 'Vegetables' },
  { id: 'cucumber', name: 'Cucumber', scientificName: 'Kokomba', category: 'Vegetables' },
  { id: 'onion', name: 'Onion', scientificName: 'Albasa', category: 'Vegetables' },
  { id: 'yam', name: 'Yam', scientificName: 'Doya', category: 'Tubers' },
  { id: 'potato', name: 'Potato', scientificName: 'Dankali', category: 'Tubers' },
  { id: 'other', name: 'Other', scientificName: 'Sauransu', category: 'Other' },
];

const CATEGORIES = [
  { id: 'all', label: 'All Crops', icon: 'leaf-outline' },
  { id: 'Cereals', label: 'Cereals', icon: 'nutrition-outline' },
  { id: 'Vegetables', label: 'Vegetables', icon: 'leaf-outline' },
  { id: 'Legumes', label: 'Legumes', icon: 'nutrition-outline' },
  { id: 'Tubers', label: 'Tubers', icon: 'color-filter-outline' },
];

export default function CropScan() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user } = useAuth();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [taking, setTaking] = useState(false);
  const [photo, setPhoto] = useState<CameraCapturedPicture | { uri: string } | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const crop_type = ['tomato', 'rice', 'beans', 'maize', 'other'];
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<'uploading' | 'analyzing' | null>(null);
  const languageCode = useMemo(() => {
        return language === 'hausa' ? 'ha' : 'en';
  }, [language]);


  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const filteredCrops = useMemo(() => {
    return CROPS.filter(crop => {
      const matchesCategory = selectedCategory === 'all' || crop.category === selectedCategory;
      const matchesSearch = crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crop.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  async function takePicture() {
    if (!cameraRef.current || taking) return;
    setTaking(true);
    try {
      const photoTaken = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });
      setPhoto(photoTaken);
      setPreviewVisible(true);
    } catch (err) {
      console.error('takePicture error', err);
      Alert.alert('Error', 'Could not take photo. Try again.');
    } finally {
      setTaking(false);
    }
  }

  async function imgCrop(){
    if (!selectedCrop) {
      Alert.alert('Error', 'Please select a crop type');
      return;
    }

    if (!photo?.uri) {
      Alert.alert('Error', 'No image selected');
      return;
    }

    setProcessingStep('uploading');
    setIsProcessing(true);

    try {
      const online = await isOnline();
      
      if (online) {
        logger.info('Device is online, processing scan immediately');
        await processScanOnline((photo as any).uri, selectedCrop);
      } else {
        logger.info('Device is offline, saving scan locally');
        await processScanOffline((photo as any).uri, selectedCrop);
      }
    } catch (error: any) {
      logger.error('Error processing scan', error);
      // Detailed debug logs for production troubleshooting
      console.log("--- SCAN ERROR DEBUG ---");
      console.log("TYPE:", error.name);
      console.log("MESSAGE:", error.message);
      console.log("STATUS CODE:", error.statusCode);
      console.log("SERVER RESPONSE:", error.originalError?.response?.data);
      console.log("------------------------");

      Alert.alert('Error', error.message || 'Failed to process scan');
      // Reset processing state on error so user can try again
      setIsProcessing(false);
      setProcessingStep(null);
    }
  }

  async function processScanOnline(imageUri: string, cropType: string) {
    try {
      logger.info('Starting online scan upload...');
      const freshLanguageCode = await getLanguageCode();

      const response = await createScan({
        imageUri,
        cropType,
        language: freshLanguageCode,
      });
      
      logger.info('Upload complete. Response:', response);

      const pendingScan = response?.data?.scan || response?.scan;

      if (!pendingScan) {
        throw new Error('Received empty response from server after upload');
      }

      const scanId = pendingScan._id;
      logger.info('Scan Created successfully', { scanId });

      // SWITCH TO ANALYZING STATE
      setProcessingStep('analyzing');
      logger.info('State changed to: analyzing');

      const diagnosedScan = await pollUntilDiagnosed(scanId);

      logger.info('Diagnosis complete!', {
          scanId,
          disease: diagnosedScan.diagnosis?.disease || diagnosedScan.disease,
      });

      // Prepare result for navigation
      const resultData = {
        disease:          diagnosedScan.diagnosis?.disease || diagnosedScan.disease,
        name:             diagnosedScan.diagnosis?.name || diagnosedScan.name,
        cropType:         diagnosedScan.cropType,
        confidence:       diagnosedScan.diagnosis?.confidence || diagnosedScan.confidence,
        severity:         diagnosedScan.diagnosis?.severity || diagnosedScan.severity,
        recommendations:  diagnosedScan.diagnosis?.recommendations || diagnosedScan.recommendations || [],
        futurePrevention: diagnosedScan.diagnosis?.futurePrevention || diagnosedScan.futurePrevention || [],
        isFallback:       diagnosedScan.diagnosis?.isFallback ?? false,
        language:         diagnosedScan.diagnosis?.language || diagnosedScan.language || languageCode,
        isOnline:         true,
        scanId:           diagnosedScan._id,
      };

      router.replace({
        pathname: './treatment-rec',
        params: {
          scanResult: JSON.stringify(resultData),
        },
      });
    } catch (error: any) {
      logger.error('processScanOnline failed', error);
      throw error;
    }
  }

  async function processScanOffline(imageUri: string, cropType: string) {
    try {
      // Save image locally
      const localImageUri = await localScanService.saveImageLocally(imageUri);
      
      // Create scan record with pending status
      const scan = await localScanService.createLocalScan({
        userId: user?.id || 'offline-user',
        imageUri: localImageUri,
        cropType,
      });

      logger.info('Local scan created', { scanId: scan.id });

      // Navigate to treatment recommendations showing pending status
      router.replace({
        pathname: './treatment-rec',
        params: {
          scanResult: JSON.stringify({
            status: 'pending',
            cropType,
            language,
            isOnline: false,
            localScanId: scan.id,
            isFallback: diagnosedScan.diagnosis?.isFallback ?? false,
          }),
        },
      });
    } catch (error: any) {
      logger.error('Offline scan processing failed', error);
      throw error;
    }
  }

  async function openGallery() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      const canceled = (result as any).canceled ?? (result as any).cancelled ?? false;
      if (!canceled) {
        const uri =
          (result as any).assets?.[0]?.uri || (result as any).uri || null;
        if (uri) {
          setPhoto({ uri });
          setPreviewVisible(true);
        }
      }
    } catch (err) {
      console.error('openGallery error', err);
    }
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ textAlign: 'center', marginBottom: 12 }}>
          Camera permission is required. Please enable it in settings.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraWrapper}>
        {Platform.OS !== 'web' ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            onCameraReady={() => setIsCameraReady(true)}
          />
        ) : (
          <View
            style={[
              styles.camera,
              { alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
            ]}
          >
            <Text style={{ color: 'white' }}>Camera not available on web</Text>
          </View>
        )}

        {/* Overlay: frame */}
        <View pointerEvents="none" style={styles.overlayContainer}>
          <View style={styles.overlayInner}>
            <View style={styles.frame} />
          </View>
        </View>

        {/* Hint bubble */}
        <View style={styles.hintBubble}>
          <Text style={styles.hintText}>Place your crop's leaf in the frame</Text>
        </View>

        {/* Top controls */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('./')}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              Alert.alert(
                'Scan tips',
                'Ensure the leaf fills the frame and avoid strong backlight.'
              )
            }
          >
            <Ionicons name="help-circle-outline" size={26} color="white" />
          </TouchableOpacity>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={openGallery} style={styles.sideButton}>
            <Ionicons name="images-outline" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={takePicture}
            style={styles.shutterButton}
            disabled={!isCameraReady || taking}
          >
            <View style={[styles.shutterOuter, taking && { opacity: 0.6 }]}>
              <View style={styles.shutterInner} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Alert.alert('Info', 'Implement flash or camera switch here.')}
            style={styles.sideButton}
          >
            <Ionicons name="camera-reverse-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Preview modal */}
      <Modal visible={previewVisible} animationType="slide" onRequestClose={() => setPreviewVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
          <View style={{ flex: 1 }}>
            {photo ? (
              <View style={{ flex: 1 }}>
              <Image
                source={{ uri: (photo as any).uri }}
                style={{ flex: 1, resizeMode: 'contain' }}
              />

              {/* Step header */}
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
                <Text style={styles.stepTitle}>Select your crop</Text>
              </View>

              {/* Search */}
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={16} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search crops (e.g. Maize, Tomato, Cassava...)"
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Category pills */}
              <FlatList
                data={CATEGORIES}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedCategory(item.id)}
                    style={[styles.categoryPill, selectedCategory === item.id && styles.categoryPillActive]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={14}
                      color={selectedCategory === item.id ? '#fff' : '#6B7280'}
                    />
                    <Text style={[styles.categoryText, selectedCategory === item.id && styles.categoryTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />

              {/* Crop list */}
              <FlatList
                data={filteredCrops}
                keyExtractor={item => item.id}
                style={styles.cropList}
                renderItem={({ item }) => {
                  const isSelected = selectedCrop === item.id;
                  return (
                    <TouchableOpacity
                      onPress={() => setSelectedCrop(item.id)}
                      style={[styles.cropRow, isSelected && styles.cropRowSelected]}
                    >
                      <View>
                        <Text style={styles.cropName}>{item.name}</Text>
                        <Text style={styles.cropSci}>{item.scientificName}</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkCircle}>
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
            ) : (
              <View style={styles.center}>
                <Text style={{ color: 'white' }}>No image</Text>
              </View>
            )}
          </View>

          <View style={styles.previewFooter}>
            <TouchableOpacity
              style={[styles.previewButton, styles.previewButtonSecondary]}
              onPress={() => setPreviewVisible(false)}
              disabled={isProcessing}
            >
              <Ionicons name="arrow-back" size={18} color="#111" />
              <Text style={styles.previewButtonSecondaryText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.previewButton, styles.previewButtonPrimary, isProcessing && { opacity: 0.6 }]}
              onPress={imgCrop}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={[styles.previewButtonPrimaryText, { marginLeft: 8 }]}>
                    {processingStep == 'uploading' ? 'Uploading...' : 'Analyzing...'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.previewButtonPrimaryText}>Use Photo</Text>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraWrapper: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayInner: {
    width: '90%',
    aspectRatio: 4 / 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'transparent',
  },
  hintBubble: {
    position: 'absolute',
    left: 16,
    bottom: 120,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '80%',
  },
  hintText: { color: '#111', fontWeight: '600' },
  topBar: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    height: 88,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  previewButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  previewButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewButtonPrimary: {
    backgroundColor: '#16A34A',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  previewButtonSecondaryText: {
    color: '#111',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  previewButtonPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontWeight: '700' },
  cropItem: {
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.15)',
  marginRight: 10,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.3)',
},
cropItemSelected: {
  backgroundColor: '#16A34A',
  borderColor: '#16A34A',
},
cropText: {
  color: '#fff',
  fontWeight: '600',
},
cropTextSelected: {
  color: '#fff',
},
stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingBottom: 0 },
stepBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
stepBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
stepTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12, marginBottom: 0, borderWidth: 0.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#F9FAFB' },
searchInput: { flex: 1, fontSize: 14, color: '#111' },
categoryList: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 0.5, borderColor: '#E5E7EB' },
categoryPillActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
categoryText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
categoryTextActive: { color: '#fff' },
cropList: { flex: 1 },
cropRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
cropRowSelected: { backgroundColor: '#F0FDF4' },
cropName: { fontSize: 14, fontWeight: '600', color: '#111' },
cropSci: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginTop: 2 },
checkCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },

});
