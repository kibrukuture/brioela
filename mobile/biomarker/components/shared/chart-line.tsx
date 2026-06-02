import React from 'react';
import { Path } from '@shopify/react-native-skia';
import { PathSegment } from '@/biomarker/types/chart-config.types';
import { CHART_SIZES } from '@/biomarker/constants/chart-dimensions';

type ChartLineProps = {
  /** Path segments with colors */
  segments: PathSegment[];
};

/**
 * Renders the chart line (possibly multi-colored based on zones)
 */
export function ChartLine({ segments }: ChartLineProps) {
  return (
    <>
      {segments.map((segment, index) => (
        <Path
          key={index}
          path={segment.path}
          color={segment.color}
          style="stroke"
          strokeWidth={CHART_SIZES.lineWidth}
          strokeCap="round"
          strokeJoin="round"
        />
      ))}
    </>
  );
}
