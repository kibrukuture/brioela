import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCAL_STORAGE_KEYS } from '@/constants';

interface AppStoreState {
  // Reminder Settings
  reminderEnabled: boolean;
  reminderMinutes: number[]; // Default reminder times in minutes
  localNotificationsEnabled: boolean;

  // Loading state
  isLoaded: boolean;
}

interface AppStoreActions {
  // Setter actions
  setReminderEnabled: (enabled: boolean) => Promise<void>;
  setReminderMinutes: (minutes: number[]) => Promise<void>;
  setLocalNotificationsEnabled: (enabled: boolean) => Promise<void>;

  // Reminder management
  addReminderMinutes: (minutes: number) => Promise<void>;
  removeReminderMinutes: (minutes: number) => Promise<void>;

  // Batch action
  updateSettings: (settings: Partial<AppStoreState>) => Promise<void>;

  // Persistence
  loadPreferences: () => Promise<void>;
  clearPreferences: () => Promise<void>;
}

type AppStore = AppStoreState & AppStoreActions;

// Default values - always present on first install
const DEFAULT_REMINDER_MINUTES = [15, 60, 1440]; // 15 min, 1 hour, 1 day

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state - defaults are always loaded
  reminderEnabled: true,
  reminderMinutes: DEFAULT_REMINDER_MINUTES,
  localNotificationsEnabled: false,

  isLoaded: false,
  userLangCode: 'en',

  // Actions
  setReminderEnabled: async (enabled) => {
    set({ reminderEnabled: enabled });
    try {
      await AsyncStorage.setItem(LOCAL_STORAGE_KEYS.REMINDER_ENABLED_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.error('Failed to save reminder enabled setting:', error);
    }
  },

  setReminderMinutes: async (minutes) => {
    set({ reminderMinutes: minutes });
    try {
      await AsyncStorage.setItem(LOCAL_STORAGE_KEYS.REMINDER_MINUTES_KEY, JSON.stringify(minutes));
    } catch (error) {
      console.error('Failed to save reminder minutes setting:', error);
    }
  },

  setLocalNotificationsEnabled: async (enabled) => {
    set({ localNotificationsEnabled: enabled });
    try {
      await AsyncStorage.setItem(
        LOCAL_STORAGE_KEYS.LOCAL_NOTIFICATIONS_ENABLED_KEY,
        JSON.stringify(enabled)
      );
    } catch (error) {
      console.error('Failed to save notifications enabled setting:', error);
    }
  },

  addReminderMinutes: async (minutes) => {
    const currentMinutes = get().reminderMinutes;
    if (!currentMinutes.includes(minutes)) {
      const newMinutes = [...currentMinutes, minutes];
      set({ reminderMinutes: newMinutes });
      try {
        await AsyncStorage.setItem(
          LOCAL_STORAGE_KEYS.REMINDER_MINUTES_KEY,
          JSON.stringify(newMinutes)
        );
      } catch (error) {
        console.error('Failed to add reminder minutes:', error);
      }
    }
  },

  removeReminderMinutes: async (minutes) => {
    const currentMinutes = get().reminderMinutes;
    const newMinutes = currentMinutes.filter((m) => m !== minutes);
    set({ reminderMinutes: newMinutes });
    try {
      await AsyncStorage.setItem(
        LOCAL_STORAGE_KEYS.REMINDER_MINUTES_KEY,
        JSON.stringify(newMinutes)
      );
    } catch (error) {
      console.error('Failed to remove reminder minutes:', error);
    }
  },

  updateSettings: async (settings) => {
    set(settings);
    try {
      // Save all settings to AsyncStorage
      const promises = Object.entries(settings).map(([key, value]) => {
        const storageKey = `app_${key}`;
        return AsyncStorage.setItem(storageKey, JSON.stringify(value));
      });
      await Promise.all(promises);
    } catch (error) {
      console.error('Attagmadanı settings:', error);
    }
  },

  loadPreferences: async () => {
    try {
      const [reminderEnabled, reminderMinutes, localNotificationsEnabled] = await Promise.all([
        AsyncStorage.getItem(LOCAL_STORAGE_KEYS.REMINDER_ENABLED_KEY),
        AsyncStorage.getItem(LOCAL_STORAGE_KEYS.REMINDER_MINUTES_KEY),
        AsyncStorage.getItem(LOCAL_STORAGE_KEYS.LOCAL_NOTIFICATIONS_ENABLED_KEY),

        AsyncStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE_KEY),
      ]);

      set({
        reminderEnabled: reminderEnabled ? JSON.parse(reminderEnabled) : true,
        reminderMinutes: reminderMinutes ? JSON.parse(reminderMinutes) : DEFAULT_REMINDER_MINUTES,
        localNotificationsEnabled: localNotificationsEnabled
          ? JSON.parse(localNotificationsEnabled)
          : false,

        isLoaded: true,
      });
    } catch (error) {
      console.error('Failed to load app preferences:', error);
      // Fallback to default values - always have reminders
      set({
        reminderEnabled: true,
        reminderMinutes: DEFAULT_REMINDER_MINUTES,
        localNotificationsEnabled: false,

        isLoaded: true,
      });
    }
  },

  clearPreferences: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(LOCAL_STORAGE_KEYS.REMINDER_ENABLED_KEY),
        AsyncStorage.removeItem(LOCAL_STORAGE_KEYS.REMINDER_MINUTES_KEY),
        AsyncStorage.removeItem(LOCAL_STORAGE_KEYS.LOCAL_NOTIFICATIONS_ENABLED_KEY),
        AsyncStorage.removeItem(LOCAL_STORAGE_KEYS.LANGUAGE_KEY),
      ]);

      set({
        reminderEnabled: false,
        reminderMinutes: DEFAULT_REMINDER_MINUTES,
        localNotificationsEnabled: false,
        isLoaded: true,
      });
    } catch (error) {
      console.error('Failed to clear app preferences:', error);
    }
  },
}));
