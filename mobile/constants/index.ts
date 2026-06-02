// ALL OF THE CONSTANTS ARE PUBLIC
export const AUTH_CONFIG = {
  WEB_CLIENT_ID: '988633527488-5bsfpb2dl1c4jqlnlibvl6dt0jj1dijs.apps.googleusercontent.com',
  IOS_CLIENT_ID: '988633527488-v3q9fsnfdfuh2qpp0lihqk99q8j349k2.apps.googleusercontent.com',
  ANDROID_CLIENT_ID: '988633527488-h5f6bqvkpivmpcq7cl4q6gcbf7p6tqnn.apps.googleusercontent.com',

  REDIRECT_URI: 'https://bejwakpfefuexxbrqsfy.supabase.co/auth/v1/callback',
};

export const SUPABASE_CONFIG = {
  EXPO_PUBLIC_SUPABASE_URL: 'https://bejwakpfefuexxbrqsfy.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_cSgVUpi4MNCoo7YhODrkaw_OX01ktUx',
};

export const SUPERWALL_CONFIG = {
  SUPERWALL_IOS_KEY: 'pk_X-5UBKFLymoU7iWzo7sBm',
  SUPERWALL_ANDROID_KEY: 'pk_6KZmQNoHhssr4hJFCzfLz',
  SUPERWALL_PLACEMENT_KEY: 'schnl_pro_app',
};

// errors;

export const ERROR_CONFIG = {
  AUTH_ERROR_TITLE: 'Whoops! Check This',
};

// file config;

export const FILE_CONFIG = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // max allowed file size is 10mb;
};

// worker config;

export const CLOUDFLARE_WORKER_CONFIG = {
  // THIS IS FOR LOCAL DEV.
  WORKER_BASE_URI: 'ws://worker.schnl.com',
  // WORKER_BASE_URI: 'ws://127.0.0.1:8787',
  MED_AGENT_ENPOINT: 'ws://127.0.0.1:8787/ws',
};

export const CALENDAR_CONFIG = {
  SCHNL_IDENTIFIER: 'Created by Schnl - Academic Planner',
};

export const LOCAL_STORAGE_KEYS = {
  LANGUAGE_KEY: 'app_language',
  REMINDER_ENABLED_KEY: 'app_reminder_enabled',
  REMINDER_MINUTES_KEY: 'app_reminder_minutes',
  LOCAL_NOTIFICATIONS_ENABLED_KEY: 'app_local_notifications_enabled',
  CALENDAR_SYNC_ENABLED_KEY: 'app_calendar_sync_enabled',
  SYNCED_CALENDARS_KEY: 'app_synced_calendars',
  CURRENT_TAB_KEY: 'app_current_tab',
  AUTH_STORAGE_KEY: 'schnl_auth_session',
  PUSH_TOGGLE_ENABLED_KEY: 'app_push_toggle_enabled',
  PRIVACY_VISIBILITY: 'app_privacy_visibility',
} as const;

/**
 * MMKV storage configuration.
 *
 * @remarks
 * - `AUTH_STORAGE_ID` isolates Supabase auth data.
 * - `AUTH_ENCRYPTION_KEY` secures the MMKV instance; for production, supply via env.
 */
export const MMKV_STORAGE = {
  AUTH_STORAGE_ID: 'schnl_auth_mmkv',
  AUTH_ENCRYPTION_KEY: 'schnl_auth_mmkv_encryption_key',
} as const;

/**
 * Encrypted storage keys used by react-native-encrypted-storage.
 * These keys should remain stable across app versions.
 */
export const ENCRYPTED_STORAGE_KEYS = {
  AUTH_SESSION: 'schnl_auth_session_encrypted',
} as const;

/**
 * Secure storage keys for sensitive data.
 * These keys are used with expo-secure-store for encrypted storage.
 */
export const SECURE_STORAGE_KEYS = {
  /**
   * Key for storing card PIN.
   */
  CARD_PIN: 'schnl_card_pin',
  /**
   * Key for storing card details (encrypted).
   */
  CARD_DETAILS: 'schnl_card_details',
  /**
   * Key for storing local authentication preference (enabled/disabled).
   */
  LOCAL_AUTH_ENABLED: 'schnl_local_auth_enabled',
  /**
   * Key for storing biometric authentication preference.
   */
  BIOMETRIC_ENABLED: 'schnl_biometric_enabled',
  /**
   * Key for storing local device auth preference for sensitive actions.
   */
  LOCAL_DEVICE_AUTH_ENABLED: 'schnl_local_device_auth_enabled',
} as const;

export const POSTHOG_CONFIGS = {
  apiKey: 'phc_t7ZtXCHmAwO9q4v8wB6zzXGyaRSUEAhrLTrvKNqISuW',
  host: 'https://us.i.posthog.com',
  flushAt: 20,
  flushInterval: 30000,
} as const;

export const REVENUE_CAT_CONFIG = {
  REVENUE_CAT_IOS_KEY: 'appl_ZFgJYreKIzogiDsZMoUoyaNFUyz',
  REVENUE_CAT_ANDROID_KEY: 'goog_evQlMUeZGwSbOIGvwaQTyZoZVCV',
  ENTITLEMENT_ID: 'pro',
} as const;
