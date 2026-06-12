# Draft: app/tabs/_layout.tsx

Target: `mobile/app/tabs/_layout.tsx`

```typescript
import React from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useProtectedRoute } from '@/features/auth/hooks/use-protected-route';

// SDK 56: use Expo Router's native tab layout instead of old React Navigation-based tab wrappers.
// See mobile/SDK56-NAVIGATION-NOTES.md before changing this back to JavaScript/custom tabs.

export default function TabsLayout() {
  useProtectedRoute();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" md="auto_awesome" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="transactions">
        <NativeTabs.Trigger.Label>Activities</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" md="receipt_long" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="recipients">
        <NativeTabs.Trigger.Label>Recipients</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.2', selected: 'person.2.fill' }}
          md="group"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="cards">
        <NativeTabs.Trigger.Label>Cards</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'creditcard', selected: 'creditcard.fill' }}
          md="credit_card"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

```
