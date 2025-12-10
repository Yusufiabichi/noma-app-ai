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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// import Tflite from 'tflite-react-native';
import { TensorFlowLiteModel } from 'expo-tensorflow-lite';

// Initialize TensorFlow Lite model (assuming model file is in assets folder)

export default function CropScan() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [taking, setTaking] = useState(false);
  const [photo, setPhoto] = useState<CameraCapturedPicture | { uri: string } | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

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
              <Image source={{ uri: (photo as any).uri }} style={{ flex: 1, resizeMode: 'contain' }} />
            ) : (
              <View style={styles.center}>
                <Text style={{ color: 'white' }}>No image</Text>
              </View>
            )}
          </View>

          <View style={styles.previewFooter}>
            <TouchableOpacity
              style={[styles.previewButton, { backgroundColor: '#fff' }]}
              onPress={() => setPreviewVisible(false)}
            >
              <Text style={{ color: '#111', fontWeight: '600' }}>
                <Ionicons name="arrow-back" size={20} color="#000" />
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.previewButton, { backgroundColor: '#16A34A' }]}
              onPress={() =>
                // Alert.alert('Next', 'AI Model Integration.')
                router.replace('./treatment-rec')
                // console.log("button clicked")
              }
            >
              <Text>
                <Ionicons name="checkmark" size={20} color="#fff" />
              </Text>
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
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontWeight: '700' },
});
