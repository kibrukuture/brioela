# Draft: notifications.tsx — production snapshot (mobile profile)

Target: `mobile/app/profile/notifications.tsx`

**As of migration audit.** Toggles OneSignal opt-in locally only; labels still say "Schnl". Does not sync token to backend.

Key behavior:

- `onTogglePush(true)` → `registerForPushNotifications()` + `optInPushNotifications()`
- `onTogglePush(false)` → `optOutPushNotifications()`
- State in `usePushToggleStore` — not tied to `useRegisterPush`

**Legacy copy (line ~111):** `"Choose how you receive updates from Schnl."`

**Required for 21:** After permission + token, call:

```typescript
import * as Device from 'expo-device';
import { useRegisterPush } from '@/network/notifications/use-push-notifications';
import { getPushNotificationsToken } from '@/lib/push-notifications/one-signal';

// provider: map OneSignal token type — often 'fcm' | 'apns' on native builds
await registerPush.mutateAsync({
  device_id: stableDeviceId,
  provider: 'fcm', // or platform-specific
  token: await getPushNotificationsToken(),
  platform: Device.osName ?? undefined,
  model: Device.modelName ?? undefined,
});
```

See `mobile-push-backend-sync.gap.md` for full intended hook.
