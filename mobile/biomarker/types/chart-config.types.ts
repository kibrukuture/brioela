// Chart Config Types (placeholder)
// Purpose: Defines canvas dimensions, paddings, colors, and general chart configuration.
// Note: Comments only; implementation deferred.

/**
 * Canvas dimensions for chart rendering
 */
export type ChartDimensions = {
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
};

/**
 * Coordinate point on canvas
 */
export type Point = {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
};

/**
 * Path segment with associated color
 * Used for zone-based line coloring
 */
export type PathSegment = {
  /** SVG path string */
  path: string;
  /** Color for this segment */
  color: string;
};

/**
 * Configuration for chart rendering
 */
export type ChartConfig = {
  /** Canvas dimensions */
  dimensions: ChartDimensions;
  /** Accent color for the chart */
  accentColor: string;
  /** Background color */
  backgroundColor: string;
};
