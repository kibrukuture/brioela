import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { ArrowLeft, Bell, Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  registerForPushNotifications,
  getPushNotificationsPermission,
  optInPushNotifications,
  optOutPushNotifications,
} from '@/lib/push-notifications/one-signal';
import * as Burnt from 'burnt';
import { usePushToggleStore } from '@/stores/ui/use-push-toggle-store';

export default function ProfileNotificationsScreen(): React.JSX.Element {
  const router = useRouter();
  const [emailEnabled, setEmailEnabled] = useState<boolean>(false);
  const pushEnabled = usePushToggleStore((s) => s.enabled);
  const setPushEnabled = usePushToggleStore((s) => s.setEnabled);
  const [pushLoading, setPushLoading] = useState<boolean>(false);

  const handleBack = (): void => {
    router.back();
  };

  const registerPush = useCallback(async (): Promise<void> => {
    const has = await getPushNotificationsPermission();
    if (!has) {
      registerForPushNotifications();
      const after = await getPushNotificationsPermission();
      if (!after) {
        Alert.alert(
          'Notifications Disabled',
          'Enable notifications in Settings to receive push notifications.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        setPushEnabled(false);
        return;
      }
    }
    optInPushNotifications();
    Burnt.toast({
      title: 'Notifications enabled',
      preset: 'done',
      haptic: 'success',
      duration: 2,
    });
  }, []);

  const unregisterPush = useCallback(async (): Promise<void> => {
    optOutPushNotifications();
    Burnt.toast({
      title: 'Notifications disabled',
      preset: 'done',
      haptic: 'success',
      duration: 2,
    });
  }, []);

  const onTogglePush = useCallback(
    async (value: boolean): Promise<void> => {
      setPushEnabled(value);
      setPushLoading(true);
      try {
        if (value) {
          await registerPush();
        } else {
          await unregisterPush();
        }
      } finally {
        setPushLoading(false);
      }
    },
    [registerPush, unregisterPush]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity
          onPress={handleBack}
          className="h-12 w-12 items-center justify-center rounded-full bg-white">
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View className="px-5 py-4">
        <Text className="text-2xl font-semibold text-gray-900">Notifications</Text>
        <Text className="mt-2 text-sm text-gray-600">
          Choose how you receive updates from Schnl.
        </Text>
      </View>

      <View className="mx-5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
        <View className="flex-row items-center justify-between border-b border-gray-200 pb-3">
          <View className="flex-row items-center">
            <View className="mr-3 h-6 w-6 items-center justify-center">
              <Mail size={20} color="#666" />
            </View>
            <Text className="text-base">Email</Text>
          </View>
          <Switch value={emailEnabled} onValueChange={setEmailEnabled} />
        </View>

        <View className="flex-row items-center justify-between border-b border-gray-200 py-3">
          <View className="flex-row items-center">
            <View className="mr-3 h-6 w-6 items-center justify-center">
              <Bell size={20} color="#666" />
            </View>
            <Text className="text-base">Push</Text>
          </View>
          <View className={pushLoading ? 'relative opacity-60' : 'relative'}>
            <Switch value={pushEnabled} onValueChange={onTogglePush} disabled={pushLoading} />
            {pushLoading && (
              <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
                <ActivityIndicator size="small" color="#1D3D2C" />
              </View>
            )}
          </View>
        </View>

        {/* Removed Native Note toggle */}
      </View>
    </SafeAreaView>
  );
}
