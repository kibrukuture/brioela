import dayjs from 'dayjs';
import {
  parseDate,
  now,
  formatTime,
  formatDateISO,
  isSame,
  setHoursOnDate,
  setMinutesOnDate,
  startOfDay,
  format,
} from '@/lib/date-time-utils';
import type { ClassSchemaType } from '@/schemas/realm/class-schema';
import type { HabitSchemaType } from '@/schemas/realm/habit-schema';
import type { ExternalCalendarEvent } from '@/lib/calendar-sync-service';

/**
 * Types of entries that should appear in the calendar
 */
export type CalendarEntryType =
  | 'class'
  | 'task'
  | 'assignment'
  | 'exam'
  | 'event'
  | 'habit'
  | 'external';

/**
 * Types of entries that should NOT appear in calendar (overview only)
 */
export type OverviewOnlyEntryType = 'note' | 'grade';

/**
 * Priority levels for calendar entries (minimal design approach)
 */
export type CalendarPriority = 'urgent' | 'high' | 'medium' | 'low';

/**
 * Status for calendar entries
 */
export type CalendarEntryStatus = 'upcoming' | 'overdue' | 'completed' | 'in-progress';

/**
 * Unified calendar entry interface
 */
export interface CalendarEntry {
  id: string;
  type: CalendarEntryType;
  title: string;
  time: string; // Display time (e.g., "9:00 AM")
  priority: CalendarPriority;
  status: CalendarEntryStatus;

  // Optional details
  location?: string;
  courseCode?: string;
  description?: string;

  // Visual indicators (minimal)
  isUrgent: boolean;
  isOverdue: boolean;

  // Original data reference
  originalData: unknown; // Reference to original Realm object
}

/**
 * Configuration for which entries appear in calendar
 */
export const CALENDAR_ENTRY_CONFIG = {
  // Entries that appear in calendar
  calendarEntries: [
    'class',
    'task',
    'assignment',
    'exam',
    'event',
    'habit',
    'external',
  ] as CalendarEntryType[],

  // Entries that only appear in overview
  overviewOnly: ['note', 'grade'] as OverviewOnlyEntryType[],

  // Priority mapping for different entry types
  priorityMapping: {
    exam: 'urgent' as CalendarPriority,
    assignment: 'high' as CalendarPriority,
    task: 'medium' as CalendarPriority,
    class: 'low' as CalendarPriority,
    event: 'medium' as CalendarPriority,
    habit: 'low' as CalendarPriority,
    external: 'medium' as CalendarPriority,
  },
} as const;

/**
 * Determine if an entry should appear in calendar based on its type
 */
export function shouldAppearInCalendar(entryType: string): entryType is CalendarEntryType {
  return CALENDAR_ENTRY_CONFIG.calendarEntries.includes(entryType as CalendarEntryType);
}

/**
 * Calculate priority based on entry type and urgency factors
 */
