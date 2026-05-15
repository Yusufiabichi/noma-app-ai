import React, { useEffect, useRef, useState } from 'react';
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
  FlatList
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
  const [isProcessing, setIsProcessing] = useState(false);
  const crop_type = ['tomato', 'rice', 'beans', 'yam', 'other'];
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

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

    setIsProcessing(true);
    try {
      const online = await isOnline();
      
      if (online) {
        // Online flow: Upload and process immediately
        logger.info('Device is online, processing scan immediately');
        await processScanOnline((photo as any).uri, selectedCrop);
      } else {
        // Offline flow: Save locally and mark as pending
        logger.info('Device is offline, saving scan locally');
        await processScanOffline((photo as any).uri, selectedCrop);
      }
    } catch (error) {
      logger.error('Error processing scan', error);
      Alert.alert('Error', error.message || 'Failed to process scan');
    } finally {
      setIsProcessing(false);
    }
  }

  async function processScanOnline(imageUri: string, cropType: string) {
    try {
      // Show loading
      Alert.alert('Processing', 'Scanning image and analyzing...', [
        { text: 'Dismiss', onPress: () => {} }
      ], { cancelable: false });

      // Create form data with image
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: `scan-${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);
      formData.append('cropType', cropType);

      // Call AI inference endpoint
//       const response = await client.uploadFile('/infer', formData);
      const response = await createScan(formData);
      
      logger.info('Scan API successful', { disease: response.disease });

      // Navigate to treatment recommendations with results
//       router.replace({
//         pathname: './treatment-rec',
//         params: {
//           scanResult: JSON.stringify({
//             disease: response.disease,
//             cropType: response.cropType || cropType,
//             confidence: response.confidence,
//             severity: response.severity,
//             recommendations: response.recommendations,
//             futurePrevention: response.futurePrevention,
//             language,
//             isOnline: true,
//             scanId: response.scan_id,
//           }),
//         },
//       });
    } catch (error) {
//       logger.error('Online scan processing failed', error);
      logger.error("FULL ERROR:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });
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

              <View style={{ paddingVertical: 12 }}>
                <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 8 }}>
                  Select Crop Type
                </Text>

                <FlatList
                  data={crop_type}
                  keyExtractor={(item) => item}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 10 }}
                  renderItem={({ item }) => {
                    const isSelected = selectedCrop === item;

                    return (
                      <TouchableOpacity
                        onPress={() => setSelectedCrop(item)}
                        style={[
                          styles.cropItem,
                          isSelected && styles.cropItemSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.cropText,
                            isSelected && styles.cropTextSelected,
                          ]}
                        >
                          {item.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
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
                  <Text style={[styles.previewButtonPrimaryText, { marginLeft: 8 }]}>Processing...</Text>
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

});
