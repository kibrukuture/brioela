import { BiomarkerData } from '@/biomarker/types/biomarker-data.types';

/**
 * Sample biomarker data for testing different scenarios
 */

// Biomarker WITH historical data and reference ranges (like Blood Glucose)
export const bloodGlucoseData: BiomarkerData = {
  id: '1',
  name: 'Blood glucose, averaged',
  currentValue: {
    value: 101.4,
    date: new Date('2025-07-01'),
    unit: 'mg/dL',
  },
  historicalValues: [
    { value: 65, date: new Date('2025-01-01'), unit: 'mg/dL' }, // below normal (orange)
    { value: 79, date: new Date('2025-02-01'), unit: 'mg/dL' }, // enters normal (green)
    { value: 92, date: new Date('2025-03-01'), unit: 'mg/dL' }, // normal (green)
    { value: 110, date: new Date('2025-04-01'), unit: 'mg/dL' }, // above normal (orange)
    { value: 99, date: new Date('2025-05-01'), unit: 'mg/dL' }, // back to normal (green)
    { value: 89.1, date: new Date('2025-06-01'), unit: 'mg/dL' }, // normal (green)
    { value: 101.4, date: new Date('2025-07-01'), unit: 'mg/dL' }, // normal (green)
  ],
  referenceRange: {
    normal: {
      min: 73.86,
      max: 109.9,
    },
    optimal: {
      min: 80,
      max: 100,
    },
  },
  status: 'normal',
};

// Biomarker WITH optimal zone (like BMI)
export const bmiData: BiomarkerData = {
  id: '2',
  name: 'Body Mass Index, averaged',
  currentValue: {
    value: 18.0,
    date: new Date('2025-08-01'),
    unit: 'kg/m²',
  },
  historicalValues: [
    // Low period
    { value: 16.9, date: new Date('2024-07-01'), unit: 'kg/m²' },
    { value: 17.5, date: new Date('2024-08-01'), unit: 'kg/m²' },
    { value: 18.0, date: new Date('2024-09-01'), unit: 'kg/m²' },
    { value: 18.4, date: new Date('2024-10-01'), unit: 'kg/m²' },
    // Enter normal (edge) → optimal band
    { value: 19.2, date: new Date('2024-11-01'), unit: 'kg/m²' },
    { value: 20.5, date: new Date('2024-12-01'), unit: 'kg/m²' },
    { value: 22.1, date: new Date('2025-01-01'), unit: 'kg/m²' },
    { value: 24.0, date: new Date('2025-02-01'), unit: 'kg/m²' },
    // Briefly high
    { value: 26.5, date: new Date('2025-03-01'), unit: 'kg/m²' },
    // Back into optimal
    { value: 24.8, date: new Date('2025-04-01'), unit: 'kg/m²' },
    { value: 23.9, date: new Date('2025-05-01'), unit: 'kg/m²' },
    { value: 23.4, date: new Date('2025-07-01'), unit: 'kg/m²' },
    // Drop back to low
    { value: 18.0, date: new Date('2025-08-01'), unit: 'kg/m²' },
  ],
  referenceRange: {
    normal: {
      min: 18.5,
      max: 29.99,
    },
    optimal: {
      min: 20,
      max: 25,
    },
  },
  status: 'low',
};

// Biomarker with HIGH status (like Heart Rate)
export const heartRateData: BiomarkerData = {
  id: '3',
  name: 'Heart rate, averaged',
  currentValue: {
    value: 95,
    date: new Date('2025-07-01'),
    unit: 'BPM',
  },
  historicalValues: [
    { value: 72, date: new Date('2025-02-01'), unit: 'BPM' },
    { value: 73, date: new Date('2025-03-01'), unit: 'BPM' },
    { value: 80, date: new Date('2025-04-01'), unit: 'BPM' },
    { value: 90, date: new Date('2025-05-01'), unit: 'BPM' },
    { value: 95, date: new Date('2025-07-01'), unit: 'BPM' },
    { value: 95, date: new Date('2025-07-01'), unit: 'BPM' },
  ],
  referenceRange: {
    normal: {
      min: 50,
      max: 100,
    },
    optimal: {
      min: 50,
      max: 70,
    },
  },
  status: 'high',
};

// Biomarker WITHOUT historical data (like Height)
export const heightData: BiomarkerData = {
  id: '4',
  name: 'Height',
  currentValue: {
    value: 1.81,
    date: new Date('2025-07-01'),
    unit: 'm',
  },
  status: 'normal',
};

// Biomarker WITHOUT reference range (like Weight)
export const weightData: BiomarkerData = {
  id: '5',
  name: 'Weight',
  currentValue: {
    value: 87.5,
    date: new Date('2025-06-01'),
    unit: 'kg',
  },
  status: 'normal',
};

/**
 * All sample biomarkers for demo
 */
export const allSampleBiomarkers: BiomarkerData[] = [
  bloodGlucoseData,
  bmiData,
  heartRateData,
  heightData,
  weightData,
];
