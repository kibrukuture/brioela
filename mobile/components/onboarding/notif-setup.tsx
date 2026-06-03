import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Path, Circle } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import * as Burnt from 'burnt';
import { useAppStore } from '@/stores/ui/use-app-store';

export default function NotifSetup() {
  const { setLocalNotificationsEnabled } = useAppStore();

  const handleLocalNotificationToggle = async () => {
    try {
      // Check current permission status first
      const currentPermission = await Notifications.getPermissionsAsync();

      // If already granted, show success message
      if (currentPermission.status === 'granted') {
        await setLocalNotificationsEnabled(true);
        Burnt.toast({
          title: "🎉 You're all set!",
          message: 'Notifications are enabled',
          preset: 'done',
          haptic: 'success',
          duration: 2,
        });
        return;
      }

      if (currentPermission.status === 'denied') {
        Alert.alert(
          'Notifications Disabled',
          'Feymark needs notification permission to remind you about your tasks and events. Please enable it in Settings.',
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
        return;
      }

      // Request permission for the first time
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        await setLocalNotificationsEnabled(true);
        Burnt.toast({
          title: '🎉 Perfect!',
          message: "We'll keep you on track",
          preset: 'done',
          haptic: 'success',
          duration: 2.5,
        });
      } else {
        await setLocalNotificationsEnabled(false);
        Burnt.toast({
          title: 'No worries!',
          message: 'You can enable this later in settings',
          preset: 'none',
          haptic: 'warning',
          duration: 3,
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      Burnt.toast({
        title: 'Oops!!',
        message: 'Something went wrong.Please try again',
        preset: 'error',
        haptic: 'error',
        duration: 3,
      });
      await setLocalNotificationsEnabled(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-10 items-center justify-center">
          <View className="relative">
            <Svg width={100} height={100} viewBox="0 0 100 100">
              <Path d="M35 80 C40 85 60 85 65 80 L65 75 L35 75 Z" fill="#E0E0E0" />
              <Path
                d="M50 30 C35 30 30 45 30 60 L30 75 L70 75 L70 60 C70 45 65 30 50 30 Z"
                fill="#E0E0E0"
              />
              <G transform="translate(65, 35)">
                <Circle cx="0" cy="0" r="10" fill="#FF4040" />
                <Text
                  // @ts-ignore
                  x="0"
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="bold">
                  1
                </Text>
              </G>
            </Svg>
          </View>
        </View>

        <Text className="text-center font-parafina text-6xl italic text-[#1E2A3B]">Never Miss</Text>
        <Text className="mb-12 mt-4 text-center text-xl text-[#1E2A3B]">
          Medication times, doctor visits, refills—reminded when it matters.
        </Text>

        <TouchableOpacity
          onPress={handleLocalNotificationToggle}
          className="mb-4 rounded-full border border-[#7B68EE] px-6 py-3"
          activeOpacity={0.8}>
          <Text className="text-center text-base font-medium text-[#7B68EE]">
            Turn On Reminders
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
