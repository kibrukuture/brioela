import { line, curveCatmullRom } from 'd3-shape';
import { Point } from '@/biomarker/types/chart-config.types';

/**
 * Calculates a smooth bezier path from data points using d3-shape
 * @param points - Array of x,y coordinates
 * @returns SVG path string (e.g., "M0,10 C5,8 10,12...")
 */
export function calculateBezierPath(points: Point[]): string {
  if (points.length === 0) {
    return '';
  }

  // Single point - just draw a dot (handled elsewhere)
  if (points.length === 1) {
    return `M${points[0].x},${points[0].y}`;
  }

  // Create smooth curve using Catmull-Rom spline with tuned alpha for crispness
  const pathGenerator = line<Point>()
    .x((d) => d.x)
    .y((d) => d.y)
    .curve(curveCatmullRom.alpha(0.5));

  return pathGenerator(points) ?? '';
}
