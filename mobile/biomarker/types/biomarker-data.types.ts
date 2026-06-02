// Biomarker Data Types (placeholder)
// Purpose: Defines types for biomarker entries, datasets, and value/units metadata.
// Note: Comments only; implementation deferred.

import { ReferenceRange } from './reference-range.types';

/**
 * Status of a biomarker value relative to reference ranges
 */
export type BiomarkerStatus = 'optimal' | 'normal' | 'high' | 'low';

/**
 * A single biomarker measurement at a point in time
 */
export type BiomarkerValue = {
  /** The measured value */
  value: number;
  /** When the measurement was taken */
  date: Date;
  /** Unit of measurement (e.g., "mg/dL", "mmol/L") */
  unit: string;
};

/**
 * Complete biomarker data including current value, history, and reference ranges
 */
export type BiomarkerData = {
  /** Unique identifier */
  id: string;
  /** Display name (e.g., "Blood glucose, averaged") */
  name: string;
  /** Current/most recent value */
  currentValue: BiomarkerValue;
  /** Historical values over time (optional) */
  historicalValues?: BiomarkerValue[];
  /** Reference ranges for this biomarker (optional) */
  referenceRange?: ReferenceRange;
  /** Current status based on value and ranges */
  status: BiomarkerStatus;
};
