// Reference Range Types (placeholder)
// Purpose: Defines zone structures (low/normal/high) and thresholds for biomarkers.
// Note: Comments only; implementation deferred.

/**
 * Defines the normal range for a biomarker value
 */
export type NormalRange = {
  /** Minimum value of normal range */
  min: number;
  /** Maximum value of normal range */
  max: number;
};

/**
 * Defines the optimal range for a biomarker value (narrower than normal)
 */
export type OptimalRange = {
  /** Minimum value of optimal range */
  min: number;
  /** Maximum value of optimal range */
  max: number;
};

/**
 * Complete reference range for a biomarker
 * Includes both normal and optional optimal ranges
 */
export type ReferenceRange = {
  /** Normal range (wider zone) */
  normal: NormalRange;
  /** Optional optimal range (narrower zone within normal) */
  optimal?: OptimalRange;
};
