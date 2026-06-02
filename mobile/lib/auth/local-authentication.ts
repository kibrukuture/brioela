import * as LocalAuthentication from 'expo-local-authentication';
import type {
  LocalAuthenticationResult,
  AuthenticationType,
  SecurityLevel,
} from 'expo-local-authentication';

/**
 * Local authentication utility for biometric and device authentication.
 *
 * Provides secure local authentication using:
 * - Face ID (iOS)
 * - Touch ID / Fingerprint (iOS/Android)
 * - Device PIN/Passcode (iOS/Android)
 *
 * @remarks
 * This is for local device authentication only, not server-side 2FA.
 * Use this to protect sensitive data access within the app.
 */

/**
 * Options for local authentication operations.
 */
export interface LocalAuthOptions {
  /**
   * The prompt message shown to the user during authentication.
   * @default 'Please authenticate to continue'
   */
  promptMessage?: string;
  /**
   * The cancel button label (iOS only).
   * @default 'Cancel'
   */
  cancelLabel?: string;
  /**
   * The fallback button label (iOS only).
   * @default 'Use Passcode'
   */
  fallbackLabel?: string;
  /**
   * Whether to disable the fallback button (iOS only).
   * @default false
   */
  disableDeviceFallback?: boolean;
}

/**
 * Result of a local authentication operation.
 */
export type LocalAuthResult =
  | { success: true; authenticated: true }
  | {
      success: true;
      authenticated: false;
      error: 'USER_CANCEL' | 'USER_FALLBACK' | 'NOT_AVAILABLE';
    }
  | { success: false; error: Error };

/**
 * Information about available authentication types on the device.
 */
export interface AuthenticationInfo {
  /**
   * Whether any form of local authentication is available.
   */
  isAvailable: boolean;
  /**
   * The security level of the device's authentication.
   */
  securityLevel: SecurityLevel;
  /**
   * List of supported authentication types.
   */
  supportedTypes: AuthenticationType[];
  /**
   * Whether Face ID is available (iOS only).
   */
  hasFaceId: boolean;
  /**
   * Whether fingerprint/Touch ID is available.
   */
  hasFingerprint: boolean;
  /**
   * Whether device passcode is available.
   */
  hasPasscode: boolean;
}

/**
 * Checks if local authentication is available on the device.
 *
 * @returns Promise that resolves to information about available authentication methods.
 *
 * @example
 * ```ts
 * const info = await getAuthenticationInfo();
 * if (info.isAvailable) {
 *   console.log('Face ID available:', info.hasFaceId);
 * }
 * ```
 */
export async function getAuthenticationInfo(): Promise<AuthenticationInfo> {
  const [isAvailable, securityLevel, supportedTypes, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.getEnrolledLevelAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);

  const hasFaceId =
    isEnrolled &&
    supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const hasFingerprint =
    isEnrolled && supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
  const hasPasscode = securityLevel !== LocalAuthentication.SecurityLevel.NONE;

  return {
    isAvailable,
    securityLevel,
    supportedTypes,
    hasFaceId,
    hasFingerprint,
    hasPasscode,
  };
}

/**
 * Authenticates the user using available biometric or device authentication.
 *
 * @param options - Configuration options for the authentication prompt.
 * @returns Promise that resolves to a result indicating authentication success or failure.
 *
 * @example
 * ```ts
 * const result = await authenticate({
 *   promptMessage: 'Authenticate to view card details',
 * });
 * if (result.success && result.authenticated) {
 *   // Show sensitive data
 * }
 * ```
 */
export async function authenticate(options?: LocalAuthOptions): Promise<LocalAuthResult> {
  try {
    // Check if authentication is available
    const isAvailable = await LocalAuthentication.hasHardwareAsync();
    if (!isAvailable) {
      return {
        success: true,
        authenticated: false,
        error: 'NOT_AVAILABLE',
      };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return {
        success: true,
        authenticated: false,
        error: 'NOT_AVAILABLE',
      };
    }

    // Perform authentication
    const result: LocalAuthenticationResult = await LocalAuthentication.authenticateAsync({
      promptMessage: options?.promptMessage ?? 'Please authenticate to continue',
      cancelLabel: options?.cancelLabel ?? 'Cancel',
      fallbackLabel: options?.fallbackLabel ?? 'Use Passcode',
      disableDeviceFallback: options?.disableDeviceFallback ?? false,
    });

    if (result.success) {
      return { success: true, authenticated: true };
    }

    // Handle cancellation and fallback
    if (result.error === 'user_cancel') {
      return { success: true, authenticated: false, error: 'USER_CANCEL' };
    }
    if (result.error === 'user_fallback') {
      return { success: true, authenticated: false, error: 'USER_FALLBACK' };
    }

    return {
      success: true,
      authenticated: false,
      error: 'NOT_AVAILABLE',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Cancels any ongoing authentication operation.
 *
 * @remarks
 * This is useful if you want to cancel authentication from another part of the app.
 *
 * @example
 * ```ts
 * // Cancel authentication if user navigates away
 * await cancelAuthentication();
 * ```
 */
export async function cancelAuthentication(): Promise<void> {
  await LocalAuthentication.cancelAuthenticate();
}
