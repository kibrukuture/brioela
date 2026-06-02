import React from 'react';
import { View, Text } from 'react-native';
import { Canvas, Rect, Line, Circle, Path } from '@shopify/react-native-skia';
import { scaleLinear, scaleTime } from 'd3-scale';
import { line, curveCatmullRom } from 'd3-shape';
import { ZONE_COLORS } from '@/biomarker/constants/colors';
import { CHART_SIZES } from '@/biomarker/constants/chart-dimensions';

/**
 * ONE complete test sparkline with ALL features
 */
export function TestSparkline() {
  // Canvas size (bigger for testing)
  const width = 140;
  const height = 48;

  // Test data (blood glucose going from LOW to NORMAL)
  const data = [
    { value: 55, date: new Date('2025-01-01') }, // LOW (below 73.86)
    { value: 65, date: new Date('2025-02-01') }, // LOW
    { value: 80, date: new Date('2025-03-01') }, // NORMAL
    { value: 90, date: new Date('2025-04-01') }, // NORMAL
    { value: 95, date: new Date('2025-05-01') }, // NORMAL
    { value: 93.2, date: new Date('2025-06-01') }, // NORMAL
  ];

  // Reference ranges
  const normalMin = 73.86;
  const normalMax = 109.9;
  const optimalMin = 80;
  const optimalMax = 100;

  // Calculate min/max from data with small padding for headroom
  const values = data.map((d) => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = (rawMax - rawMin) * 0.08; // 8% visual padding
  const minValue = rawMin - pad;
  const maxValue = rawMax + pad;

  // X scale (time → pixels)
  // inner horizontal padding so curve/dot/vertical line sit inside edges
  const horizontalPadding = 6;
  const xScale = scaleTime()
    .domain([data[0].date, data[data.length - 1].date])
    .range([horizontalPadding, width - horizontalPadding]);

  // Y scale (value → pixels, inverted)
  const yScale = scaleLinear().domain([minValue, maxValue]).range([height, 0]);

  // Convert data to points
  const points = data.map((d) => ({
    x: xScale(d.date),
    y: yScale(d.value),
  }));

  // Current value position (last point)
  const currentX = points[points.length - 1].x;
  const currentY = points[points.length - 1].y;

  // Create smooth path (slightly tighter Catmull-Rom for crispness)
  const pathGenerator = line<{ x: number; y: number }>()
    .x((d) => d.x)
    .y((d) => d.y)
    .curve(curveCatmullRom.alpha(0.5));

  const pathString = pathGenerator(points) || '';

  // Zone positions
  const normalTopY = yScale(normalMax);
  const normalBottomY = yScale(normalMin);
  const normalHeight = normalBottomY - normalTopY;

  const optimalTopY = yScale(optimalMax);
  const optimalBottomY = yScale(optimalMin);
  const optimalHeight = optimalBottomY - optimalTopY;

  // Hatch lines (diagonal)
  const hatchLines = [] as React.ReactElement[];
  const spacing = Math.max(CHART_SIZES.hatchSpacing, 6); // more space between stripes
  for (let x = -height; x < width; x += spacing) {
    hatchLines.push(
      <Line
        key={x}
        p1={{ x, y: optimalTopY }}
        p2={{ x: x + optimalHeight, y: optimalBottomY }}
        color="#1BA3D6"
        style="stroke"
        strokeWidth={1.25}
        opacity={0.5}
      />
    );
  }

  // Align 1px strokes to device pixel grid to avoid blur
  const alignPixel = (n: number) => Math.round(n) + 0.5;

  return (
    <View className="p-4">
      <Text className="mb-2 text-lg font-bold">Blood Glucose Test</Text>
      <Text className="mb-2 text-sm text-gray-500">93.2 mg/dL</Text>

      <Canvas style={{ width, height }}>
        {/* Step 1: Normal zone background (light green) */}
        <Rect
          x={0}
          y={normalTopY}
          width={width}
          height={normalHeight}
          color={ZONE_COLORS.normalBackground}
        />

        {/* Step 2: Optimal zone background (light cyan) */}
        {/** Removed the optimal zone fill so only hatch stripes have color */}

        {/* Subtle boundaries so the hatched strap stands out */}
        <Line
          p1={{ x: 0, y: alignPixel(optimalTopY) }}
          p2={{ x: width, y: alignPixel(optimalTopY) }}
          color="rgba(25, 130, 200, 0.35)"
          style="stroke"
          strokeWidth={1}
        />
        <Line
          p1={{ x: 0, y: alignPixel(optimalBottomY) }}
          p2={{ x: width, y: alignPixel(optimalBottomY) }}
          color="rgba(25, 130, 200, 0.35)"
          style="stroke"
          strokeWidth={1}
        />

        {/* Step 3: Hatch pattern (diagonal lines) */}
        {hatchLines}

        {/* Step 4: Chart line (smooth curve) */}
        <Path
          path={pathString}
          color={ZONE_COLORS.normalLine}
          style="stroke"
          strokeWidth={CHART_SIZES.lineWidth}
          strokeCap="round"
          strokeJoin="round"
        />

        {/* Step 5: Vertical line from dot to bottom */}
        {/* Full-height vertical guideline that crosses the dot */}
        <Line
          p1={{ x: alignPixel(currentX), y: 0 }}
          p2={{ x: alignPixel(currentX), y: height }}
          color={ZONE_COLORS.normalLine}
          style="stroke"
          strokeWidth={1}
        />

        {/* Step 6: Dot at current value */}
        <Circle
          cx={currentX}
          cy={currentY}
          r={CHART_SIZES.dotRadius}
          color={ZONE_COLORS.normalLine}
        />
      </Canvas>

      <Text className="mt-2 text-xs text-gray-400">
        All features: zones, hatch, line, vertical marker, dot
      </Text>
    </View>
  );
}