export function calculateCalendarPriority(
  entryType: CalendarEntryType,
  dueDate?: Date,
  isOverdue?: boolean,
  realmPriority?: string
): CalendarPriority {
  // Start with actual priority from Realm if provided
  let priority: CalendarPriority;

  if (realmPriority) {
    switch (realmPriority) {
      case 'High':
        priority = 'urgent';
        break;
      case 'Medium':
        priority = 'high';
        break;
      case 'Low':
        priority = 'medium';
        break;
      default:
        priority = CALENDAR_ENTRY_CONFIG.priorityMapping[entryType];
    }
  } else {
    // Base priority from type
    priority = CALENDAR_ENTRY_CONFIG.priorityMapping[entryType];
  }

  // Adjust based on urgency only if no explicit priority was set
  if (!realmPriority) {
    if (isOverdue) {
      priority = 'urgent';
    } else if (dueDate) {
      const daysUntilDue = Math.ceil((dueDate.getTime() - now().getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue <= 1) {
        priority = 'urgent';
      } else if (daysUntilDue <= 3) {
        priority = 'high';
      }
    }
  }

  return priority;
}

/**
 * Check if a class should appear on a specific date based on its schedule
 */
export function shouldClassAppearOnDate(classData: ClassSchemaType, targetDate: Date): boolean {
  try {
    const semester = classData.semester as unknown as { startDate: string; endDate: string };
    const schedule = JSON.parse(classData.schedule);

    // Check if date is within semester
    const semesterStart = parseDate(semester.startDate);
    const semesterEnd = parseDate(semester.endDate);

    if (targetDate < semesterStart || targetDate > semesterEnd) {
      return false;
    }

    // Check if class meets on this day of week
    const dayOfWeek = targetDate.getDay();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayName = dayNames[dayOfWeek];

    // Schedule structure: { id, days: string[], startTime: Date, endTime: Date }
    return schedule.some((scheduleItem: { days?: string[] }) =>
      scheduleItem.days?.some((day: string) => day.toLowerCase() === dayName)
    );
  } catch (error) {
    console.error('Error parsing class schedule:', error);
    return false;
  }
}

/**
 * Get the time for a class on a specific date
 */
export function getClassTimeOnDate(classData: ClassSchemaType, targetDate: Date): string | null {
  try {
    const schedule = JSON.parse(classData.schedule);
    const dayOfWeek = targetDate.getDay();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayName = dayNames[dayOfWeek];

    // Find schedule item that includes this day
    const daySchedule = schedule.find((item: { days?: string[] }) =>
      item.days?.some((day: string) => day.toLowerCase() === dayName)
    );

    if (daySchedule && daySchedule.startTime) {
      // Handle both Date objects and time strings
      if (daySchedule.startTime instanceof Date) {
        return formatTime(daySchedule.startTime);
      } else if (typeof daySchedule.startTime === 'string') {
        // If it's a time string like "09:00:00", parse it as time
        if (daySchedule.startTime.includes(':')) {
          try {
            const [hours, minutes] = daySchedule.startTime.split(':');
            const timeDate = setHoursOnDate(
              setMinutesOnDate(startOfDay(now()), parseInt(minutes, 10)),
              parseInt(hours, 10)
            );
            return formatTime(timeDate);
          } catch (error) {
            console.error('Error parsing time string:', daySchedule.startTime, error);
            return daySchedule.startTime; // Return as-is if parsing fails
          }
        } else {
          // Try to parse as full date
          const startTime = parseDate(daySchedule.startTime);
          return formatTime(startTime);
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting class time:', error);
    return null;
  }
}

/**
 * Check if a habit should appear on a specific date based on its frequency
 */
export function shouldHabitAppearOnDate(habit: HabitSchemaType, targetDate: Date): boolean {
  const dayOfWeek = format(targetDate, 'dddd'); // Monday, Tuesday, etc.

  switch (habit.frequency) {
    case 'Daily':
    case 'Every day': // Backward compatibility
      return true;
    case 'Weekdays':
      return !['Saturday', 'Sunday'].includes(dayOfWeek);
    case 'Weekends':
      return ['Saturday', 'Sunday'].includes(dayOfWeek);
    case 'Mon/Wed/Fri':
    case 'Monday, Wednesday, Friday': // Backward compatibility
      return ['Monday', 'Wednesday', 'Friday'].includes(dayOfWeek);
    case 'Tue/Thu':
    case 'Tuesday, Thursday': // Backward compatibility
      return ['Tuesday', 'Thursday'].includes(dayOfWeek);
    default:
      // Custom frequency - parse the string
      return habit.frequency.includes(dayOfWeek);
  }
}

/**
 * Check if a habit is completed on a specific date
 */
export function isHabitCompletedOnDate(
  realm: unknown,
  habitId: unknown,
  targetDate: Date
): boolean {
  const dateStart = startOfDay(targetDate);

  if (realm && typeof realm === 'object' && 'objects' in realm) {
    const realmInstance = realm as {
      objects: (name: string) => { filtered: (query: string, ...args: unknown[]) => unknown[] };
    };
    const completion = realmInstance
      .objects('HabitCompletion')
      .filtered('habitId == $0 AND date == $1', habitId, dateStart)[0];

    return !!completion;
  }

  return false;
}

/**
 * Convert various entry types to unified CalendarEntry format
 */
export function convertToCalendarEntry(
  entry: unknown,
  entryType: CalendarEntryType,
  targetDate: Date,
  realm?: unknown
): CalendarEntry | null {
  switch (entryType) {
    case 'class': {
      if (!entry || typeof entry !== 'object') return null;
      const classEntry = entry as Record<string, unknown>;

      if (!shouldClassAppearOnDate(classEntry as unknown as ClassSchemaType, targetDate))
        return null;

      const classTime = getClassTimeOnDate(classEntry as unknown as ClassSchemaType, targetDate);
      if (!classTime) return null;

      return {
        id: `${classEntry._id}-${formatDateISO(targetDate)}`,
        type: 'class',
        title: String(classEntry.name || ''),
        time: classTime,
        priority: 'low',
        status: 'upcoming',
        location: String(classEntry.location || ''),
        courseCode: String(classEntry.courseCode || ''),
        isUrgent: false,
        isOverdue: false,
        originalData: classEntry,
      };
    }

    case 'task': {
      if (!entry || typeof entry !== 'object') return null;
      const taskEntry = entry as Record<string, unknown>;

      if (!taskEntry.dueDate || !isSame(taskEntry.dueDate as Date, targetDate, 'day')) return null;

      const taskTime = String(taskEntry.dueTime || '');
      const isTaskOverdue = !taskEntry.completed && (taskEntry.dueDate as Date) < now();

      return {
        id: String(taskEntry._id || ''),
        type: 'task',
        title: String(taskEntry.title || ''),
        time: taskTime,
        priority: calculateCalendarPriority(
          'task',
          taskEntry.dueDate as Date,
          isTaskOverdue,
          String(taskEntry.priority || '')
        ),
        status: taskEntry.completed ? 'completed' : isTaskOverdue ? 'overdue' : 'upcoming',
        courseCode: String(taskEntry.className || ''),
        description: String(taskEntry.notes || ''),
        isUrgent: !taskEntry.completed && taskEntry.priority === 'High',
        isOverdue: isTaskOverdue,
        originalData: taskEntry,
      };
    }

    case 'assignment': {
      if (!entry || typeof entry !== 'object') return null;
      const assignmentEntry = entry as Record<string, unknown>;

      if (!assignmentEntry.dueDate || !isSame(assignmentEntry.dueDate as Date, targetDate, 'day'))
        return null;

      const assignmentTime = String(assignmentEntry.dueTime || '11:59 PM');
      const isAssignmentOverdue =
        !assignmentEntry.completed && (assignmentEntry.dueDate as Date) < now();

      return {
        id: String(assignmentEntry._id || ''),
        type: 'assignment',
        title: String(assignmentEntry.title || ''),
        time: assignmentTime,
        priority: calculateCalendarPriority(
          'assignment',
          assignmentEntry.dueDate as Date,
          isAssignmentOverdue
        ),
        status: assignmentEntry.completed
          ? 'completed'
          : isAssignmentOverdue
            ? 'overdue'
            : 'upcoming',
        courseCode: String(assignmentEntry.className || ''),
        description: String(assignmentEntry.description || ''),
        isUrgent:
          !assignmentEntry.completed &&
          !!assignmentEntry.weight &&
          parseFloat(String(assignmentEntry.weight)) > 20,
        isOverdue: isAssignmentOverdue,
        originalData: assignmentEntry,
      };
    }

    case 'exam': {
      if (!entry || typeof entry !== 'object') return null;
      const examEntry = entry as Record<string, unknown>;

      if (!isSame(examEntry.date as Date, targetDate, 'day')) return null;

      return {
        id: String(examEntry._id || ''),
        type: 'exam',
        title: String(examEntry.title || ''),
        time: String(examEntry.startTime || '9:00 AM'),
        priority: 'urgent',
        status: examEntry.completed ? 'completed' : 'upcoming',
        location: String(examEntry.location || ''),
        courseCode: String(examEntry.className || ''),
        description: String(examEntry.notes || ''),
        isUrgent: true,
        isOverdue: false,
        originalData: examEntry,
      };
    }

    case 'event': {
      if (!entry || typeof entry !== 'object') return null;
      const eventEntry = entry as Record<string, unknown>;

      if (!isSame(eventEntry.date as Date, targetDate, 'day')) return null;

      return {
        id: String(eventEntry._id || ''),
        type: 'event',
        title: String(eventEntry.title || ''),
        time: String(eventEntry.startTime || '9:00 AM'),
        priority: 'medium',
        status: 'upcoming',
        location: String(eventEntry.location || ''),
        courseCode: String(eventEntry.className || ''),
        description: String(eventEntry.description || ''),
        isUrgent: false,
        isOverdue: false,
        originalData: eventEntry,
      };
    }

    case 'habit': {
      if (!entry || typeof entry !== 'object') return null;
      const habitEntry = entry as Record<string, unknown>;

      if (!shouldHabitAppearOnDate(habitEntry as unknown as HabitSchemaType, targetDate))
        return null;

      // Only show habits for today and future dates
      const today = now();
      today.setHours(0, 0, 0, 0);
      const targetDateStart = dayjs(targetDate).startOf('day').toDate();

      if (targetDateStart < today) return null;

      const isCompleted = realm ? isHabitCompletedOnDate(realm, habitEntry._id, targetDate) : false;
      const isPast = targetDate < now();

      return {
        id: `${habitEntry._id}-${formatDateISO(targetDate)}`,
        type: 'habit',
        title: String(habitEntry.title || ''),
        time: String(habitEntry.timeOfDay || '9:00 AM'),
        priority: 'low',
        status: isCompleted ? 'completed' : 'upcoming',
        description: String(habitEntry.description || ''),
        isUrgent: false,
        isOverdue: isPast && !isCompleted,
        originalData: habitEntry,
      };
    }

    default:
      return null;
  }
}

/**
 * Convert external calendar event to CalendarEntry format
 */
export function convertExternalEventToCalendarEntry(
  externalEvent: ExternalCalendarEvent,
  targetDate: Date
): CalendarEntry | null {
  // Only show if it's on the target date
  if (!isSame(externalEvent.startDate, targetDate, 'day')) {
    return null;
  }

  const time = externalEvent.allDay ? '' : formatTime(externalEvent.startDate);

  return {
    id: externalEvent.id,
    type: 'external',
    title: externalEvent.title,
    time,
    priority: 'medium', // External events are medium priority
    status: 'upcoming',
    location: externalEvent.location,
    courseCode: externalEvent.calendarName,
    description: externalEvent.notes,
    isUrgent: false,
    isOverdue: false,
    originalData: externalEvent,
  };
}
