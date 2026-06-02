import { useEffect } from 'react';
import { usePathname, useGlobalSearchParams } from 'expo-router';
import { usePostHog } from 'posthog-react-native';

export function usePostHogScreenTracking() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    posthog.screen(pathname, params);
  }, [pathname, params, posthog]);
}
