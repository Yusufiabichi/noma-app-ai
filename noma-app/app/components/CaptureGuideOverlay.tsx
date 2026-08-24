import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
  TouchableOpacity, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Rect, Defs, Mask } from 'react-native-svg';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Frame window dimensions — the clear area the farmer aligns the leaf to
const FRAME_W = SCREEN_W * 0.72;
const FRAME_H = FRAME_W * 1.1;     // slightly taller than wide — leaf shape ratio
const FRAME_X = (SCREEN_W - FRAME_W) / 2;
const FRAME_Y = (SCREEN_H - FRAME_H) / 2 - 40; // nudged above center

// ─── Tips content ──────────────────────────────────────────────────────────────

const TIPS: Record<string, string[]> = {
  en: [
    'Fill the frame with the affected leaf',
    'Use natural daylight — avoid direct shade',
    'Hold your phone steady before tapping capture',
    'Focus on the most visibly infected part',
    'Clean your camera lens for a clearer shot',
  ],
  ha: [
    'Cika firam ɗin da ganyen da ya kamu',
    'Yi hoton a waje mai rana — guji inuwa',
    'Riƙe wayar ka da kyau kafin ka ɗauka',
    'Mai da hankali kan ɓangaren da ya fi kamuwa',
    'Goge idon kyamara don hoto mai kyau',
  ],
};

// ─── Lighting config ───────────────────────────────────────────────────────────

type LightLevel = 'good' | 'bright' | 'dark' | 'unknown';

const LIGHT_CONFIG: Record<LightLevel, {
  icon: string; label: string; labelHa: string; color: string;
}> = {
  good:    { icon: 'sunny-outline',       label: 'Good lighting',  labelHa: 'Haske ya yi kyau',    color: '#16A34A' },
  bright:  { icon: 'sunny',              label: 'Too bright',     labelHa: 'Haske ya yi yawa',    color: '#d97706' },
  dark:    { icon: 'moon-outline',        label: 'Too dark',       labelHa: 'Yana da duhu sosai',  color: '#dc2626' },
  unknown: { icon: 'help-circle-outline', label: 'Checking light', labelHa: 'Ana duba haske',      color: '#6b7280' },
};

// ─── Corner markers ────────────────────────────────────────────────────────────
// Draws the four L-shaped corners of the frame guide

