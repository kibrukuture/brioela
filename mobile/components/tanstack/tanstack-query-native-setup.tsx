import React from 'react';
import { useFocusManager } from '@/hooks/tanstack/use-focus-manager';
import { useNetworkStatus } from '@/hooks/tanstack/use-network-manager';

export const TanStackQueryNativeSetup = React.memo(() => {
  useFocusManager();
  useNetworkStatus();
  return null;
});
