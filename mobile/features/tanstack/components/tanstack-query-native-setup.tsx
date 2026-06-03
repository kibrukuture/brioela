import React from 'react';
import { useFocusManager } from '@/features/tanstack/hooks/use-focus-manager';
import { useNetworkStatus } from '@/features/tanstack/hooks/use-network-manager';

export const TanStackQueryNativeSetup = React.memo(() => {
  useFocusManager();
  useNetworkStatus();
  return null;
});
