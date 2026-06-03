import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';

/**
 * Hook to setup TanStack Query network refetching for React Native
 * Enables refetchOnReconnect to work in React Native/Expo
 */
export function useNetworkStatus() {
  // console.log('[TanStack Network] Setting up network listener');
  useIsomorphicLayoutEffect(() => {
    const unsubscribe = onlineManager.setEventListener((setOnline) => {
      // console.log('[TanStack Network] Network listener registered');
      const subscription = Network.addNetworkStateListener((state) => {
        // console.log('[TanStack Network] Network state changed:', state.isConnected);
        setOnline(!!state.isConnected);
      });

      // Return cleanup function for the network listener
      return () => {
        // console.log('[TanStack Network] Cleaning up network subscription');
        subscription?.remove?.();
      };
    });

    // Cleanup: call the unsubscribe function returned by setEventListener
    return unsubscribe;
  }, []);
}
