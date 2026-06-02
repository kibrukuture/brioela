import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserPreferencesState {
  theme: ThemePreference;
  notificationsEnabled: boolean;
  notificationDeviceToken: string | null;
  isLoaded: boolean;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setNotificationDeviceToken: (token: string | null) => Promise<void>;
  loadPreferences: () => Promise<void>;
  clearPreferences: () => Promise<void>;
}

const THEME_KEY = 'user_theme';
const NOTIF_ENABLED_KEY = 'user_notifications_enabled';
const NOTIF_TOKEN_KEY = 'user_notification_device_token';

export const useUserPreferencesStore = create<UserPreferencesState>((set, get) => ({
  theme: 'system',
  notificationsEnabled: true,
  notificationDeviceToken: null,
  isLoaded: false,

  setTheme: async (theme) => {
    set({ theme });
    await AsyncStorage.setItem(THEME_KEY, theme);
  },

  setNotificationsEnabled: async (enabled) => {
    set({ notificationsEnabled: enabled });
    await AsyncStorage.setItem(NOTIF_ENABLED_KEY, JSON.stringify(enabled));
  },

  setNotificationDeviceToken: async (token) => {
    set({ notificationDeviceToken: token });
    if (token === null) {
      await AsyncStorage.removeItem(NOTIF_TOKEN_KEY);
    } else {
      await AsyncStorage.setItem(NOTIF_TOKEN_KEY, token);
    }
  },

  loadPreferences: async () => {
    const [theme, notifEnabled, notifToken] = await Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(NOTIF_ENABLED_KEY),
      AsyncStorage.getItem(NOTIF_TOKEN_KEY),
    ]);
    set({
      theme: (theme as ThemePreference) || 'system',
      notificationsEnabled: notifEnabled !== null ? JSON.parse(notifEnabled) : true,
      notificationDeviceToken: notifToken || null,
      isLoaded: true,
    });
  },

  clearPreferences: async () => {
    await Promise.all([
      AsyncStorage.removeItem(THEME_KEY),
      AsyncStorage.removeItem(NOTIF_ENABLED_KEY),
      AsyncStorage.removeItem(NOTIF_TOKEN_KEY),
    ]);
    set({
      theme: 'system',
      notificationsEnabled: true,
      notificationDeviceToken: null,
      isLoaded: true,
    });
  },
}));
