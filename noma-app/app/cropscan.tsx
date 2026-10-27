import CaptureGuideOverlay from '@/app/components/CaptureGuideOverlay';
import RequireAccess, { lockedMessage } from '@/app/components/RequireAccess';
import VoiceAssistantSheet from '@/app/components/VoiceAssistantSheet';
import AnalysingView from '@/app/components/scan/AnalysingView';
import ScanOutcomeView, { ScanEndState } from '@/app/components/scan/ScanOutcomeView';
import SeverityStep, { SeverityChoice } from '@/app/components/scan/SeverityStep';
import { checkAccess } from '@/src/auth/access';
import { useAlert } from '@/src/context/AlertContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useAuth } from '@/src/hooks/useAuth';
import { enqueueScan } from '@/src/services/offlineScanQueue';
import { getScansLeftToday } from '@/src/services/profileStats';
import { submitScan } from '@/src/services/scanSubmission';
import logger from '@/src/utils/logger';
import { isOnline } from '@/src/utils/network';
import { buildScanResult } from '@/src/utils/scanResult';
import { preparePhotoForUpload } from '@/src/utils/scanPhoto';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// capture → severity → analysing → result screen (or an end state below).
// The server diagnoses while the request is open, so nothing is polled.
type Step = 'capture' | 'preparing' | 'severity' | 'analysing' | 'ended';

