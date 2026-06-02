import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

// Initialize plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

/**
 * Returns current date/time using Day.js
 
 */
export function now(): Date {
  return dayjs().toDate();
}

/**
 * Returns current dayjs object (for internal use)
 */
function nowDayjs(): Dayjs {
  return dayjs();
}

/**
 * Internal helper: Safely converts any input to a valid Dayjs object
 */
function toSafeDayjs(input: any): Dayjs {
  try {
    // Null or undefined
    if (input == null) {
      console.warn('Null/undefined date input, using current date');
      return nowDayjs();
    }

    // Already a Dayjs object
    if (dayjs.isDayjs(input)) {
      return input.isValid() ? input : nowDayjs();
    }

    // Date object
    if (input instanceof Date) {
      const d = dayjs(input);
      return d.isValid() ? d : nowDayjs();
    }

    // String input
    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (!trimmed) {
        console.warn('Empty date string, using current date');
        return nowDayjs();
      }

      // Try parsing the string
      const parsed = dayjs(trimmed);
      if (parsed.isValid()) {
        return parsed;
      }

      // Try ISO format explicitly
      const isoParsed = dayjs(trimmed, 'YYYY-MM-DD', true);
      if (isoParsed.isValid()) {
        return isoParsed;
      }

      console.warn('Could not parse date string, using current date:', trimmed);
      return nowDayjs();
    }

    // Number input (timestamp)
    if (typeof input === 'number' && !isNaN(input)) {
      const d = dayjs(input);
      return d.isValid() ? d : nowDayjs();
    }

    // Unknown type
    console.warn('Invalid date input type, using current date:', typeof input);
    return nowDayjs();
  } catch (error) {
    console.error('Error converting to Dayjs:', error);
    return nowDayjs();
  }
}

/**
 * Internal helper: Validates and parses a time string
 */
