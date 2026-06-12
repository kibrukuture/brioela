# Draft: one-signal.ts — production snapshot (mobile)

Target: `mobile/lib/push-notifications/one-signal.ts`

```typescript
import { OneSignal } from 'react-native-onesignal';
import { Alert } from 'react-native';

const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;

export const initializeOneSignal = () => {
  if (!appId) {
    Alert.alert('Error', 'Could not configure push notifications');
    return;
  }
  OneSignal.initialize(appId);
};

export const registerForPushNotifications = () => {
  OneSignal.Notifications.requestPermission(true);
};

export const unregisterForPushNotifications = () => {
  OneSignal.Notifications.requestPermission(false);
};

export const getPushNotificationsPermission = async () => {
  return await OneSignal.Notifications.getPermissionAsync();
};

export const getPushNotificationsToken = async () => {
  return await OneSignal.User.pushSubscription.getTokenAsync();
};

export const getPushNotificationsEnabled = async () => {
  return await OneSignal.Notifications.getPermissionAsync();
};

export const optInPushNotifications = () => {
  OneSignal.User.pushSubscription.optIn();
};

export const optOutPushNotifications = () => {
  OneSignal.User.pushSubscription.optOut();
};
```

**Gap:** No call to `notificationsApi.registerPush` after token obtained — see `mobile-push-backend-sync.gap.md`.
