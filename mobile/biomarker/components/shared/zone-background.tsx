import React from 'react';
import { Rect } from '@shopify/react-native-skia';
import { ReferenceRange } from '@/biomarker/types/reference-range.types';
import { ChartDimensions } from '@/biomarker/types/chart-config.types';
import { ZONE_COLORS } from '@/biomarker/constants/colors';
import { scaleLinear } from 'd3-scale';

type ZoneBackgroundProps = {
  /** Reference ranges to visualize */
  referenceRange: ReferenceRange;
  /** Canvas dimensions */
  dimensions: ChartDimensions;
  /** Min/max values in the data */
  valueRange: { min: number; max: number };
};

/**
 * Renders normal zone background edge-to-edge and optional optimal boundaries.
 * No optimal fill (hatch pattern will render separately).
 */
export function ZoneBackground({ referenceRange, dimensions, valueRange }: ZoneBackgroundProps) {
  // Scale: value → y position
  const yScale = scaleLinear()
    .domain([valueRange.min, valueRange.max])
    .range([dimensions.height, 0]);

  // Normal zone coordinates
  const normalTop = yScale(referenceRange.normal.max);
  const normalBottom = yScale(referenceRange.normal.min);
  const normalHeight = normalBottom - normalTop;

  return (
    <>
      {/* Normal zone (solid background) */}
      <Rect
        x={0}
        y={normalTop}
        width={dimensions.width}
        height={normalHeight}
        color={ZONE_COLORS.normalBackground}
      />
    </>
  );
}
