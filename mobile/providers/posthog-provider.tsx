import { PostHogProvider as PostHogProviderBase } from 'posthog-react-native';
import { ReactNode } from 'react';
import { POSTHOG_CONFIGS } from '@/constants';
interface PostHogProviderProps {
  children: ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  return (
    <PostHogProviderBase
      // ✅ This is the PostHog API key , public facing , it is okay.
      apiKey={POSTHOG_CONFIGS.apiKey}
      options={{
        host: POSTHOG_CONFIGS.host,
        // ✅ THIS enables auto-tracking of app lifecycle: App open, close, background
        captureAppLifecycleEvents: true,
        // ✅ Other useful options:
        flushAt: POSTHOG_CONFIGS.flushAt, // Send events after 20 are queued
        flushInterval: POSTHOG_CONFIGS.flushInterval, // Or send every 30 seconds
        disabled: false,
        enableSessionReplay: true,
      }}
      //
      // ✅ THIS enables auto-tracking of screens and touches
      autocapture={{
        captureScreens: false, // handled by PostHogScreenTracker inside the navigator
        captureTouches: true,
      }}
      //
    >
      {children}
    </PostHogProviderBase>
  );
}
