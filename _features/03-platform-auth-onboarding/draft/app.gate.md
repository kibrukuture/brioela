# Draft: app.gate

Target: `mobile/features/auth/components/app-gate.tsx`

```
import React from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/account/use-auth-store';
import AppLockOverlay from '@/features/auth/components/app-lock-overlay';

export default function AppGate({ children }: { children: React.ReactNode }) {
  const { isLoading, initializeAuth } = useAuthStore();

  // On initial mount, we initialize our auth state.
  useIsomorphicLayoutEffect(() => {
    initializeAuth();
  }, []); // This runs only once.

  // While the store is initializing and checking the session,
  // we show a global loading indicator.
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  // Once the auth state is loaded, we render the rest of the app.
  return <AppLockOverlay>{children}</AppLockOverlay>;
}
```
