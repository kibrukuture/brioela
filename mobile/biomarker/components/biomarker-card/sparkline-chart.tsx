import React, { useMemo } from 'react';
import { Canvas, Line, Group } from '@shopify/react-native-skia';
import { BiomarkerValue, BiomarkerStatus } from '@/biomarker/types/biomarker-data.types';
import { ReferenceRange } from '@/biomarker/types/reference-range.types';
import { ChartDimensions } from '@/biomarker/types/chart-config.types';
import { scaleDataToCanvas } from '@/biomarker/chart-utils/scale-data-to-canvas';
import { calculatePathSegments } from '@/biomarker/chart-utils/calculate-path-segments';
import { ZoneBackground } from '@/biomarker/components/shared/zone-background';
import { HatchPattern } from '@/biomarker/components/shared/hatch-pattern';
import { ChartLine } from '@/biomarker/components/shared/chart-line';
import { ValueDot } from '@/biomarker/components/shared/value-dot';
import { STATUS_COLORS } from '@/biomarker/constants/colors';
import { getBiomarkerStatus } from '@/biomarker/formatters/get-biomarker-status';
import {
  SPARKLINE_INSETS,
  VALUE_DOMAIN_PADDING_PERCENT,
} from '@/biomarker/constants/chart-dimensions';

type SparklineChartProps = {
  /** Historical data points */
  historicalValues: BiomarkerValue[];
  /** Reference ranges (optional) */
  referenceRange?: ReferenceRange;
  /** Canvas dimensions */
  dimensions: ChartDimensions;
  /** Current status */
  status: BiomarkerStatus;
};

/**
 * Renders a mini sparkline chart with zones and trend line
 * Used for biomarkers with historical data
 */
export function SparklineChart({
  historicalValues,
  referenceRange,
  dimensions,
  status,
}: SparklineChartProps) {
  // Calculate min/max values from data
  const valueRange = useMemo(() => {
    const values = historicalValues.map((v) => v.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [historicalValues]);

  // Scale data to canvas coordinates
  const points = useMemo(
    () =>
      scaleDataToCanvas(historicalValues, dimensions, valueRange, {
        horizontalPadding: SPARKLINE_INSETS.horizontal,
        verticalPaddingTop: SPARKLINE_INSETS.vertical,
        verticalPaddingBottom: SPARKLINE_INSETS.vertical,
        valuePaddingPercent: VALUE_DOMAIN_PADDING_PERCENT,
      }),
    [historicalValues, dimensions, valueRange]
  );

  // Calculate path segments with zone-based coloring
  const segments = useMemo(
    () =>
      calculatePathSegments(points, referenceRange, dimensions, valueRange, {
        verticalPaddingTop: SPARKLINE_INSETS.vertical,
        verticalPaddingBottom: SPARKLINE_INSETS.vertical,
        valuePaddingPercent: VALUE_DOMAIN_PADDING_PERCENT,
      }),
    [points, referenceRange, dimensions, valueRange]
  );

  // Current value dot position (last point)
  const currentDotPosition = points[points.length - 1];
  const latestValue = historicalValues[historicalValues.length - 1]?.value;
  const dynamicStatus =
    referenceRange && typeof latestValue === 'number'
      ? getBiomarkerStatus(latestValue, referenceRange)
      : status;
  const dotColor = STATUS_COLORS[dynamicStatus];

  // Pixel align 1px vertical guideline
  const alignPixel = (n: number) => Math.round(n) + 0.5;

  return (
    <Canvas style={{ width: dimensions.width, height: dimensions.height }}>
      {/* Optional clip (radius kept subtle) */}
      <Group
        clip={{ x: 0, y: 0, width: dimensions.width, height: dimensions.height, rx: 4, ry: 4 }}>
        {/* Zone backgrounds (if reference range exists) */}
        {referenceRange && (
          <>
            <ZoneBackground
              referenceRange={referenceRange}
              dimensions={dimensions}
              valueRange={valueRange}
            />
            <HatchPattern
              referenceRange={referenceRange}
              dimensions={dimensions}
              valueRange={valueRange}
            />
          </>
        )}

        {/* Chart line */}
        <ChartLine segments={segments} />

        {/* Vertical line dropping from current dot to bottom */}
        <Line
          p1={{ x: alignPixel(currentDotPosition.x), y: 0 }}
          p2={{ x: alignPixel(currentDotPosition.x), y: dimensions.height }}
          color={dotColor}
          style="stroke"
          strokeWidth={1}
        />

        {/* Current value dot */}
        <ValueDot position={currentDotPosition} color={dotColor} />
      </Group>
    </Canvas>
  );
}
