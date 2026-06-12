# Draft: providers/query-provider.tsx

Target: `mobile/providers/query-provider.tsx`

```typescript
import React from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Set the garbage collection time to 24 hours (in milliseconds).
      // ! CHECK THIS BACK, AM I DOING THIS RIGHT? THE THING IS
      // SO THAT WE CAN STORE THE CACHE FOR LONG ENOUGH IS THE USER IS NOT ONLINE.
      // AND USE THE TANSTACK QUERY DATA INSTEAD OF LOCAL DB.
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'TanStackQueryCache',
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}>
      {children}
    </PersistQueryClientProvider>
  );
}

```
