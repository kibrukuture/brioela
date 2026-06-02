import * as Calendar from 'expo-calendar';
import * as Burnt from 'burnt';
import { CALENDAR_CONFIG } from '@/constants';
import dayjs from 'dayjs';
import {
  addDaysToDate,
  setHoursOnDate,
  setMinutesOnDate,
  startOfDay,
  addMinutesToDate,
  getDay,
  getHours,
  getMinutes,
  isValid,
} from '@/lib/date-time-utils';

export interface CalendarEventData {
  title: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  location?: string;
  url?: string;
  // Recurring event properties
  isRecurring?: boolean;
  recurrenceRule?: string; // RRULE format
  recurrenceEndDate?: Date;
}

export interface CalendarSyncResult {
  success: boolean;
  eventId?: string;
  error?: string;
  warning?: string; // For cases where event was deleted by user
}

/**
 * Request calendar permissions
 */
export const requestCalendarPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();

    if (status !== 'granted') {
      Burnt.alert({
        title: 'Calendar Permission Required',
        message: 'Please enable calendar access in Settings to sync events.',
        preset: 'error',
        duration: 3,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting calendar permissions:', error);
    Burnt.alert({
      title: 'Permission Error',
      message: 'Failed to request calendar permissions.',
      preset: 'error',
      duration: 2,
    });
    return false;
  }
};

/**
 * Get a writable calendar for events
 */
export const getDefaultCalendar = async (): Promise<string | null> => {
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

    // Find a writable calendar (not read-only)
    const writableCalendar = calendars.find((cal) => cal.allowsModifications);

    // If no writable calendar exists, try to create one
    if (!writableCalendar) {
      try {
        const newCalendarId = await Calendar.createCalendarAsync({
          title: 'Schnl',
          color: '#3B82F6', // Blue color
          entityType: Calendar.EntityTypes.EVENT,
          sourceId: calendars[0]?.source?.id, // Use the first available source
          source: calendars[0]?.source,
          name: 'Schnl Calendar',
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });

        return newCalendarId;
      } catch (createError) {
        console.error('Error creating calendar:', createError);
        Burnt.alert({
          title: 'No Writable Calendar',
          message:
            'Please create a writable calendar in your device settings or check calendar permissions.',
          preset: 'error',
          duration: 3,
        });
        return null;
      }
    }

    return writableCalendar.id;
  } catch (error) {
    console.error('Error getting writable calendar:', error);
    return null;
  }
};

/**
 * Create a calendar event
 */
export const createCalendarEvent = async (
  eventData: CalendarEventData
): Promise<CalendarSyncResult> => {
  try {
    // Validate dates before creating event
    if (!eventData.startDate || !eventData.endDate) {
      return { success: false, error: 'Start date and end date are required' };
    }

    if (!isValid(eventData.startDate) || !isValid(eventData.endDate)) {
      return { success: false, error: 'Invalid date values' };
    }

    if (eventData.startDate >= eventData.endDate) {
      return { success: false, error: 'Start date must be before end date' };
    }

    // Request permissions first
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      return { success: false, error: 'Permission denied' };
    }

    // Get default calendar
    const calendarId = await getDefaultCalendar();
    if (!calendarId) {
      return { success: false, error: 'No calendar available' };
    }

    // Create the event with Schnl identifier to avoid circular sync
    const notesWithIdentifier = eventData.notes
      ? `${eventData.notes}\n\n${CALENDAR_CONFIG.SCHNL_IDENTIFIER}`
      : CALENDAR_CONFIG.SCHNL_IDENTIFIER;

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: eventData.title,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      notes: notesWithIdentifier,
      location: eventData.location,
      url: eventData.url,
    });

    return { success: true, eventId };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Update a calendar event
 */
