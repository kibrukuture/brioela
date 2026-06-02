import * as Notifications from 'expo-notifications';
import {
  isFutureDate,
  addMinutesToDate,
  setHours,
  setMinutes,
  startOfDay,
} from './date-time-utils';

/**
 * Academic notification service for scheduling, updating, and canceling notifications
 */

export interface AcademicNotificationData {
  id: string;
  type: 'assignment' | 'exam' | 'task' | 'event' | 'class';
  title: string;
  dueDate?: Date;
  eventDate?: Date;
  startTime?: string;
  reminderMinutes: number[];
  itemId: string; // Realm object ID
}

/**
 * Schedule notifications for an academic item
 */
export const scheduleAcademicNotifications = async (
  data: AcademicNotificationData,
  userReminderMinutes?: number[] // User's selected reminder times
): Promise<string[]> => {
  try {
    // Check if notifications are enabled
    const notificationsEnabled = await areNotificationsEnabled();
    if (!notificationsEnabled) {
      return [];
    }

    const notificationIds: string[] = [];

    // Use user's reminder times if provided, otherwise use defaults
    const finalReminderMinutes =
      userReminderMinutes && userReminderMinutes.length > 0
        ? userReminderMinutes
        : getDefaultReminderTimes(data.type);

    // Determine the target date based on type
    let targetDate: Date;
    if (data.type === 'assignment' || data.type === 'task' || data.type === 'exam') {
      targetDate = data.dueDate!;
    } else {
      targetDate = data.eventDate!;
    }

    // Schedule notifications for each reminder time
    for (const reminderMinutes of finalReminderMinutes) {
      let notificationDate: Date;

      if (data.type === 'task') {
        // For tasks, notify at 9 AM on the due date (all-day tasks)
        notificationDate = setHours(setMinutes(startOfDay(targetDate), 0), 9);
      } else {
        // For other types, calculate minutes before the event
        notificationDate = addMinutesToDate(targetDate, -reminderMinutes);
      }

      // Don't schedule notifications if the item itself is in the past
      if (!isFutureDate(targetDate)) {
        continue;
      }

      // Skip notifications that are already in the past
      if (!isFutureDate(notificationDate)) {
        continue;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: getNotificationTitle(data.type, reminderMinutes),
          body: getNotificationBody(data),
          data: {
            type: data.type,
            itemId: data.itemId,
            reminderMinutes,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationDate,
        },
      });

      notificationIds.push(notificationId);
    }

    return notificationIds;
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    return [];
  }
};

/**
 * Update notifications for an academic item
 */
export const updateAcademicNotifications = async (
  oldNotificationIds: string[],
  newData: AcademicNotificationData,
  userReminderMinutes?: number[] // User's selected reminder times
): Promise<string[]> => {
  try {
    // Check if notifications are enabled
    const notificationsEnabled = await areNotificationsEnabled();
    if (!notificationsEnabled) {
      await cancelAcademicNotifications(oldNotificationIds);
      return [];
    }

    // Cancel old notifications
    await cancelAcademicNotifications(oldNotificationIds);

    // Schedule new notifications
    return await scheduleAcademicNotifications(newData, userReminderMinutes);
  } catch (error) {
    console.error('Error updating notifications:', error);
    return [];
  }
};

/**
 * Cancel notifications for an academic item
 */
export const cancelAcademicNotifications = async (notificationIds: string[]): Promise<void> => {
  try {
    for (const notificationId of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
};

/**
 * Get notification title based on type and reminder time
 */
const getNotificationTitle = (type: string, reminderMinutes: number): string => {
  if (type === 'task') {
    return 'Task due today';
  }

  const reminderText = formatReminderTime(reminderMinutes);

  switch (type) {
    case 'assignment':
      return `Assignment due ${reminderText}`;
    case 'exam':
      return `Exam ${reminderText}`;
    case 'event':
      return `Event ${reminderText}`;
    case 'class':
      return `Class ${reminderText}`;
    default:
      return `Reminder ${reminderText}`;
  }
};

/**
 * Get notification body text
 */
const getNotificationBody = (data: AcademicNotificationData): string => {
  switch (data.type) {
    case 'assignment':
      return `${data.title}`;
    case 'exam':
      return `${data.title}`;
    case 'task':
      return `${data.title}`;
    case 'event':
      return `${data.title}`;
    case 'class':
      return `${data.title}`;
    default:
      return data.title;
  }
};

/**
 * Format reminder time for display
 */
const formatReminderTime = (minutes: number): string => {
  if (minutes < 60) {
    return `in ${minutes} minutes`;
  } else if (minutes < 1440) {
    // Less than 24 hours
    const hours = Math.floor(minutes / 60);
    return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(minutes / 1440);
    return `in ${days} day${days > 1 ? 's' : ''}`;
  }
};

/**
 * Get default reminder times for each type
 */
export const getDefaultReminderTimes = (type: string): number[] => {
  switch (type) {
    case 'assignment':
      return [15, 60, 1440]; // 15min, 1hr, 1day
    case 'exam':
      return [60, 1440, 4320]; // 1hr, 1day, 3days
    case 'task':
      return [15]; // 15min
    case 'event':
      return [15]; // 15min
    case 'class':
      return [15]; // 15min
    default:
      return [15, 60]; // Default: 15min, 1hr
  }
};

/**
 * Check if notifications are enabled
 */
export const areNotificationsEnabled = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};
