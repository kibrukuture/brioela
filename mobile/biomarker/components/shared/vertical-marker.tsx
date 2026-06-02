import React from 'react';
import { Line } from '@shopify/react-native-skia';
import { TEXT_SECONDARY } from '@/biomarker/constants/colors';

type VerticalMarkerProps = {
  /** X position of the marker */
  x: number;
  /** Height of the chart */
  height: number;
  /** Color of the line (optional) */
  color?: string;
};

/**
 * Renders a vertical line marker at current value position
 * Used in detail chart to show "NOW" position
 */
export function VerticalMarker({ x, height, color = TEXT_SECONDARY }: VerticalMarkerProps) {
  return (
    <Line
      p1={{ x, y: 0 }}
      p2={{ x, y: height }}
      color={color}
      style="stroke"
      strokeWidth={1}
      opacity={0.5}
    />
  );
}