export const updateCalendarEvent = async (
  eventId: string,
  eventData: CalendarEventData
): Promise<CalendarSyncResult> => {
  try {
    // Request permissions first
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      return { success: false, error: 'Permission denied' };
    }

    // Update the event
    await Calendar.updateEventAsync(eventId, {
      title: eventData.title,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      notes: eventData.notes,
      location: eventData.location,
      url: eventData.url,
    });

    return { success: true, eventId };
  } catch (error) {
    console.error('Error updating calendar event:', error);

    // Handle specific error cases gracefully
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If event doesn't exist (user deleted it manually), treat as success
    if (
      errorMessage.includes('could not be found') ||
      errorMessage.includes('Object not found') ||
      (errorMessage.includes('Event with id') && errorMessage.includes('could not be found'))
    ) {
      console.warn('Calendar event was deleted by user, treating as success:', eventId);
      return { success: true, eventId, warning: 'Event was deleted by user' };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (eventId: string): Promise<CalendarSyncResult> => {
  try {
    // Request permissions first
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      return { success: false, error: 'Permission denied' };
    }

    // Delete the event
    await Calendar.deleteEventAsync(eventId);

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);

    // Handle specific error cases gracefully
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If event doesn't exist (user deleted it manually), treat as success
    if (
      errorMessage.includes('could not be found') ||
      errorMessage.includes('Object not found') ||
      (errorMessage.includes('Event with id') && errorMessage.includes('could not be found'))
    ) {
      console.warn('Calendar event was already deleted by user, treating as success:', eventId);
      return { success: true, warning: 'Event was already deleted by user' };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Format date for calendar events
 */
export const formatCalendarDate = (date: Date, time?: string): Date => {
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    return setHoursOnDate(setMinutesOnDate(startOfDay(date), minutes), hours);
  } else {
    // Default to 9 AM if no time specified
    return setHoursOnDate(setMinutesOnDate(startOfDay(date), 0), 9);
  }
};

/**
 * Calculate end date for calendar events
 */
export const calculateEndDate = (startDate: Date, durationMinutes: number = 60): Date => {
  return addMinutesToDate(startDate, durationMinutes);
};

/**
 * Create RRULE for recurring events
 */
export const createRecurrenceRule = (
  daysOfWeek: string[], // ['MO', 'WE', 'FR']
  endDate: Date
): string => {
  // Convert day names to RRULE format
  const dayMap: { [key: string]: string } = {
    Monday: 'MO',
    Tuesday: 'TU',
    Wednesday: 'WE',
    Thursday: 'TH',
    Friday: 'FR',
    Saturday: 'SA',
    Sunday: 'SU',
  };

  const rruleDays = daysOfWeek.map((day) => dayMap[day] || day).join(',');

  // Format end date as YYYYMMDD
  const endDateStr = endDate.toISOString().slice(0, 10).replace(/-/g, '');

  return `FREQ=WEEKLY;BYDAY=${rruleDays};UNTIL=${endDateStr}`;
};

/**
 * Create calendar event data for classes (recurring by creating multiple events)
 */
export const createClassCalendarEvent = (
  className: string,
  courseCode: string,
  schedule: { days: string[]; startTime: string; endTime: string }[], // Schedule array from class
  semester: { startDate: Date; endDate: Date }, // Semester object
  location?: string,
  professor?: string,
  onlineLink?: string,
  notes?: string
): CalendarEventData[] => {
  const events: CalendarEventData[] = [];

  // Group schedule by days of week
  const scheduleByDay: { [key: string]: { days: string[]; startTime: string; endTime: string }[] } =
    {};

  schedule.forEach((item) => {
    item.days.forEach((day: string) => {
      if (!scheduleByDay[day]) {
        scheduleByDay[day] = [];
      }
      scheduleByDay[day].push(item);
    });
  });

  // Create multiple events for each day group (weekly recurrence)
  Object.entries(scheduleByDay).forEach(([day, daySchedule]) => {
    const firstSchedule = daySchedule[0];
    const startTime = firstSchedule.startTime;
    const endTime = firstSchedule.endTime;

    // Generate events for each week of the semester
    const semesterStart = semester.startDate;
    const semesterEnd = semester.endDate;

    // Find the first occurrence of this day in the semester
    const firstOccurrence = startOfDay(semesterStart);
    const dayOfWeek = getDayOfWeekNumber(day);

    // Find the first occurrence of the target day
    let currentDate = firstOccurrence;
    while (getDay(currentDate) !== dayOfWeek) {
      currentDate = addDaysToDate(currentDate, 1);
    }

    // Create events for each week until semester end
    let weekCount = 0;
    const maxWeeks = 20; // Safety limit

    while (currentDate <= semesterEnd && weekCount < maxWeeks) {
      const eventStart = setHoursOnDate(
        setMinutesOnDate(startOfDay(currentDate), getMinutes(dayjs(startTime).toDate())),
        getHours(dayjs(startTime).toDate())
      );
      const eventEnd = setHoursOnDate(
        setMinutesOnDate(startOfDay(currentDate), getMinutes(dayjs(endTime).toDate())),
        getHours(dayjs(endTime).toDate())
      );

      const eventData: CalendarEventData = {
        title: `${className}${courseCode ? ` (${courseCode})` : ''}`,
        startDate: eventStart,
        endDate: eventEnd,
        notes: notes?.trim() || undefined,
        location: location?.trim() || undefined,
        url: onlineLink?.trim() || undefined,
        isRecurring: false, // Individual events, not RRULE
      };

      events.push(eventData);

      // Move to next week
      currentDate = addDaysToDate(currentDate, 7);
      weekCount++;
    }
  });

  return events;
};

/**
 * Convert day name to day of week number (0 = Sunday, 1 = Monday, etc.)
 * Handles both abbreviated ('mon', 'tue') and full ('Monday', 'Tuesday') formats
 */
const getDayOfWeekNumber = (dayName: string): number => {
  const dayMap: { [key: string]: number } = {
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    sun: 0,
  };

  const dayNumber = dayMap[dayName];
  if (dayNumber === undefined) {
    throw new Error(`Invalid day: ${dayName}. Expected one of: ${Object.keys(dayMap).join(', ')}`);
  }

  return dayNumber;
};

/**
 * Create calendar event data for one-time events
 */
export const createOneTimeCalendarEvent = (
  title: string,
  startDate: Date,
  endDate: Date,
  location?: string,
  notes?: string,
  url?: string
): CalendarEventData => {
  return {
    title,
    startDate,
    endDate,
    notes: notes?.trim() || undefined,
    location: location?.trim() || undefined,
    url: url?.trim() || undefined,
    isRecurring: false,
  };
};
