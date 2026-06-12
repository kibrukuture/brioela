# Draft: use-sync-push-token.ts (gap — mobile hook does not exist)

Target: `mobile/hooks/use-sync-push-token.ts`

**Gap G2:** Auth sets `OneSignal.login(userId)` but backend `push_notification` table never receives token.

---

## Intended production file

```typescript
import { useCallback } from 'react';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { useRegisterPush, useUnregisterPush } from '@/network/notifications/use-push-notifications';
import {
  getPushNotificationsPermission,
  getPushNotificationsToken,
  registerForPushNotifications,
} from '@/lib/push-notifications/one-signal';
import { Platform } from 'react-native';

function resolveStableDeviceId(): string {
  if (Platform.OS === 'android') {
    return Application.getAndroidId() ?? 'android-unknown';
  }
  return Application.getIosIdForVendorAsync !== undefined
    ? // call async at use site
      'ios-vendor-pending'
    : 'ios-unknown';
}

function resolveProvider(): 'apns' | 'fcm' | 'expo' {
  if (Platform.OS === 'ios') return 'apns';
  if (Platform.OS === 'android') return 'fcm';
  return 'expo';
}

export function useSyncPushToken() {
  const registerPush = useRegisterPush();
  const unregisterPush = useUnregisterPush();

  const syncAfterPermissionGrant = useCallback(async () => {
    const permitted = await getPushNotificationsPermission();
    if (!permitted) {
      registerForPushNotifications();
    }
    const granted = await getPushNotificationsPermission();
    if (!granted) return { ok: false as const, reason: 'denied' };

    const token = await getPushNotificationsToken();
    if (!token) return { ok: false as const, reason: 'no_token' };

    const deviceId =
      Platform.OS === 'ios'
        ? (await Application.getIosIdForVendorAsync()) ?? 'ios-unknown'
        : Application.getAndroidId() ?? 'android-unknown';

    await registerPush.mutateAsync({
      device_id: deviceId,
      provider: resolveProvider(),
      token,
      platform: Device.osName ?? undefined,
      model: Device.modelName ?? undefined,
    });

    return { ok: true as const };
  }, [registerPush]);

  const syncUnregister = useCallback(
    async (deviceId: string) => {
      await unregisterPush.mutateAsync({ device_id: deviceId });
    },
    [unregisterPush]
  );

  return { syncAfterPermissionGrant, syncUnregister };
}
```

Wire from `notifications.tsx` toggle and from contextual permission moment (**03**).

**Note:** If product converges on OneSignal-only with `external_id` send, backend register may store OneSignal subscription id only — reconcile with G1 Courier removal.
