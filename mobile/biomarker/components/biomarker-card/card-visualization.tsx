import React from 'react';
import { BiomarkerData } from '@/biomarker/types/biomarker-data.types';
import { ChartDimensions } from '@/biomarker/types/chart-config.types';
import { SparklineChart } from '@/biomarker/components/biomarker-card/sparkline-chart';
import { SingleValueIndicator } from '@/biomarker/components/biomarker-card/single-value-indicator';

type CardVisualizationProps = {
  /** Complete biomarker data */
  data: BiomarkerData;
  /** Canvas dimensions */
  dimensions: ChartDimensions;
};

/**
 * Decides which visualization to show based on data availability
 * - SparklineChart: if historical data exists
 * - SingleValueIndicator: if no historical data
 */
export function CardVisualization({ data, dimensions }: CardVisualizationProps) {
  const hasHistoricalData = data.historicalValues && data.historicalValues.length > 0;

  if (hasHistoricalData) {
    return (
      <SparklineChart
        historicalValues={data.historicalValues!}
        referenceRange={data.referenceRange}
        dimensions={dimensions}
        status={data.status}
      />
    );
  }

  return <SingleValueIndicator dimensions={dimensions} status={data.status} />;
}
