import { Point, PathSegment, ChartDimensions } from '@/biomarker/types/chart-config.types';
import { ReferenceRange } from '@/biomarker/types/reference-range.types';
import { calculateBezierPath } from '@/biomarker/chart-utils/calculate-bezier-path';
import { detectZoneIntersection } from '@/biomarker/chart-utils/detect-zone-intersection';
import { getZoneColor } from '@/biomarker/chart-utils/get-zone-color';
import { scaleLinear } from 'd3-scale';

/**
 * Splits a path into colored segments based on zone boundaries
 * @param points - Array of data points
 * @param referenceRange - Reference ranges (optional)
 * @param dimensions - Canvas dimensions
 * @param valueRange - Min/max values in data
 * @returns Array of path segments with colors
 */
export function calculatePathSegments(
  points: Point[],
  referenceRange: ReferenceRange | undefined,
  dimensions: ChartDimensions,
  valueRange: { min: number; max: number },
  options?: {
    verticalPaddingTop?: number;
    verticalPaddingBottom?: number;
    valuePaddingPercent?: number;
  }
): PathSegment[] {
  if (points.length === 0) {
    return [];
  }

  // No reference range = single colored path
  if (!referenceRange) {
    const path = calculateBezierPath(points);
    const color = getZoneColor(valueRange.min, referenceRange);
    return [{ path, color }];
  }

  // Create inverse scale (y pixel → value)
  // Mirror the same inverse mapping used in scaleDataToCanvas
  const vPadTop = options?.verticalPaddingTop ?? 0;
  const vPadBottom = options?.verticalPaddingBottom ?? 0;
  const yToValue = scaleLinear()
    .domain([dimensions.height - vPadBottom, vPadTop])
    .range([valueRange.min, valueRange.max]);

  const segments: PathSegment[] = [];
  let currentSegmentPoints: Point[] = [points[0]];

  // Walk through each point pair
  for (let i = 0; i < points.length - 1; i++) {
    const point1 = points[i];
    const point2 = points[i + 1];

    // Check for zone boundary crossings
    const intersections = detectZoneIntersection(
      point1,
      point2,
      referenceRange,
      dimensions,
      valueRange
    );

    if (intersections.length > 0) {
      // Line crosses boundary - split segment
      intersections.forEach((intersection) => {
        currentSegmentPoints.push(intersection);

        // Create segment with color based on midpoint value for accuracy
        const midIdx = Math.floor(currentSegmentPoints.length / 2);
        const midPoint = currentSegmentPoints[midIdx];
        const midValue = yToValue(midPoint.y);
        const color = getZoneColor(midValue, referenceRange);
        const path = calculateBezierPath(currentSegmentPoints);

        segments.push({ path, color });

        // Start new segment from intersection
        currentSegmentPoints = [intersection];
      });

      currentSegmentPoints.push(point2);
    } else {
      // No crossing - continue current segment
      currentSegmentPoints.push(point2);
    }
  }

  // Add final segment
  if (currentSegmentPoints.length > 1) {
    const midIdx = Math.floor(currentSegmentPoints.length / 2);
    const midPoint = currentSegmentPoints[midIdx];
    const midValue = yToValue(midPoint.y);
    const color = getZoneColor(midValue, referenceRange);
    const path = calculateBezierPath(currentSegmentPoints);

    segments.push({ path, color });
  }

  return segments;
}
