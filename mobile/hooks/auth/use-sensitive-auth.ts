import { useDeviceAuthGate } from '@/hooks/auth/use-device-auth-gate';

/**
 * Hook to guard sensitive actions with local auth when enabled.
 *
 * Usage:
 * const { requireAuth } = useSensitiveAuth();
 * const ok = await requireAuth('Authenticate to view card details');
 * if (!ok) return;
 * // proceed to show sensitive info
 */
export function useSensitiveAuth() {
  const { requireDeviceAuth } = useDeviceAuthGate();

  return { requireAuth: requireDeviceAuth };
}
