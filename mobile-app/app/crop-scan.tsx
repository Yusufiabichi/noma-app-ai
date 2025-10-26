// App.tsx
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
import { Camera, CameraCapturedPicture } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function CropScan() {
  const cameraRef = useRef<Camera | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [taking, setTaking] = useState(false);
  const [photo, setPhoto] = useState<CameraCapturedPicture | { uri: string } | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      // If you want to show/use gallery also request media library permission for image picker
      if (Platform.OS !== 'web') {
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        // not strictly required to proceed, but informed
        if (mediaStatus !== 'granted') {
          // user denied gallery but camera can still work
          console.log('No gallery permission');
        }
      }
    })();
  }, []);

  async function takePicture() {
    if (!cameraRef.current || taking) return;
    setTaking(true);
    try {
      const options = { quality: 0.8, skipProcessing: true, base64: false } as const;
      const photoTaken = await cameraRef.current.takePictureAsync(options);
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
      if (!result.cancelled) {
        setPhoto({ uri: result.uri } as any);
        setPreviewVisible(true);
      }
    } catch (err) {
      console.error('openGallery error', err);
    }
  }

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ textAlign: 'center', marginBottom: 12 }}>
          Camera permission is required. Please enable it in settings.
        </Text>
        <TouchableOpacity
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraWrapper}>
        <Camera
          ref={(ref) => (cameraRef.current = ref)}
          style={styles.camera}
          onCameraReady={() => setIsCameraReady(true)}
          ratio="16:9"
        />

        {/* Overlay: rounded rectangle */}
        <View pointerEvents="none" style={styles.overlayContainer}>
          <View style={styles.overlayInner}>
            {/* inner transparent frame */}
            <View style={styles.frame} />
          </View>
        </View>

        {/* Hint bubble at bottom-left above shutter */}
        <View style={styles.hintBubble}>
          <Text style={styles.hintText}>NomaApp works with crops only 😎</Text>
        </View>

        {/* Top-left back (optional) and top-right help */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={() => {router.push("./")}}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              Alert.alert(
                'Scan tips',
                'Make sure the leaf or plant fills the white frame, avoid strong backlight, and hold the camera steady.'
              )
            }
          >
            <Ionicons name="help-circle-outline" size={26} color="white" />
          </TouchableOpacity>
        </View>

        {/* Bottom control bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={openGallery} style={styles.sideButton}>
            <Ionicons name="images-outline" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={takePicture}
            style={styles.shutterButton}
            disabled={!isCameraReady || taking}
            accessibilityLabel="Shutter"
          >
            <View style={[styles.shutterOuter, taking && { opacity: 0.6 }]}>
              <View style={styles.shutterInner} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              // optional: toggle flash or switch camera
              Alert.alert('Info', 'Implement flash or camera switch here if you want.');
            }}
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
              <Text style={{ color: '#111', fontWeight: '600' }}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.previewButton, { backgroundColor: '#1a73e8' }]}
              onPress={() => {
                // TODO: send image to classification / upload endpoint
                Alert.alert('Next', 'Send this image to your crop diagnosis pipeline (implement upload).');
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Use photo</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* -------------------------
   Styles
   ------------------------- */
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
    aspectRatio: 4 / 5, // adjust shape of frame (taller or wider)
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
    paddingVertical: 12,
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
