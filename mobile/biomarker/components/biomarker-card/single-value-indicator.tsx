import React from 'react';
import { Canvas, Line } from '@shopify/react-native-skia';
import { ChartDimensions } from '@/biomarker/types/chart-config.types';
import { ValueDot } from '@/biomarker/components/shared/value-dot';
import { STATUS_COLORS } from '@/biomarker/constants/colors';
import { BiomarkerStatus } from '@/biomarker/types/biomarker-data.types';

type SingleValueIndicatorProps = {
  /** Canvas dimensions */
  dimensions: ChartDimensions;
  /** Status of the biomarker */
  status: BiomarkerStatus;
};

/**
 * Renders a single vertical line with dot for biomarkers without historical data
 * Used for biomarkers like Height, Weight that don't have trends
 */
export function SingleValueIndicator({ dimensions, status }: SingleValueIndicatorProps) {
  // Center the vertical line
  const centerX = dimensions.width / 2;
  const dotY = dimensions.height / 2;

  const color = STATUS_COLORS[status];

  return (
    <Canvas style={{ width: dimensions.width, height: dimensions.height }}>
      {/* Vertical line */}
      <Line
        p1={{ x: centerX, y: 0 }}
        p2={{ x: centerX, y: dimensions.height }}
        color={color}
        style="stroke"
        strokeWidth={2}
      />

      {/* Dot in the middle */}
      <ValueDot position={{ x: centerX, y: dotY }} color={color} />
    </Canvas>
  );
}
