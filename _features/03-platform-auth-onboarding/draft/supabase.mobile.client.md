# Draft: supabase.mobile.client

Target: `mobile/lib/auth/supabase.ts`

```
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '@/constants';
import { encryptedAuthAdapter } from '@/lib/storage/encrypted-storage';

export const supabase = createClient(
  SUPABASE_CONFIG.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_CONFIG.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: encryptedAuthAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Listen for app state changes to manage Supabase auth token refreshing.
// When the app becomes active, start auto-refreshing the auth session token.
// When the app goes to the background or becomes inactive, stop auto-refreshing to save resources.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
```
