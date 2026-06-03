import { useState, useCallback } from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import {
  authenticate,
  getAuthenticationInfo,
  type LocalAuthOptions,
  type AuthenticationInfo,
  type LocalAuthResult } from '@/lib/auth/local-authentication';

/**
 * Hook for managing local authentication state and operations.
 *
 * Provides a convenient way to:
 * - Check authentication availability
 * - Perform authentication
 * - Track authentication state
 *
 * @example
 * ```tsx
 * const { authenticate: authenticateUser, isAvailable, isLoading } = useLocalAuthentication();
 *
 * const handleViewCardDetails = async () => {
 *   const result = await authenticateUser({
 *     promptMessage: 'Authenticate to view card details',
 *   });
 *   if (result.success && result.authenticated) {
 *     // Show card details
 *   }
 * };
 * ```
 */
export function useLocalAuthentication() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authInfo, setAuthInfo] = useState<AuthenticationInfo | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  /**
   * Loads authentication information from the device.
   */
  const loadAuthInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const info = await getAuthenticationInfo();
      setAuthInfo(info);
      setIsAvailable(info.isAvailable);
    } catch (error) {
      console.error('Failed to load authentication info:', error);
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Authenticates the user using available biometric or device authentication.
   *
   * @param options - Configuration options for the authentication prompt.
   * @returns Promise that resolves to a result indicating authentication success or failure.
   */
  const authenticateUser = useCallback(
    async (options?: LocalAuthOptions): Promise<LocalAuthResult> => {
      return await authenticate(options);
    },
    []
  );

  // Load authentication info on mount
  useIsomorphicLayoutEffect(() => {
    loadAuthInfo();
  }, [loadAuthInfo]);

  return {
    /**
     * Whether authentication information is currently being loaded.
     */
    isLoading,
    /**
     * Whether local authentication is available on the device.
     */
    isAvailable,
    /**
     * Detailed information about available authentication methods.
     */
    authInfo,
    /**
     * Authenticates the user using available biometric or device authentication.
     */
    authenticate: authenticateUser,
    /**
     * Reloads authentication information from the device.
     */
    refreshAuthInfo: loadAuthInfo };
}