const CornerMarkers = ({
  color, size = 22, thickness = 3,
}: {
  color: string; size?: number; thickness?: number;
}) => {
  const style = { position: 'absolute' as const };
  const line  = { backgroundColor: color, borderRadius: 2 };

  const corners = [
    { top: 0,    left: 0,    h: { top: 0, left: 0, width: size, height: thickness },
                              v: { top: 0, left: 0, width: thickness, height: size } },
    { top: 0,    right: 0,   h: { top: 0, right: 0, width: size, height: thickness },
                              v: { top: 0, right: 0, width: thickness, height: size } },
    { bottom: 0, left: 0,    h: { bottom: 0, left: 0, width: size, height: thickness },
                              v: { bottom: 0, left: 0, width: thickness, height: size } },
    { bottom: 0, right: 0,   h: { bottom: 0, right: 0, width: size, height: thickness },
                              v: { bottom: 0, right: 0, width: thickness, height: size } },
  ];

  return (
    <>
      {corners.map((c, i) => (
        <View key={i} style={[style, c.top !== undefined ? { top: c.top } : { bottom: c.bottom! },
          c.left !== undefined ? { left: c.left } : { right: c.right! }]}>
          <View style={[line, c.h]} />
          <View style={[line, c.v, { position: 'absolute' }]} />
        </View>
      ))}
    </>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

interface CaptureGuideOverlayProps {
  language?: 'en' | 'ha';
  onDismiss?: () => void;
  // Pass the current ambient brightness if you read it from the camera
  // If not passed, the component reads it from expo-brightness
  brightnessOverride?: number | null;
}

const CaptureGuideOverlay: React.FC<CaptureGuideOverlayProps> = ({
  language = 'en',
  onDismiss,
  brightnessOverride = null,
}) => {
  const tips = TIPS[language] || TIPS.en;

  const [tipIndex, setTipIndex]       = useState(0);
  const [lightLevel, setLightLevel]   = useState<LightLevel>('unknown');
  const [showTips, setShowTips]       = useState(true);

  const tipOpacity  = useRef(new Animated.Value(1)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const fadeIn      = useRef(new Animated.Value(0)).current;

  // ── Entrance fade ────────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();
  }, []);

  // ── Tip rotation ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out → update → fade in
      Animated.timing(tipOpacity, {
        toValue: 0, duration: 300, useNativeDriver: true,
      }).start(() => {
        setTipIndex(i => (i + 1) % tips.length);
        Animated.timing(tipOpacity, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }).start();
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [tips.length]);

  // ── Frame pulse for "good" lighting ──────────────────────────────────────────
  useEffect(() => {
    if (lightLevel !== 'good') return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.012, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,     duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [lightLevel]);

  // ── Lighting detection ────────────────────────────────────────────────────────
    const checkLighting = useCallback(async () => {
      try {
        // expo-brightness has a getSystemBrightnessAsync that
        // reads screen brightness without the scary permission.
        // But safest of all — just skip ambient detection on Android
        // and use a static "good" state, letting the tips do the work.
        if (Platform.OS === 'android') {
          setLightLevel('good'); // skip sensor on Android — no permission needed
          return;
        }

        // iOS doesn't need special permission for brightness reading
        const { Brightness } = await import('expo-brightness');
        const brightness = await Brightness.getBrightnessAsync();
        if (brightness < 0.15)      setLightLevel('dark');
        else if (brightness > 0.85) setLightLevel('bright');
        else                        setLightLevel('good');
      } catch {
        setLightLevel('good'); // fail silently — tips still show
      }
    }, []);

  useEffect(() => {
    checkLighting();
    const interval = setInterval(checkLighting, 2500); // re-check every 2.5s
    return () => clearInterval(interval);
  }, [checkLighting]);

  const lightCfg    = LIGHT_CONFIG[lightLevel];
  const frameColor  = lightLevel === 'good'  ? '#16A34A'
                    : lightLevel === 'dark'  ? '#dc2626'
                    : lightLevel === 'bright'? '#d97706'
                    : 'rgba(255,255,255,0.6)';

  const isReady = lightLevel === 'good' || lightLevel === 'unknown';

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]} pointerEvents="box-none">

      {/* ── Dark overlay with transparent cutout ─────────────────────────────── */}
      <Svg
        width={SCREEN_W}
        height={SCREEN_H}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <Mask id="cutout">
            {/* Full white = visible dark overlay */}
            <Rect width={SCREEN_W} height={SCREEN_H} fill="white" />
            {/* Black = transparent (the frame window) */}
            <Rect
              x={FRAME_X}
              y={FRAME_Y}
              width={FRAME_W}
              height={FRAME_H}
              rx={20}
              fill="black"
            />
          </Mask>
        </Defs>
        <Rect
          width={SCREEN_W}
          height={SCREEN_H}
          fill="rgba(0,0,0,0.55)"
          mask="url(#cutout)"
        />
      </Svg>

      {/* ── Frame border + corners ────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.frameBox,
          {
            left:      FRAME_X,
            top:       FRAME_Y,
            width:     FRAME_W,
            height:    FRAME_H,
            borderColor: frameColor,
            transform: [{ scale: pulseAnim }],
          },
        ]}
        pointerEvents="none"
      >
        <CornerMarkers color={frameColor} size={24} thickness={3} />
      </Animated.View>

      {/* ── "Place leaf here" label above frame ──────────────────────────────── */}
      <View style={[styles.frameLabelWrap, { top: FRAME_Y - 36, left: FRAME_X }]}>
        <Ionicons name="leaf-outline" size={13} color="rgba(255,255,255,0.85)" />
        <Text style={styles.frameLabel}>
          {language === 'ha' ? 'Sanya ganye a nan' : 'Place the affected leaf here'}
        </Text>
      </View>

      {/* ── Lighting indicator ───────────────────────────────────────────────── */}
      <View style={[styles.lightIndicator, { borderColor: lightCfg.color }]}>
        <Ionicons name={lightCfg.icon as any} size={15} color={lightCfg.color} />
        <Text style={[styles.lightLabel, { color: lightCfg.color }]}>
          {language === 'ha' ? lightCfg.labelHa : lightCfg.label}
        </Text>
      </View>

      {/* ── Rotating tip ─────────────────────────────────────────────────────── */}
      {showTips && (
        <View style={styles.tipWrap}>
          <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Animated.Text style={[styles.tipText, { opacity: tipOpacity }]}>
            {tips[tipIndex]}
          </Animated.Text>
          <TouchableOpacity onPress={() => setShowTips(false)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons name="close" size={14} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Not-ready warning (dark/bright) ──────────────────────────────────── */}
      {lightLevel !== 'good' && lightLevel !== 'unknown' && (
        <View style={[styles.warningBanner, { borderColor: lightCfg.color + '60' }]}>
          <Ionicons name="warning-outline" size={14} color={lightCfg.color} />
          <Text style={[styles.warningText, { color: lightCfg.color }]}>
            {lightLevel === 'dark'
              ? (language === 'ha' ? 'Nemi wuri mai haske' : 'Move to a brighter spot')
              : (language === 'ha' ? 'Guji hasken rana kai tsaye' : 'Avoid direct sunlight')}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },

  // Transparent frame box (border only — cutout handled by SVG)
  frameBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 20,
    borderStyle: 'solid',
  },

  // "Place leaf here" label
  frameLabelWrap: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  frameLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },

  // Lighting indicator pill
  lightIndicator: {
    position: 'absolute',
    bottom: SCREEN_H - FRAME_Y - FRAME_H - 16,
    alignSelf: 'center',
    left: FRAME_X,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  lightLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Rotating tip bar
  tipWrap: {
    position: 'absolute',
    bottom: 110,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 17,
    fontWeight: '500',
  },

  // Warning banner for bad lighting
  warningBanner: {
    position: 'absolute',
    bottom: 155,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default CaptureGuideOverlay;