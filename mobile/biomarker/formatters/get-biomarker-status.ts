import { BiomarkerStatus } from '@/biomarker/types/biomarker-data.types';
import { ReferenceRange } from '@/biomarker/types/reference-range.types';

/**
 * Determines the status of a biomarker value based on reference ranges
 * @param value - The biomarker value to check
 * @param referenceRange - Optional reference range to compare against
 * @returns Status: 'optimal', 'normal', 'high', or 'low'
 */
export function getBiomarkerStatus(
  value: number,
  referenceRange?: ReferenceRange
): BiomarkerStatus {
  // If no reference range, default to normal
  if (!referenceRange) {
    return 'normal';
  }

  const { normal, optimal } = referenceRange;

  // Check if value is outside normal range
  if (value < normal.min) {
    return 'low';
  }

  if (value > normal.max) {
    return 'high';
  }

  // Check if value is in optimal range
  if (optimal) {
    if (value >= optimal.min && value <= optimal.max) {
      return 'optimal';
    }
  }

  // Value is in normal range but not optimal
  return 'normal';
}