function CropScan() {
  const router = useRouter();
  // "Change severity" on the result screen comes back with the same photo
  const params = useLocalSearchParams<{ photoUri?: string }>();
  const { language } = useLanguage();
  const { showAlert } = useAlert();
  const isHausa = language === 'hausa';
  const t = (ha: string, en: string) => (isHausa ? ha : en);
  const { user } = useAuth();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [taking, setTaking] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);

  const [step, setStep] = useState<Step>(params.photoUri ? 'severity' : 'capture');
  const [photoUri, setPhotoUri] = useState<string | null>(params.photoUri || null);
  const [severityChoice, setSeverityChoice] = useState<SeverityChoice | null>(null);
  const [endState, setEndState] = useState<ScanEndState | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Before the farmer takes a photo: none left today means no point capturing
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const left = await getScansLeftToday(user, { online: await isOnline() });
      if (active && left === 0 && !submitting.current) showLimitReached();
    })();
    return () => { active = false; };
  }, [user]);

  // Back steps through the flow; it can't cancel a diagnosis in progress
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'analysing' || step === 'preparing') return true;
      if (step === 'severity' || step === 'ended') {
        retake();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [step]);

  function showUpgrade(title: string, message: string) {
    showAlert({
      title,
      message,
      buttons: [
        { text: t('Soke', 'Cancel'), style: 'cancel' },
        { text: t('Duba tsare-tsare', 'View plans'), onPress: () => router.push('/(onboarding)/plans') },
      ]
    });
  }

  function openVoiceAssistant() {
    const access = checkAccess(user, 'voiceAssistant');
    if (access.allowed) {
      setVoiceVisible(true);
      return;
    }
    const { title, body } = lockedMessage(access, 'voiceAssistant', isHausa);
    showUpgrade(title, body);
  }

  function retake() {
    setPhotoUri(null);
    setSeverityChoice(null);
    setEndState(null);
    setStep('capture');
  }

  // Resize to ~1280 px JPEG before the severity question, so the upload is ready
  async function acceptPhoto(uri: string, size?: { width?: number; height?: number }) {
    setStep('preparing');
    try {
      const prepared = await preparePhotoForUpload(uri, size);
      setPhotoUri(prepared.uri);
      setStep('severity');
    } catch (error) {
      logger.error('Preparing photo failed', error);
      setStep('capture');
      showAlert({
        title: t('Kuskure', 'Error'),
        message: t('An kasa shirya hoton. Ka sake ɗauka.', "Couldn't use that photo. Take it again."),
        buttons: [{ text: t('Yarda', 'OK') }],
      });
    }
  }

  async function takePicture() {
    if (!cameraRef.current || taking) return;
    setTaking(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (picture) await acceptPhoto(picture.uri, { width: picture.width, height: picture.height });
    } catch (err) {
      logger.error('takePicture error', err);
      showAlert({
        title: t('Kuskure', 'Error'),
        message: t('An kasa ɗaukar hoto. Da fatan a sake gwadawa.', 'Could not take photo. Try again.'),
        buttons: [{ text: t('Yarda', 'OK') }]
      });
    } finally {
      setTaking(false);
    }
  }

  async function openGallery() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      const asset = !result.canceled ? result.assets?.[0] : null;
      if (asset?.uri) await acceptPhoto(asset.uri, { width: asset.width, height: asset.height });
    } catch (err) {
      logger.error('openGallery error', err);
    }
  }

  function showLimitReached() {
    setEndState({ kind: 'limit', message: '' });
    setStep('ended');
  }

  async function diagnose() {
    if (!photoUri || !severityChoice || submitting.current) return;
    submitting.current = true;
    const severity = severityChoice === 'unsure' ? null : severityChoice;
    const scanLanguage = isHausa ? 'ha' : 'en';

    try {
      const online = await isOnline();
      if (online) setStep('analysing');

      // Checked again right before every send: never send a diagnosis with none left today
      if ((await getScansLeftToday(user, { online })) === 0) {
        showLimitReached();
        return;
      }

      if (!online) {
        await enqueueScan({ imageUri: photoUri, severity, language: scanLanguage, userId: user?.id });
        setEndState({ kind: 'queued' });
        setStep('ended');
        return;
      }

      const outcome = await submitScan({ imageUri: photoUri, severity, language: scanLanguage });

      if (outcome.kind === 'diagnosed' || outcome.kind === 'rejected') {
        router.replace({
          pathname: '/treatment-rec',
          params: {
            scanResult: JSON.stringify(buildScanResult(outcome.scan, scanLanguage)),
            photoUri,
          },
        });
        return;
      }
      setEndState(outcome);
      setStep('ended');
    } catch (error) {
      // Only saving the photo for later can throw here
      logger.error('Saving scan for later failed', error);
      setEndState({ kind: 'unavailable' });
      setStep('ended');
    } finally {
      submitting.current = false;
    }
  }

  if (step === 'severity' && photoUri) {
    return (
      <SeverityStep
        photoUri={photoUri}
        choice={severityChoice}
        isHausa={isHausa}
        onChoose={setSeverityChoice}
        onDiagnose={diagnose}
        onRetake={retake}
      />
    );
  }

  if (step === 'analysing' && photoUri) {
    return <AnalysingView photoUri={photoUri} isHausa={isHausa} />;
  }

  if (step === 'ended' && endState) {
    return (
      <ScanOutcomeView
        state={endState}
        photoUri={photoUri}
        isHausa={isHausa}
        onRetake={retake}
        onTryAgain={diagnose}
        onPlans={() => router.push('/(onboarding)/plans')}
        onDone={() => router.replace('/(tabs)')}
      />
    );
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>{t('Ana neman izinin kyamara...', 'Requesting camera permission...')}</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permissionText}>
          {t(
            'Ana bukatar izinin kyamara. Ko ka zaɓi hoto daga cikin wayarka.',
            'Camera access is needed. You can also choose a photo from your gallery.'
          )}
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>{t('Ba da izini', 'Allow camera')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openGallery} style={styles.textButton}>
          <Text style={styles.textButtonText}>{t('Zaɓi daga hotuna', 'Choose from gallery')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraWrapper}>
        {Platform.OS !== 'web' ? (
          <>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              onCameraReady={() => setIsCameraReady(true)}
            />
            {/* Frame and tips sit on top of the camera preview */}
            <CaptureGuideOverlay language={isHausa ? 'ha' : 'en'} />
          </>
        ) : (
          <View style={[styles.camera, styles.center, { backgroundColor: '#000' }]}>
            <Text style={{ color: 'white' }}>{t('Babu kyamara a nan. Zaɓi hoto.', 'No camera here. Choose a photo.')}</Text>
          </View>
        )}

        {/* Top controls */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} accessibilityLabel={t('Koma baya', 'Back')}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={openVoiceAssistant}
            accessibilityRole="button"
            accessibilityLabel={t('Yi tambaya da murya', 'Ask by voice')}
          >
            <Ionicons name="mic-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={openGallery}
            style={styles.sideButton}
            accessibilityLabel={t('Zaɓi daga hotuna', 'Choose from gallery')}
          >
            <Ionicons name="images-outline" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={takePicture}
            style={styles.shutterButton}
            disabled={!isCameraReady || taking}
            accessibilityLabel={t('Ɗauki hoto', 'Take photo')}
          >
            <View style={[styles.shutterOuter, taking && { opacity: 0.6 }]}>
              <View style={styles.shutterInner} />
            </View>
          </TouchableOpacity>

          <View style={styles.sideButtonSpacer} />
        </View>

        {step === 'preparing' && (
          <View style={styles.preparing}>
            <ActivityIndicator size="large" color="white" />
          </View>
        )}
      </View>

      {/* Hausa voice assistant */}
      <VoiceAssistantSheet
        visible={voiceVisible}
        onClose={() => setVoiceVisible(false)}
        language={language}
        cropType={null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraWrapper: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
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
  sideButtonSpacer: { width: 48 },
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
  preparing: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  permissionText: { textAlign: 'center', marginBottom: 16, fontSize: 16, lineHeight: 22, color: '#0E3B2C' },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#16A34A',
    borderRadius: 12,
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  textButton: { paddingVertical: 14 },
  textButtonText: { color: '#16A34A', fontWeight: '600', fontSize: 16 },
});

export default function CropScanWithAccess() {
  return (
    <RequireAccess feature="cropScan">
      <CropScan />
    </RequireAccess>
  );
}
