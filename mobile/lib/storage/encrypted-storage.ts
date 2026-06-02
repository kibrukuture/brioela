import EncryptedStorage from 'react-native-encrypted-storage';
import type { SupportedStorage } from '@supabase/supabase-js';
import { ENCRYPTED_STORAGE_KEYS } from '@/constants';

/**
 * Adapter to use react-native-encrypted-storage for Supabase auth sessions.
 *
 * @remarks
 * - Stores the entire session JSON under a single key.
 * - EncryptedStorage uses Keychain (iOS) / EncryptedSharedPreferences (Android).
 */
export const encryptedAuthAdapter: SupportedStorage = {
  isServer: false,
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await EncryptedStorage.getItem(key);
    } catch (error) {
      console.warn('[encrypted-storage][getItem] failed', { key, error });
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await EncryptedStorage.setItem(key, value);
    } catch (error) {
      console.warn('[encrypted-storage][setItem] failed', { key, error });
      throw error;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await EncryptedStorage.removeItem(key);
    } catch (error) {
      // Removing a missing key should be a no-op; log and continue.
      console.warn('[encrypted-storage][removeItem] failed', { key, error });
    }
  },
};

/**
 * Convenience helpers for our fixed auth session key.
 */
export const encryptedAuthSession = {
  get: async (): Promise<string | null> =>
    EncryptedStorage.getItem(ENCRYPTED_STORAGE_KEYS.AUTH_SESSION),
  set: async (value: string): Promise<void> =>
    EncryptedStorage.setItem(ENCRYPTED_STORAGE_KEYS.AUTH_SESSION, value),
  remove: async (): Promise<void> =>
    EncryptedStorage.removeItem(ENCRYPTED_STORAGE_KEYS.AUTH_SESSION),
};

/**
 * Generic encrypted storage helpers for app data.
 */
export const encryptedStorage = {
  get: async (key: string): Promise<string | null> => EncryptedStorage.getItem(key),
  set: async (key: string, value: string): Promise<void> => EncryptedStorage.setItem(key, value),
  remove: async (key: string): Promise<void> => EncryptedStorage.removeItem(key),
};
