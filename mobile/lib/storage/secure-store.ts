import * as SecureStore from 'expo-secure-store';
import type { SecureStoreOptions } from 'expo-secure-store';

/**
 * Secure storage utility for storing sensitive data using the device's secure storage systems.
 *
 * On iOS, this uses the Keychain Services API.
 * On Android, this uses EncryptedSharedPreferences.
 *
 * @remarks
 * - Maximum value size: ~2KB (varies by platform)
 * - For larger data, consider splitting or using encrypted AsyncStorage
 * - Keys are automatically prefixed to avoid conflicts
 */

/**
 * Options for secure store operations.
 * Extends expo-secure-store's SecureStoreOptions to ensure type safety.
 */
export type SecureStoreOperationOptions = SecureStoreOptions;

/**
 * Result of a secure store operation.
 */
export type SecureStoreResult<T> = { success: true; data: T } | { success: false; error: Error };

/**
 * Stores a value securely using the device's secure storage.
 *
 * @param key - The key to store the value under. Must be unique.
 * @param value - The value to store. Must be a string (max ~2KB).
 * @param options - Optional configuration for the storage operation.
 * @returns Promise that resolves to a result indicating success or failure.
 *
 * @example
 * ```ts
 * const result = await setSecureItem('card_pin', '1234');
 * if (result.success) {
 *   console.log('PIN stored securely');
 * }
 * ```
 */
export async function setSecureItem(
  key: string,
  value: string,
  options?: SecureStoreOperationOptions
): Promise<SecureStoreResult<void>> {
  try {
    await SecureStore.setItemAsync(key, value, options);
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Retrieves a value from secure storage.
 *
 * @param key - The key to retrieve the value for.
 * @param options - Optional configuration for the retrieval operation.
 * @returns Promise that resolves to the value if found, or null if not found.
 *
 * @example
 * ```ts
 * const result = await getSecureItem('card_pin');
 * if (result.success && result.data) {
 *   console.log('PIN retrieved:', result.data);
 * }
 * ```
 */
export async function getSecureItem(
  key: string,
  options?: SecureStoreOperationOptions
): Promise<SecureStoreResult<string | null>> {
  try {
    const value = await SecureStore.getItemAsync(key, options);
    return { success: true, data: value };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Removes a value from secure storage.
 *
 * @param key - The key to remove.
 * @param options - Optional configuration for the removal operation.
 * @returns Promise that resolves to a result indicating success or failure.
 *
 * @example
 * ```ts
 * const result = await deleteSecureItem('card_pin');
 * if (result.success) {
 *   console.log('PIN removed');
 * }
 * ```
 */
export async function deleteSecureItem(
  key: string,
  options?: SecureStoreOperationOptions
): Promise<SecureStoreResult<void>> {
  try {
    await SecureStore.deleteItemAsync(key, options);
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Checks if a key exists in secure storage.
 *
 * @param key - The key to check.
 * @param options - Optional configuration for the check operation.
 * @returns Promise that resolves to true if the key exists, false otherwise.
 *
 * @example
 * ```ts
 * const exists = await hasSecureItem('card_pin');
 * if (exists.success && exists.data) {
 *   console.log('PIN is stored');
 * }
 * ```
 */
export async function hasSecureItem(
  key: string,
  options?: SecureStoreOperationOptions
): Promise<SecureStoreResult<boolean>> {
  try {
    const value = await SecureStore.getItemAsync(key, options);
    return { success: true, data: value !== null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Stores a JSON-serializable object securely.
 *
 * @param key - The key to store the object under.
 * @param value - The object to store (will be JSON stringified).
 * @param options - Optional configuration for the storage operation.
 * @returns Promise that resolves to a result indicating success or failure.
 *
 * @example
 * ```ts
 * const cardData = { number: '1234', cvv: '123' };
 * const result = await setSecureObject('card_data', cardData);
 * ```
 */
export async function setSecureObject<T extends Record<string, unknown>>(
  key: string,
  value: T,
  options?: SecureStoreOperationOptions
): Promise<SecureStoreResult<void>> {
  try {
    const serialized = JSON.stringify(value);
    return await setSecureItem(key, serialized, options);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Retrieves and deserializes a JSON object from secure storage.
 *
 * @param key - The key to retrieve the object for.
 * @param options - Optional configuration for the retrieval operation.
 * @returns Promise that resolves to the deserialized object if found, or null if not found.
 *
 * @example
 * ```ts
 * const result = await getSecureObject<{ number: string; cvv: string }>('card_data');
 * if (result.success && result.data) {
 *   console.log('Card number:', result.data.number);
 * }
 * ```
 */
export async function getSecureObject<T extends Record<string, unknown>>(
  key: string,
  options?: SecureStoreOperationOptions
): Promise<SecureStoreResult<T | null>> {
  try {
    const result = await getSecureItem(key, options);
    if (!result.success) {
      return result;
    }
    if (result.data === null) {
      return { success: true, data: null };
    }
    const parsed = JSON.parse(result.data) as T;
    return { success: true, data: parsed };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
