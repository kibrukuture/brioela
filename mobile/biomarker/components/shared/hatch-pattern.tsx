import React from 'react';
import { Line } from '@shopify/react-native-skia';
import { ReferenceRange } from '@/biomarker/types/reference-range.types';
import { ChartDimensions } from '@/biomarker/types/chart-config.types';
import { CHART_SIZES } from '@/biomarker/constants/chart-dimensions';
import { scaleLinear } from 'd3-scale';

type HatchPatternProps = {
  referenceRange: ReferenceRange;
  dimensions: ChartDimensions;
  valueRange: { min: number; max: number };
};

export function HatchPattern({ referenceRange, dimensions, valueRange }: HatchPatternProps) {
  if (!referenceRange.optimal) {
    return null;
  }

  const yScale = scaleLinear()
    .domain([valueRange.min, valueRange.max])
    .range([dimensions.height, 0]);

  const optimalTop = yScale(referenceRange.optimal.max);
  const optimalBottom = yScale(referenceRange.optimal.min);

  const lines: React.ReactElement[] = [];
  const spacing = Math.max(CHART_SIZES.hatchSpacing, 6);

  // Draw diagonal lines across the entire width
  for (let x = -dimensions.height; x < dimensions.width; x += spacing) {
    lines.push(
      <Line
        key={x}
        p1={{ x, y: optimalTop }}
        p2={{ x: x + (optimalBottom - optimalTop), y: optimalBottom }}
        color="#1BA3D6"
        style="stroke"
        strokeWidth={1}
        opacity={0.5}
      />
    );
  }

  return <>{lines}</>;
}
