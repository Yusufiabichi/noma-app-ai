import React from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { SCAN_COLORS } from '@/src/theme/scan';
import type { Severity } from '@/src/services/scanSubmission';

// A small plant with three leaves, drawn to match each severity choice:
// low = a couple of spots, moderate = spots on every leaf, high = leaves dying.

// Leaf in a 100×100 box, base at (50, 94), tip at (50, 8)
const LEAF = 'M50 8 C78 22 90 50 74 78 C66 90 56 94 50 94 C44 94 34 90 26 78 C10 50 22 22 50 8 Z';
// A leaf with a dry, curled tip
const CURLED_LEAF = 'M50 8 C62 14 70 22 66 30 C84 44 88 60 74 78 C66 90 56 94 50 94 C44 94 34 90 26 78 C12 52 24 26 50 8 Z';

type Spot = [x: number, y: number, r: number];

interface LeafProps {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  fill?: string;
  curled?: boolean;
  spots?: Spot[];
  blotches?: Spot[];
}

const Leaf = ({ x, y, rotate, scale, fill = SCAN_COLORS.leaf, curled, spots = [], blotches = [] }: LeafProps) => (
  <G transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale}) translate(-50 -94)`}>
    <Path d={curled ? CURLED_LEAF : LEAF} fill={fill} />
    <Path d="M50 16 L50 92" stroke={SCAN_COLORS.leafVein} strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
    {blotches.map(([cx, cy, r], i) => (
      <Circle key={`b${i}`} cx={cx} cy={cy} r={r} fill={SCAN_COLORS.lesion} opacity={0.55} />
    ))}
    {spots.map(([cx, cy, r], i) => (
      <G key={`s${i}`}>
        <Circle cx={cx} cy={cy} r={r * 1.8} fill={SCAN_COLORS.halo} opacity={0.75} />
        <Circle cx={cx} cy={cy} r={r} fill={SCAN_COLORS.lesion} />
      </G>
    ))}
  </G>
);

const PLANTS: Record<Severity, LeafProps[]> = {
  low: [
    { x: 60, y: 46, rotate: 0, scale: 0.44 },
    { x: 60, y: 84, rotate: -58, scale: 0.42, spots: [[42, 46, 6], [58, 64, 5]] },
    { x: 60, y: 70, rotate: 56, scale: 0.42 },
  ],
  moderate: [
    { x: 60, y: 46, rotate: 0, scale: 0.44, spots: [[40, 40, 5], [60, 54, 6], [44, 70, 5]] },
    { x: 60, y: 84, rotate: -58, scale: 0.42, spots: [[38, 44, 6], [60, 56, 5], [48, 74, 6]] },
    { x: 60, y: 70, rotate: 56, scale: 0.42, spots: [[56, 38, 5], [40, 60, 6], [60, 72, 5]] },
  ],
  high: [
    {
      x: 60, y: 46, rotate: 8, scale: 0.44, fill: SCAN_COLORS.dryLeaf, curled: true,
      blotches: [[46, 40, 14], [56, 66, 16]], spots: [[38, 58, 5]],
    },
    {
      x: 60, y: 86, rotate: -112, scale: 0.4, fill: SCAN_COLORS.dryLeaf, curled: true,
      blotches: [[48, 50, 18], [52, 74, 12]],
    },
    {
      x: 60, y: 70, rotate: 64, scale: 0.42,
      blotches: [[50, 36, 12]], spots: [[40, 52, 6], [60, 60, 6], [46, 74, 5]],
    },
  ],
};

export default function SeverityIllustration({ severity, size = 88 }: { severity: Severity; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d="M60 118 C58 96 62 70 60 44" stroke={SCAN_COLORS.leafVein} strokeWidth={3} strokeLinecap="round" fill="none" />
      {PLANTS[severity].map((leaf, i) => (
        <Leaf key={i} {...leaf} />
      ))}
    </Svg>
  );
}
