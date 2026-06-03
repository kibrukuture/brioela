import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { focusManager } from '@tanstack/react-query';

/**
 * Hook to setup TanStack Query app focus refetching for React Native
 * Enables refetchOnWindowFocus to work in React Native/Expo
 */
export function useFocusManager() {
  useIsomorphicLayoutEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAppStateChange = (status: AppStateStatus) => {
      // console.log('[TanStack Focus] App state changed to:', status);
      focusManager.setFocused(status === 'active');
      // console.log('[TanStack Focus] Focus manager set to:', status === 'active');
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);
}
