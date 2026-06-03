import { usePostHogScreenTracking } from '@/features/posthog/hooks/use-posthog-screen-tracking';
import { ReactNode } from 'react';

interface PostHogScreenTrackerProps {
  children: ReactNode;
}

export function PostHogScreenTracker({ children }: PostHogScreenTrackerProps) {
  usePostHogScreenTracking();
  return <>{children}</>;
}
