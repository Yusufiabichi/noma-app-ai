import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing, AccessibilityInfo, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SCAN_COLORS as C } from '@/src/theme/scan';

// Shown while the diagnosis request is open. The server checks the photo's
// quality first, then identifies the disease; the stages here are time-based.

const STAGE_SWITCH_MS = 4000;
const PHOTO_SIZE = Math.min(Dimensions.get('window').width - 80, 320);

export default function AnalysingView({ photoUri, isHausa }: { photoUri: string; isHausa: boolean }) {
  const t = (ha: string, en: string) => (isHausa ? ha : en);
  const [stage, setStage] = useState<0 | 1>(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => setStage(1), STAGE_SWITCH_MS);
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      stage === 0 ? t('Ana duba hotonka', 'Checking your photo') : t('Ana gane cutar', 'Identifying the disease')
    );
  }, [stage]);

  const stages = [t('Ana duba hotonka…', 'Checking your photo…'), t('Ana gane cutar…', 'Identifying the disease…')];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <View style={styles.frame}>
          <Image source={{ uri: photoUri }} style={styles.photo} accessibilityIgnoresInvertColors />
          {!reduceMotion && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.band,
                { transform: [{ translateY: sweep.interpolate({ inputRange: [0, 1], outputRange: [-40, PHOTO_SIZE] }) }] },
              ]}
            >
              <View style={styles.bandGlow} />
              <View style={styles.bandLine} />
            </Animated.View>
          )}
        </View>

        <View style={styles.stages} accessibilityLiveRegion="polite">
          {stages.map((label, i) => {
            const done = i < stage;
            const current = i === stage;
            return (
              <View key={i} style={styles.stageRow}>
                <View style={[styles.stageDot, done && styles.stageDotDone, current && styles.stageDotCurrent]}>
                  {done && <Ionicons name="checkmark" size={12} color={C.ink} />}
                </View>
                <Text style={[styles.stageText, (done || current) && styles.stageTextActive]}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.footnote}>
        {t('Yawanci bai wuce daƙiƙa 10 ba. Ka bar manhajar a buɗe.', 'Usually under 10 seconds. Keep the app open.')}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  frame: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#123F30',
  },
  photo: { width: '100%', height: '100%' },
  band: { position: 'absolute', left: 0, right: 0, top: 0, height: 40, justifyContent: 'flex-end' },
  bandGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(231,245,236,0.14)' },
  bandLine: { height: 2, backgroundColor: 'rgba(231,245,236,0.85)' },
  stages: { marginTop: 32, alignSelf: 'stretch', gap: 14 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stageDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotCurrent: { borderColor: C.primarySoft },
  stageDotDone: { borderColor: C.primarySoft, backgroundColor: C.primarySoft },
  stageText: { fontSize: 17, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
  stageTextActive: { color: C.white },
  footnote: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
});
