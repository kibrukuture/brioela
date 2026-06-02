import * as Calendar from 'expo-calendar';
import { AppState } from 'react-native';
import { now, parseDate, addDaysToDate } from '@/lib/date-time-utils';
import { CALENDAR_CONFIG } from '@/constants';
import { useAppStore } from '@/stores/ui/use-app-store';

// Extended event type for recurring events
type CalendarEventWithRecurring = Calendar.Event & {
  recurringEventId?: string;
};

export interface ExternalCalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  calendarId: string;
  calendarName: string;
  calendarColor: string;
  location?: string;
  notes?: string;
  allDay: boolean;
  source: 'external';
  // Recurring event properties
  recurringEventId?: string;
  originalEventId: string;
}

// State management
let intervalId: ReturnType<typeof setInterval> | null = null;
let isPolling = false;
let lastFetchTime = 0;
const listeners: ((events: ExternalCalendarEvent[]) => void)[] = [];
const calendarCache: { [key: string]: { name: string; color: string } } = {};

let lastEventHash: string = '';

// const ACTIVE_POLL_INTERVAL = 15000; // 15 seconds when active
// const BACKGROUND_POLL_INTERVAL = 60000; // 1 minute when backgrounded

// App state listener
const setupAppStateListener = () => {
  AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active' && isPolling) {
      // App became active - start fast polling
      // startPolling(ACTIVE_POLL_INTERVAL);
    } else if (nextAppState === 'background' && isPolling) {
      // App went to background - slow down polling
      // startPolling(BACKGROUND_POLL_INTERVAL);
    }
  });
};

// Initialize app state listener
setupAppStateListener();

const fetchExternalEvents = async () => {
  try {
    const { syncedCalendars } = useAppStore.getState();

    if (syncedCalendars.length === 0) {
      notifyListeners([]);
      return;
    }

    const { status } = await Calendar.getCalendarPermissionsAsync();
    if (status !== 'granted') {
      console.log('Calendar permissions not granted');
      return;
    }

    const currentTime = now();
    const endDate = addDaysToDate(currentTime, 30);

    // Only fetch calendars if cache is empty (performance optimization)
    if (Object.keys(calendarCache).length === 0) {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      calendars.forEach((cal) => {
        calendarCache[cal.id] = {
          name: cal.title || 'Unknown Calendar',
          color: cal.color || '#007AFF',
        };
      });
    }

    const events = await Calendar.getEventsAsync(syncedCalendars, now(), endDate);

    // Create hash to detect ACTUAL changes (prevents unnecessary re-renders)
    const eventHash = events
      .map((e) => `${e.id}-${e.title}-${e.startDate}-${e.endDate}`)
      .sort()
      .join('|');

    // Only update UI if events actually changed
    if (eventHash === lastEventHash) {
      console.log('No calendar changes detected - skipping update');
      lastFetchTime = now().getTime();
      return;
    }

    console.log('Calendar changes detected - updating UI');
    lastEventHash = eventHash;

    const externalEvents: ExternalCalendarEvent[] = events
      .filter((event) => {
        // Filter out events created by Schnl to avoid circular sync
        const notes = event.notes || '';
        return !notes.includes(CALENDAR_CONFIG.SCHNL_IDENTIFIER);
      })
      .map((event) => {
        const calendarInfo = calendarCache[event.calendarId] || {
          name: 'Unknown Calendar',
          color: '#007AFF',
        };

        const recurringEventId = (event as CalendarEventWithRecurring).recurringEventId;

        return {
          id: `external_${event.id}`,
          title: event.title || 'Untitled Event',
          startDate:
            typeof event.startDate === 'string' ? parseDate(event.startDate) : event.startDate,
          endDate: typeof event.endDate === 'string' ? parseDate(event.endDate) : event.endDate,
          calendarId: event.calendarId,
          calendarName: calendarInfo.name,
          calendarColor: calendarInfo.color,
          location: event.location || undefined,
          notes: event.notes,
          allDay: event.allDay || false,
          source: 'external',
          recurringEventId,
          originalEventId: event.id,
        };
      });

    notifyListeners(externalEvents);
    lastFetchTime = now().getTime();
  } catch (error) {
    console.error('Error fetching external calendar events:', error);
  }
};

// Start polling
// const startPolling = (interval: number) => {
//   if (intervalId) {
//     clearInterval(intervalId);
//   }

//   // Immediate fetch
//   fetchExternalEvents();

//   // Then poll at interval
//   intervalId = setInterval(() => {
//     fetchExternalEvents();
//   }, interval);
// };

// Notify listeners
const notifyListeners = (events: ExternalCalendarEvent[]) => {
  listeners.forEach((callback) => callback(events));
};

// Public API
export const calendarSyncService = {
  startSync: () => {
    // if (isPolling) return;
    // isPolling = true;
    // startPolling(ACTIVE_POLL_INTERVAL);
  },

  stopSync: () => {
    isPolling = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  },

  addListener: (callback: (events: ExternalCalendarEvent[]) => void) => {
    listeners.push(callback);
  },

  removeListener: (callback: (events: ExternalCalendarEvent[]) => void) => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  },

  refresh: async () => {
    await fetchExternalEvents();
  },

  getLastFetchTime: () => lastFetchTime,
};
