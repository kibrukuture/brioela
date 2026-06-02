import dayjs from 'dayjs';

/**
 * Formats a date for display in biomarker cards
 * @param date - The date to format (Date object or string)
 * @returns Formatted date string (e.g., "Jun 2025")
 */
export function formatDate(date: Date | string): string {
  return dayjs(date).format('MMM YYYY');
}