function parseTimeString(timeString: string): { hours: number; minutes: number } | null {
  try {
    const cleaned = timeString
      .replace(/[\u00A0\u2000-\u200B\u2028\u2029\u3000\uFEFF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return null;

    // Handle 24-hour format (14:30)
    if (/^\d{1,2}:\d{2}$/.test(cleaned)) {
      const [hoursStr, minutesStr] = cleaned.split(':');
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return { hours, minutes };
      }
      return null;
    }

    // Handle 12-hour format (2:30 PM)
    const parts = cleaned.split(' ');
    if (parts.length !== 2) return null;

    const [timePart, period] = parts;
    const periodUpper = period.toUpperCase();

    if (periodUpper !== 'AM' && periodUpper !== 'PM') return null;

    const [hoursStr, minutesStr] = timePart.split(':');
    if (!hoursStr || !minutesStr) return null;

    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;

    // Convert to 24-hour format
    if (periodUpper === 'PM' && hours !== 12) {
      hours += 12;
    } else if (periodUpper === 'AM' && hours === 12) {
      hours = 0;
    }

    return { hours, minutes };
  } catch (error) {
    console.error('Error parsing time string:', error);
    return null;
  }
}

// ==================== EXPORTED FUNCTIONS ====================

/**
 * Re-export Day.js functions that match date-fns API
 */
export function startOfDay(date: Date): Date {
  try {
    return toSafeDayjs(date).startOf('day').toDate();
  } catch (error) {
    console.error('Error getting start of day:', error);
    return nowDayjs().startOf('day').toDate();
  }
}

export function endOfDay(date: Date): Date {
  try {
    return toSafeDayjs(date).endOf('day').toDate();
  } catch (error) {
    console.error('Error getting end of day:', error);
    return nowDayjs().endOf('day').toDate();
  }
}

export function setHours(date: Date, hours: number): Date {
  try {
    const safeHours =
      typeof hours === 'number' && !isNaN(hours) ? Math.max(0, Math.min(23, Math.floor(hours))) : 0;
    return toSafeDayjs(date).hour(safeHours).toDate();
  } catch (error) {
    console.error('Error setting hours:', error);
    return toSafeDayjs(date).toDate();
  }
}

export function setMinutes(date: Date, minutes: number): Date {
  try {
    const safeMinutes =
      typeof minutes === 'number' && !isNaN(minutes)
        ? Math.max(0, Math.min(59, Math.floor(minutes)))
        : 0;
    return toSafeDayjs(date).minute(safeMinutes).toDate();
  } catch (error) {
    console.error('Error setting minutes:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Cleans a time string by replacing Unicode spaces with regular spaces
 */
export function cleanTimeString(timeString: string): string {
  try {
    if (typeof timeString !== 'string') {
      return '';
    }

    return timeString
      .replace(/[\u00A0\u2000-\u200B\u2028\u2029\u3000\uFEFF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    console.error('Error cleaning time string:', error);
    return '';
  }
}

/**
 * Creates a local Date object from a given date and time string.
 * Ensures consistent local time interpretation.
 */
export function createLocalDateTime(date: Date, timeString: string): Date {
  try {
    const safeDayjs = toSafeDayjs(date);

    if (typeof timeString !== 'string' || !timeString.trim()) {
      return safeDayjs.endOf('day').toDate();
    }

    const parsedTime = parseTimeString(timeString);
    if (!parsedTime) {
      console.warn('Invalid time string, using end of day:', timeString);
      return safeDayjs.endOf('day').toDate();
    }

    return safeDayjs
      .hour(parsedTime.hours)
      .minute(parsedTime.minutes)
      .second(0)
      .millisecond(0)
      .toDate();
  } catch (error) {
    console.error('Error creating local date time:', error);
    return toSafeDayjs(date).endOf('day').toDate();
  }
}

/**
 * UNIVERSAL function for ALL date/time combinations using Day.js
 * Works for assignments, exams, events, tasks, classes - EVERYTHING
 * ALWAYS uses local timezone - NO MORE CONFUSION
 */
export function combineDateAndTime(date: Date, timeString?: string): Date {
  try {
    const safeDayjs = toSafeDayjs(date);

    if (!timeString || timeString.trim() === '') {
      return safeDayjs.endOf('day').toDate();
    }

    return createLocalDateTime(date, timeString);
  } catch (error) {
    console.error('Error combining date and time:', error);
    return toSafeDayjs(date).endOf('day').toDate();
  }
}

/**
 * Checks if a date is in the future (local time)
 */
export function isFutureDate(date: Date): boolean {
  try {
    return toSafeDayjs(date).isAfter(nowDayjs());
  } catch (error) {
    console.error('Error checking if date is in future:', error);
    return false;
  }
}

/**
 * Adds minutes to a date
 */
export function addMinutesToDate(date: Date, minutes: number): Date {
  try {
    const safeMinutes = typeof minutes === 'number' && !isNaN(minutes) ? minutes : 0;
    return toSafeDayjs(date).add(safeMinutes, 'minute').toDate();
  } catch (error) {
    console.error('Error adding minutes:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Adds hours to a date
 */
export function addHoursToDate(date: Date, hours: number): Date {
  try {
    const safeHours = typeof hours === 'number' && !isNaN(hours) ? hours : 0;
    return toSafeDayjs(date).add(safeHours, 'hour').toDate();
  } catch (error) {
    console.error('Error adding hours:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Adds days to a date
 */
export function addDaysToDate(date: Date, days: number): Date {
  try {
    const safeDays = typeof days === 'number' && !isNaN(days) ? days : 0;
    return toSafeDayjs(date).add(safeDays, 'day').toDate();
  } catch (error) {
    console.error('Error adding days:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Sets date to midnight (00:00:00)
 */
export function setToMidnight(date: Date): Date {
  try {
    return toSafeDayjs(date).startOf('day').toDate();
  } catch (error) {
    console.error('Error setting to midnight:', error);
    return nowDayjs().startOf('day').toDate();
  }
}

/**
 * Sets date to noon (12:00:00)
 */
export function setToNoon(date: Date): Date {
  try {
    return toSafeDayjs(date).hour(12).minute(0).second(0).millisecond(0).toDate();
  } catch (error) {
    console.error('Error setting to noon:', error);
    return nowDayjs().hour(12).minute(0).second(0).millisecond(0).toDate();
  }
}

/**
 * Sets specific hours on a date
 */
export function setHoursOnDate(date: Date, hours: number): Date {
  try {
    const safeHours =
      typeof hours === 'number' && !isNaN(hours) ? Math.max(0, Math.min(23, Math.floor(hours))) : 0;
    return toSafeDayjs(date).hour(safeHours).toDate();
  } catch (error) {
    console.error('Error setting hours:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Sets specific minutes on a date
 */
export function setMinutesOnDate(date: Date, minutes: number): Date {
  try {
    const safeMinutes =
      typeof minutes === 'number' && !isNaN(minutes)
        ? Math.max(0, Math.min(59, Math.floor(minutes)))
        : 0;
    return toSafeDayjs(date).minute(safeMinutes).toDate();
  } catch (error) {
    console.error('Error setting minutes:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Sets specific seconds on a date
 */
export function setSecondsOnDate(date: Date, seconds: number): Date {
  try {
    const safeSeconds =
      typeof seconds === 'number' && !isNaN(seconds)
        ? Math.max(0, Math.min(59, Math.floor(seconds)))
        : 0;
    return toSafeDayjs(date).second(safeSeconds).toDate();
  } catch (error) {
    console.error('Error setting seconds:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Sets specific milliseconds on a date
 */
export function setMillisecondsOnDate(date: Date, milliseconds: number): Date {
  try {
    const safeMs =
      typeof milliseconds === 'number' && !isNaN(milliseconds)
        ? Math.max(0, Math.min(999, Math.floor(milliseconds)))
        : 0;
    return toSafeDayjs(date).millisecond(safeMs).toDate();
  } catch (error) {
    console.error('Error setting milliseconds:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Parses a date string into a Date object
 */
export function parseDate(dateString: string): Date {
  try {
    if (typeof dateString !== 'string') {
      console.warn('Invalid date string type, using current date');
      return now();
    }

    const trimmed = dateString.trim();
    if (!trimmed) {
      console.warn('Empty date string, using current date');
      return now();
    }

    const parsed = dayjs(trimmed);
    if (parsed.isValid()) {
      return parsed.toDate();
    }

    console.warn('Could not parse date string, using current date:', dateString);
    return now();
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return now();
  }
}

/**
 * Formats a date to "h:mm a" (e.g., "2:30 PM")
 */
export function formatTime(date: Date): string {
  try {
    return toSafeDayjs(date).format('h:mm A');
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
}

/**
 * Formats a date to "yyyy-MM-dd" (e.g., "2024-10-11")
 */
export function formatDateISO(date: Date): string {
  try {
    return toSafeDayjs(date).format('YYYY-MM-DD');
  } catch (error) {
    console.error('Error formatting date ISO:', error);
    return '';
  }
}

/**
 * Formats a date to "MMM d, yyyy" (e.g., "Oct 11, 2024")
 */
export function formatDate(date: Date): string {
  try {
    return toSafeDayjs(date).format('MMM D, YYYY');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Formats a date to "EEE, MMM d, yyyy" (e.g., "Mon, Oct 11, 2024")
 */
export function formatDateWithDay(date: Date): string {
  try {
    return toSafeDayjs(date).format('ddd, MMM D, YYYY');
  } catch (error) {
    console.error('Error formatting date with day:', error);
    return '';
  }
}

/**
 * Parses a time string and returns a Date object with that time on the reference date
 * Similar to date-fns parse function: parse(timeString, 'h:mm a', referenceDate)
 */
export function parseTime(timeString: string, referenceDate: Date = now()): Date {
  try {
    const parsedTime = parseTimeString(timeString);
    if (!parsedTime) {
      console.warn('Invalid time string, using reference date:', timeString);
      return referenceDate;
    }

    return toSafeDayjs(referenceDate)
      .hour(parsedTime.hours)
      .minute(parsedTime.minutes)
      .second(0)
      .millisecond(0)
      .toDate();
  } catch (error) {
    console.error('Error parsing time:', error);
    return referenceDate;
  }
}

// ==================== BONUS DAY.JS FEATURES ====================

/**
 * Returns relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function timeAgo(date: Date): string {
  try {
    return toSafeDayjs(date).fromNow();
  } catch (error) {
    console.error('Error getting relative time:', error);
    return '';
  }
}

/**
 * Returns relative time string from a specific date
 */
export function timeFrom(date: Date, compareDate: Date): string {
  try {
    return toSafeDayjs(date).from(toSafeDayjs(compareDate));
  } catch (error) {
    console.error('Error getting relative time from date:', error);
    return '';
  }
}

/**
 * Checks if a date is before another date
 */
export function isBefore(date: Date, compareDate: Date): boolean {
  try {
    return toSafeDayjs(date).isBefore(toSafeDayjs(compareDate));
  } catch (error) {
    console.error('Error checking if before:', error);
    return false;
  }
}

/**
 * Checks if a date is after another date
 */
export function isAfter(date: Date, compareDate: Date): boolean {
  try {
    return toSafeDayjs(date).isAfter(toSafeDayjs(compareDate));
  } catch (error) {
    console.error('Error checking if after:', error);
    return false;
  }
}

/**
 * Checks if a date is the same as another date
 */
export function isSame(date: Date, compareDate: Date, unit: string = 'day'): boolean {
  try {
    return toSafeDayjs(date).isSame(toSafeDayjs(compareDate), unit as any);
  } catch (error) {
    console.error('Error checking if same:', error);
    return false;
  }
}

/**
 * Checks if a date is between two dates
 */
export function isDateBetween(date: Date, startDate: Date, endDate: Date): boolean {
  try {
    return toSafeDayjs(date).isBetween(toSafeDayjs(startDate), toSafeDayjs(endDate));
  } catch (error) {
    console.error('Error checking if between:', error);
    return false;
  }
}

/**
 * Gets the difference between two dates in specified unit
 */
export function diff(date1: Date, date2: Date, unit: string = 'day'): number {
  try {
    return toSafeDayjs(date1).diff(toSafeDayjs(date2), unit as any);
  } catch (error) {
    console.error('Error calculating difference:', error);
    return 0;
  }
}

/**
 * Gets the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getDay(date: Date): number {
  try {
    return toSafeDayjs(date).day();
  } catch (error) {
    console.error('Error getting day of week:', error);
    return 0;
  }
}

/**
 * Gets the hours from a date (0-23)
 */
export function getHours(date: Date): number {
  try {
    return toSafeDayjs(date).hour();
  } catch (error) {
    console.error('Error getting hours:', error);
    return 0;
  }
}

/**
 * Gets the minutes from a date (0-59)
 */
export function getMinutes(date: Date): number {
  try {
    return toSafeDayjs(date).minute();
  } catch (error) {
    console.error('Error getting minutes:', error);
    return 0;
  }
}

/**
 * Checks if a date is valid
 */
export function isValid(date: Date): boolean {
  try {
    return toSafeDayjs(date).isValid();
  } catch (error) {
    console.error('Error checking date validity:', error);
    return false;
  }
}

/**
 * Gets the year from a date
 */
export function getYear(date: Date): number {
  try {
    return toSafeDayjs(date).year();
  } catch (error) {
    console.error('Error getting year:', error);
    return nowDayjs().year();
  }
}

/**
 * Gets the month from a date (0-11, where 0 = January)
 */
export function getMonth(date: Date): number {
  try {
    return toSafeDayjs(date).month();
  } catch (error) {
    console.error('Error getting month:', error);
    return nowDayjs().month();
  }
}

/**
 * Returns relative time string from now (e.g., "2 hours ago", "in 3 days")
 * Similar to date-fns formatDistanceToNow
 */
export function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  try {
    if (options?.addSuffix === false) {
      return toSafeDayjs(date).fromNow(true);
    }
    return toSafeDayjs(date).fromNow();
  } catch (error) {
    console.error('Error formatting distance to now:', error);
    return '';
  }
}

/**
 * Subtracts hours from a date
 */
export function subHours(date: Date, hours: number): Date {
  try {
    const safeHours = typeof hours === 'number' && !isNaN(hours) ? hours : 0;
    return toSafeDayjs(date).subtract(safeHours, 'hour').toDate();
  } catch (error) {
    console.error('Error subtracting hours:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Checks if a date is today
 */
export function isToday(date: Date): boolean {
  try {
    return toSafeDayjs(date).isSame(nowDayjs(), 'day');
  } catch (error) {
    console.error('Error checking if today:', error);
    return false;
  }
}

/**
 * Formats a date to day name (e.g., "MON", "TUE")
 */
export function formatDayName(date: Date): string {
  try {
    return toSafeDayjs(date).format('ddd').toUpperCase();
  } catch (error) {
    console.error('Error formatting day name:', error);
    return '';
  }
}

/**
 * Formats a date to day number (e.g., "1", "15", "31")
 */
export function formatDayNumber(date: Date): string {
  try {
    return toSafeDayjs(date).format('D');
  } catch (error) {
    console.error('Error formatting day number:', error);
    return '';
  }
}

/**
 * Gets the difference in days between two dates
 */
export function differenceInDays(date1: Date, date2: Date): number {
  try {
    return toSafeDayjs(date1).diff(toSafeDayjs(date2), 'day');
  } catch (error) {
    console.error('Error calculating difference in days:', error);
    return 0;
  }
}

/**
 * Gets the start of the week (Sunday by default, or Monday if weekStartsOn: 1)
 */
export function startOfWeek(date: Date, options?: { weekStartsOn?: number }): Date {
  try {
    if (options?.weekStartsOn === 1) {
      // Monday start
      return toSafeDayjs(date).startOf('week').add(1, 'day').toDate();
    }
    // Sunday start (default)
    return toSafeDayjs(date).startOf('week').toDate();
  } catch (error) {
    console.error('Error getting start of week:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Gets the end of the week (Saturday by default, or Sunday if weekStartsOn: 1)
 */
export function endOfWeek(date: Date, options?: { weekStartsOn?: number }): Date {
  try {
    if (options?.weekStartsOn === 1) {
      // Monday start, so end is Sunday
      return toSafeDayjs(date).endOf('week').add(1, 'day').toDate();
    }
    // Sunday start, so end is Saturday (default)
    return toSafeDayjs(date).endOf('week').toDate();
  } catch (error) {
    console.error('Error getting end of week:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Subtracts days from a date
 */
export function subDays(date: Date, days: number): Date {
  try {
    const safeDays = typeof days === 'number' && !isNaN(days) ? days : 0;
    return toSafeDayjs(date).subtract(safeDays, 'day').toDate();
  } catch (error) {
    console.error('Error subtracting days:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Formats a date to full day name (e.g., "Monday", "Tuesday")
 */
export function formatDayNameFull(date: Date): string {
  try {
    return toSafeDayjs(date).format('dddd');
  } catch (error) {
    console.error('Error formatting full day name:', error);
    return '';
  }
}

/**
 * Formats a date to "MMM d" (e.g., "Oct 11")
 */
export function formatDateShort(date: Date): string {
  try {
    return toSafeDayjs(date).format('MMM D');
  } catch (error) {
    console.error('Error formatting short date:', error);
    return '';
  }
}

/**
 * Checks if two dates are equal
 */
export function isEqual(date1: Date, date2: Date): boolean {
  try {
    return toSafeDayjs(date1).isSame(toSafeDayjs(date2));
  } catch (error) {
    console.error('Error checking date equality:', error);
    return false;
  }
}

/**
 * Gets the date of the month (1-31)
 */
export function getDate(date: Date): number {
  try {
    return toSafeDayjs(date).date();
  } catch (error) {
    console.error('Error getting date:', error);
    return 1;
  }
}

/**
 * Gets the difference in milliseconds between two dates
 */
export function differenceInMilliseconds(date1: Date, date2: Date): number {
  try {
    return toSafeDayjs(date1).diff(toSafeDayjs(date2), 'millisecond');
  } catch (error) {
    console.error('Error calculating difference in milliseconds:', error);
    return 0;
  }
}

/**
 * Sets the year on a date
 */
export function setYear(date: Date, year: number): Date {
  try {
    const safeYear = typeof year === 'number' && !isNaN(year) ? year : nowDayjs().year();
    return toSafeDayjs(date).year(safeYear).toDate();
  } catch (error) {
    console.error('Error setting year:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Sets the month on a date (0-11, where 0 = January)
 */
export function setMonth(date: Date, month: number): Date {
  try {
    const safeMonth =
      typeof month === 'number' && !isNaN(month) ? Math.max(0, Math.min(11, Math.floor(month))) : 0;
    return toSafeDayjs(date).month(safeMonth).toDate();
  } catch (error) {
    console.error('Error setting month:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Sets the date of the month on a date (1-31)
 */
export function setDate(date: Date, day: number): Date {
  try {
    const safeDay =
      typeof day === 'number' && !isNaN(day) ? Math.max(1, Math.min(31, Math.floor(day))) : 1;
    return toSafeDayjs(date).date(safeDay).toDate();
  } catch (error) {
    console.error('Error setting date:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Formats a date with custom format string
 */
export function format(date: Date, formatStr: string): string {
  try {
    return toSafeDayjs(date).format(formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Checks if a date is in the past
 */
export function isPast(date: Date): boolean {
  try {
    return toSafeDayjs(date).isBefore(nowDayjs());
  } catch (error) {
    console.error('Error checking if past:', error);
    return false;
  }
}

/**
 * Checks if a date is tomorrow
 */
export function isTomorrow(date: Date): boolean {
  try {
    return toSafeDayjs(date).isSame(nowDayjs().add(1, 'day'), 'day');
  } catch (error) {
    console.error('Error checking if tomorrow:', error);
    return false;
  }
}

/**
 * Checks if a date is yesterday
 */
export function isYesterday(date: Date): boolean {
  try {
    return toSafeDayjs(date).isSame(nowDayjs().subtract(1, 'day'), 'day');
  } catch (error) {
    console.error('Error checking if yesterday:', error);
    return false;
  }
}

/**
 * Gets the start of the month
 */
export function startOfMonth(date: Date): Date {
  try {
    return toSafeDayjs(date).startOf('month').toDate();
  } catch (error) {
    console.error('Error getting start of month:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Gets the end of the month
 */
export function endOfMonth(date: Date): Date {
  try {
    return toSafeDayjs(date).endOf('month').toDate();
  } catch (error) {
    console.error('Error getting end of month:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Gets the start of today
 */
export function startOfToday(): Date {
  try {
    return nowDayjs().startOf('day').toDate();
  } catch (error) {
    console.error('Error getting start of today:', error);
    return nowDayjs().toDate();
  }
}

/**
 * Gets the difference in calendar days between two dates
 */
export function differenceInCalendarDays(date1: Date, date2: Date): number {
  try {
    return toSafeDayjs(date1).diff(toSafeDayjs(date2), 'day');
  } catch (error) {
    console.error('Error calculating difference in calendar days:', error);
    return 0;
  }
}

/**
 * Adds months to a date
 */
export function addMonths(date: Date, months: number): Date {
  try {
    const safeMonths = typeof months === 'number' && !isNaN(months) ? months : 0;
    return toSafeDayjs(date).add(safeMonths, 'month').toDate();
  } catch (error) {
    console.error('Error adding months:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Subtracts months from a date
 */
export function subMonths(date: Date, months: number): Date {
  try {
    const safeMonths = typeof months === 'number' && !isNaN(months) ? months : 0;
    return toSafeDayjs(date).subtract(safeMonths, 'month').toDate();
  } catch (error) {
    console.error('Error subtracting months:', error);
    return toSafeDayjs(date).toDate();
  }
}

/**
 * Gets all days in an interval between two dates
 */
export function eachDayOfInterval(interval: { start: Date; end: Date }): Date[] {
  try {
    const days: Date[] = [];
    let current = toSafeDayjs(interval.start);
    const end = toSafeDayjs(interval.end);

    while (current.isSameOrBefore(end, 'day')) {
      days.push(current.toDate());
      current = current.add(1, 'day');
    }

    return days;
  } catch (error) {
    console.error('Error getting days in interval:', error);
    return [];
  }
}

export function getAssignmentDateTime(assignment: any): Date {
  try {
    if (!assignment?.dueDate) {
      return nowDayjs().toDate();
    }

    const safeDayjs = toSafeDayjs(assignment.dueDate);

    if (!assignment.dueTime) {
      return safeDayjs.endOf('day').toDate();
    }

    const parsedTime = parseTimeString(assignment.dueTime);
    if (!parsedTime) {
      return safeDayjs.endOf('day').toDate();
    }

    // FIX: Don't reset to midnight first - preserve the date!
    return safeDayjs
      .hour(parsedTime.hours)
      .minute(parsedTime.minutes)
      .second(0)
      .millisecond(0)
      .toDate();
  } catch (error) {
    console.error('Error getting assignment date time:', error);
    return nowDayjs().toDate();
  }
}

export function getExamDateTime(exam: any): Date {
  try {
    if (!exam?.date) {
      return nowDayjs().toDate();
    }

    const safeDayjs = toSafeDayjs(exam.date);

    if (!exam.startTime) {
      return safeDayjs.toDate();
    }

    const parsedTime = parseTimeString(exam.startTime);
    if (!parsedTime) {
      return safeDayjs.toDate();
    }

    // FIX: Same here - preserve the date!
    return safeDayjs
      .hour(parsedTime.hours)
      .minute(parsedTime.minutes)
      .second(0)
      .millisecond(0)
      .toDate();
  } catch (error) {
    console.error('Error getting exam date time:', error);
    return nowDayjs().toDate();
  }
}

export function getEventDateTime(event: any): Date {
  try {
    if (!event?.date) {
      return nowDayjs().toDate();
    }

    const safeDayjs = toSafeDayjs(event.date);

    if (!event.startTime) {
      return safeDayjs.toDate();
    }

    const parsedTime = parseTimeString(event.startTime);
    if (!parsedTime) {
      return safeDayjs.toDate();
    }

    // FIX: And here!
    return safeDayjs
      .hour(parsedTime.hours)
      .minute(parsedTime.minutes)
      .second(0)
      .millisecond(0)
      .toDate();
  } catch (error) {
    console.error('Error getting event date time:', error);
    return nowDayjs().toDate();
  }
}
