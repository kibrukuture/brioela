import { ReferenceRange } from '@/biomarker/types/reference-range.types';
import { ZONE_COLORS } from '@/biomarker/constants/colors';

/**
 * Determines the line color based on value position in zones
 * @param value - The biomarker value
 * @param referenceRange - Optional reference range
 * @returns Color string for the line at this value
 */
export function getZoneColor(value: number, referenceRange?: ReferenceRange): string {
  // No reference range = use normal color
  if (!referenceRange) {
    return ZONE_COLORS.normalLine;
  }

  const { normal, optimal } = referenceRange;

  // Out of range = gray
  if (value < normal.min || value > normal.max) {
    return ZONE_COLORS.outOfRangeLine;
  }

  // In optimal range = accent color
  if (optimal && value >= optimal.min && value <= optimal.max) {
    return ZONE_COLORS.optimalLine;
  }

  // In normal range = accent color
  return ZONE_COLORS.normalLine;
}
