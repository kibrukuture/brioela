/**
 * Utility functions for parsing and formatting time strings
 */

import {
  setHoursOnDate,
  setMinutesOnDate,
  setSecondsOnDate,
  setMillisecondsOnDate,
  addHoursToDate,
} from '@/lib/date-time-utils';

/**
 * Cleans a time string by replacing Unicode spaces with regular spaces
 * @param timeString - The time string to clean (e.g., "9:00 AM")
 * @returns Cleaned time string with regular spaces
 */
export const cleanTimeString = (timeString: string): string => {
  // Replace all possible Unicode spaces and whitespace characters with regular spaces
  return timeString
    .replace(/[\u00A0\u2000-\u200B\u2028\u2029\u3000\uFEFF]/g, ' ') // Unicode spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

/**
 * Parses a time string in "HH:MM AM/PM" format
 * @param timeString - Time string to parse (e.g., "9:00 AM")
 * @returns Parsed time components
 */
export const parseTimeString = (
  timeString: string
): {
  hours: number;
  minutes: number;
  period: string;
  hour24: number;
} => {
  const cleanedTime = cleanTimeString(timeString);

  const timeParts = cleanedTime.split(' ');
  if (timeParts.length !== 2) {
    throw new Error(`Invalid time format - expected "HH:MM AM/PM", got: "${timeString}"`);
  }

  const [time, period] = timeParts;
  const [hours, minutes] = time.split(':').map(Number);

  // Validate time components
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 12 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time values - hours: ${hours}, minutes: ${minutes}`);
  }

  // Convert to 24-hour format
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) hour24 += 12;
  if (period === 'AM' && hours === 12) hour24 = 0;

  // Validate 24-hour conversion
  if (hour24 < 0 || hour24 > 23) {
    throw new Error(`Invalid 24-hour conversion - ${hours} ${period} = ${hour24}`);
  }

  return {
    hours,
    minutes,
    period,
    hour24,
  };
};

/**
 * Creates a Date object with the specified time on the given date
 * @param baseDate - The base date to set time on
 * @param timeString - Time string in "HH:MM AM/PM" format
 * @returns Date object with the specified time
 */
export const createDateWithTime = (baseDate: Date, timeString: string): Date => {
  const { hour24, minutes } = parseTimeString(timeString);

  let date = setHoursOnDate(baseDate, hour24);
  date = setMinutesOnDate(date, minutes);
  date = setSecondsOnDate(date, 0);
  date = setMillisecondsOnDate(date, 0);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date created from ${baseDate.toISOString()} + ${timeString}`);
  }

  return date;
};

/**
 * Creates start and end dates for calendar events
 * @param baseDate - The base date for the event
 * @param startTime - Start time string in "HH:MM AM/PM" format
 * @param endTime - End time string in "HH:MM AM/PM" format (optional)
 * @param defaultDurationHours - Default duration if no end time (default: 1)
 * @returns Object with startDate and endDate
 */
export const createEventDates = (
  baseDate: Date,
  startTime: string,
  endTime?: string,
  defaultDurationHours: number = 1
): {
  startDate: Date;
  endDate: Date;
} => {
  const startDate = createDateWithTime(baseDate, startTime);

  let endDate: Date;
  if (endTime) {
    endDate = createDateWithTime(baseDate, endTime);
  } else {
    // Use date-fns to add duration to start date
    endDate = addHoursToDate(startDate, defaultDurationHours);
  }

  // Validate date range
  if (startDate >= endDate) {
    throw new Error(
      `Start date (${startDate.toISOString()}) must be before end date (${endDate.toISOString()})`
    );
  }

  return { startDate, endDate };
};
