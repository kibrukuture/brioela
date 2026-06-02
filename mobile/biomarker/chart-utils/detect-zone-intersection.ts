import { Point, ChartDimensions } from '@/biomarker/types/chart-config.types';
import { ReferenceRange } from '@/biomarker/types/reference-range.types';
import { scaleLinear } from 'd3-scale';

/**
 * Detects where a line segment crosses zone boundaries
 * @param point1 - Start point
 * @param point2 - End point
 * @param referenceRange - Reference ranges
 * @param dimensions - Canvas dimensions
 * @param valueRange - Min/max values in the data
 * @returns Array of intersection points where line crosses zone boundaries
 */
export function detectZoneIntersection(
  point1: Point,
  point2: Point,
  referenceRange: ReferenceRange,
  dimensions: ChartDimensions,
  valueRange: { min: number; max: number }
): Point[] {
  const intersections: Point[] = [];

  // Create inverse scale (y pixel → value)
  const yToValue = scaleLinear()
    .domain([dimensions.height, 0])
    .range([valueRange.min, valueRange.max]);

  // Get values at both points
  const value1 = yToValue(point1.y);
  const value2 = yToValue(point2.y);

  // Zone boundaries to check
  const boundaries: number[] = [referenceRange.normal.min, referenceRange.normal.max];

  if (referenceRange.optimal) {
    boundaries.push(referenceRange.optimal.min);
    boundaries.push(referenceRange.optimal.max);
  }

  // Check each boundary
  boundaries.forEach((boundary) => {
    // Does line segment cross this boundary?
    const crossesBoundary =
      (value1 <= boundary && value2 >= boundary) || (value1 >= boundary && value2 <= boundary);

    if (crossesBoundary) {
      // Calculate intersection point using linear interpolation
      const t = (boundary - value1) / (value2 - value1);
      const intersectionX = point1.x + t * (point2.x - point1.x);
      const intersectionY = point1.y + t * (point2.y - point1.y);

      intersections.push({ x: intersectionX, y: intersectionY });
    }
  });

  return intersections;
}
