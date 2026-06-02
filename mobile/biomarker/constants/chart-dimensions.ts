import { ChartDimensions } from '@/biomarker/types/chart-config.types';

/**
 * Standard dimensions for sparkline (mini chart on card)
 */
export const SPARKLINE_DIMENSIONS: ChartDimensions = {
  width: 60,
  height: 30,
};

/**
 * Standard dimensions for full detail chart (in modal)
 */
export const DETAIL_CHART_DIMENSIONS: ChartDimensions = {
  width: 340,
  height: 200,
};

/**
 * Spacing and padding constants
 */
export const CHART_PADDING = {
  /** Padding inside chart canvas */
  inner: 4,
  /** Space around chart container */
  outer: 16,
} as const;

/**
 * Visual element sizes
 */
export const CHART_SIZES = {
  /** Dot radius for current value indicator */
  dotRadius: 4,
  /** Line stroke width */
  lineWidth: 2,
  /** Hatch pattern line spacing */
  hatchSpacing: 6,
} as const;

/**
 * Default inner insets for sparklines (keeps line/dot/marker inside edges)
 */
export const SPARKLINE_INSETS = {
  horizontal: 10,
  vertical: 6,
} as const;

/**
 * Default value-domain padding used when scaling (adds visual headroom)
 */
export const VALUE_DOMAIN_PADDING_PERCENT = 0.08;
