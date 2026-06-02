/**
 * Formats a biomarker value with its unit for display
 * @param value - The numeric value
 * @param unit - The unit of measurement (nullable)
 * @returns Formatted string (e.g., "93.20 mg/dL" or "93.20" if no unit)
 */
export function formatBiomarkerValue(value: number, unit: string | null | undefined): string {
  // Format number to 2 decimal places if needed
  const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(2);

  return unit ? `${formattedValue} ${unit}` : formattedValue;
}
