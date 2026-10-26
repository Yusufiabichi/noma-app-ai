import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  AccessibilityInfo,
  useWindowDimensions,
} from 'react-native';

// "Hello" in the languages NomaApp's farmers speak
export const GREETINGS = [
  { text: 'Hello',    language: 'English' },
  { text: 'Sannu',    language: 'Hausa'   },
  { text: 'Ẹ ǹ lẹ́',   language: 'Yorùbá'  },
  { text: 'Ndeewo',   language: 'Igbo'    },
  { text: 'How far?', language: 'Pidgin'  },
];

const HOLD_MS = 2200;
const OUT_MS  = 220;
const IN_MS   = 360;

const MAX_FONT = 44;
const MIN_FONT = 30;
// The widest greeting ("How far?" in bold) is ~4.5–4.8× the font size.
const WIDEST_RATIO = 4.8;

const COLORS = {
  ink:   '#0E3B2C',
  leaf:  '#4E9A2B',
  brand: '#16A34A',
  tick:  '#D5DED2',
};

export default function AnimatedGreeting({ focusIndex }: { focusIndex?: number | null }) {
  const { width } = useWindowDimensions();

  // Compute font size from actual screen width so every phone
  // renders at a comparable visual size.
  const fontSize = useMemo(() => {
    const available = Math.max(180, width - 48); // subtract outer padding allowance
    const fitted = Math.floor(available / WIDEST_RATIO);
    return Math.max(MIN_FONT, Math.min(MAX_FONT, fitted));
  }, [width]);

  // Window must be tall enough for tone marks above (ẹ́) and dot below (Ẹ).
  const windowHeight = Math.round(fontSize * 1.7);
  const lineHeight   = Math.round(fontSize * 1.3);
  const travel       = Math.round(fontSize * 0.4); // scale with the word

  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const progress    = useRef(new Animated.Value(1)).current;
  const indexRef    = useRef(0);
  const timer       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animating   = useRef(false);
  const pending     = useRef<number | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const showGreeting = (next: number) => {
    if (animating.current) {
      pending.current = next;
      return;
    }
    if (next === indexRef.current) return;
    animating.current = true;

    Animated.timing(progress, {
      toValue: 2,
      duration: OUT_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      indexRef.current = next;
      setIndex(next);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        animating.current = false;
        if (pending.current !== null) {
          const queued = pending.current;
          pending.current = null;
          showGreeting(queued);
        }
      });
    });
  };

  const scheduleNext = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      showGreeting((indexRef.current + 1) % GREETINGS.length);
      scheduleNext();
    }, HOLD_MS);
  };

  useEffect(() => {
    scheduleNext();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Answer the farmer's choice, then hold it a little longer before cycling on
  useEffect(() => {
    if (focusIndex === null || focusIndex === undefined) return;
    showGreeting(focusIndex);
    scheduleNext();
  }, [focusIndex]);

  const translateY = reduceMotion
    ? 0
    : progress.interpolate({
        inputRange:  [0, 1, 2],
        outputRange: [travel, 0, -travel],
      });
  const opacity = progress.interpolate({
    inputRange:  [0, 1, 2],
    outputRange: [0, 1, 0],
  });

  const current = GREETINGS[index];

  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={GREETINGS.map((g) => g.text).join(', ')}
    >
      <View style={[styles.window, { height: windowHeight }]}>
        <Animated.Text
          style={[
            styles.word,
            { fontSize, lineHeight, opacity, transform: [{ translateY }] },
          ]}
          numberOfLines={1}
          allowFontScaling={false}   // ← keep system font-size from breaking layout
        >
          {current.text}
        </Animated.Text>
      </View>

      <Animated.Text
        style={[styles.language, { opacity }]}
        allowFontScaling={false}
        maxFontSizeMultiplier={1.2} // subtitle is fine to scale slightly
      >
        {current.language}
      </Animated.Text>

      <View style={styles.ticks}>
        {GREETINGS.map((g, i) => (
          <View key={g.language} style={[styles.tick, i === index && styles.tickActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  window: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  word: {
    fontWeight: '800',
    letterSpacing: -0.5,          // was -1.5 — merging/clipping ẹ́ on some fonts
    color: COLORS.ink,
    // do NOT set includeFontPadding: false — it clips Yorùbá tone marks
  },
  language: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.leaf,
    marginTop: 2,
  },
  ticks: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 18,
  },
  tick: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.tick,
  },
  tickActive: {
    width: 24,
    backgroundColor: COLORS.brand,
  },
});