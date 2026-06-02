import { scaleLinear, scaleTime } from 'd3-scale';
import { Point, ChartDimensions } from '@/biomarker/types/chart-config.types';
import { BiomarkerValue } from '@/biomarker/types/biomarker-data.types';
import { SPARKLINE_INSETS } from '@/biomarker/constants/chart-dimensions';

/**
 * Scales data values to canvas pixel coordinates using d3-scale
 * @param values - Array of biomarker values
 * @param dimensions - Canvas dimensions
 * @param valueRange - Min and max values to scale (optional, will calculate from data)
 * @returns Array of points with x,y coordinates
 */
export function scaleDataToCanvas(
  values: BiomarkerValue[],
  dimensions: ChartDimensions,
  valueRange?: { min: number; max: number },
  options?: {
    horizontalPadding?: number;
    verticalPaddingTop?: number;
    verticalPaddingBottom?: number;
    /** Fractional padding to expand value domain (e.g., 0.08 for 8%) */
    valuePaddingPercent?: number;
  }
): Point[] {
  if (values.length === 0) {
    return [];
  }

  // Calculate value range if not provided
  const dataValues = values.map((v) => v.value);
  let minValue = valueRange?.min ?? Math.min(...dataValues);
  let maxValue = valueRange?.max ?? Math.max(...dataValues);
  const vp = options?.valuePaddingPercent ?? 0;
  if (vp > 0 && maxValue > minValue) {
    const span = maxValue - minValue;
    minValue = minValue - span * vp;
    maxValue = maxValue + span * vp;
  }

  // X scale: time-based with optional inner horizontal padding
  const dates = values.map((v) => v.date);
  const hPad = options?.horizontalPadding ?? SPARKLINE_INSETS.horizontal;
  const xScale = scaleTime()
    .domain([dates[0], dates[dates.length - 1]])
    .range([hPad, dimensions.width - hPad]);

  // Y scale: linear (inverted) with optional vertical padding
  const vPadTop = options?.verticalPaddingTop ?? SPARKLINE_INSETS.vertical;
  const vPadBottom = options?.verticalPaddingBottom ?? SPARKLINE_INSETS.vertical;
  const yScale = scaleLinear()
    .domain([minValue, maxValue])
    .range([dimensions.height - vPadBottom, vPadTop]);

  // Transform each data point to canvas coordinates
  return values.map((dataPoint) => ({
    x: xScale(dataPoint.date),
    y: yScale(dataPoint.value),
  }));
}
