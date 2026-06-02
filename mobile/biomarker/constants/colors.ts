/**
 * Color palette for the biomarker app
 * Uses single accent color with opacity variations
 */

/** Primary accent color */
export const ACCENT_COLOR = '#007AFF'; // iOS blue

/** Background color */
export const BACKGROUND_COLOR = '#FFFFFF';

/** Text colors */
export const TEXT_PRIMARY = '#000000';
export const TEXT_SECONDARY = '#8E8E93';

/**
 * Zone colors with opacity using rgba() format
 */
export const ZONE_COLORS = {
  /** Normal zone background (light green with 15% opacity) */
  normalBackground: 'rgba(52, 199, 89, 0.15)',

  /** Optimal zone background (teal/cyan with 20% opacity) */
  optimalBackground: 'rgba(50, 173, 230, 0.2)',

  /** Line color when in normal zone (green) */
  normalLine: '#34C759',

  /** Line color when in optimal zone (green) */
  optimalLine: '#34C759',

  /** Line color when out of range (orange/yellow) */
  outOfRangeLine: '#FF9500',
} as const;

/**
 * Status indicator colors
 */
export const STATUS_COLORS = {
  optimal: '#34C759', // Green
  normal: '#34C759', // Green
  high: '#FF9500', // Orange
  low: '#FF9500', // Orange
} as const;
