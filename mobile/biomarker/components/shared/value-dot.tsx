import React from 'react';
import { Circle } from '@shopify/react-native-skia';
import { Point } from '@/biomarker/types/chart-config.types';
import { CHART_SIZES } from '@/biomarker/constants/chart-dimensions';

type ValueDotProps = {
  /** Position of the dot */
  position: Point;
  /** Dot color */
  color: string;
};

/**
 * Renders a dot at the current value position
 */
export function ValueDot({ position, color }: ValueDotProps) {
  return <Circle cx={position.x} cy={position.y} r={CHART_SIZES.dotRadius} color={color} />;
}
