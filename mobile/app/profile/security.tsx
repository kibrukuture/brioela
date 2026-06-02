import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Switch, ScrollView, Alert } from 'react-native';
import { BackButton } from '@/components/ui/back-button';
import { SECURE_STORAGE_KEYS } from '@/constants';
import { useLocalAuthentication } from '@/hooks/auth/use-local-authentication';
import { encryptedStorage } from '@/lib/storage/encrypted-storage';

export default function ProfileSecurityScreen(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [deviceAuthEnabled, setDeviceAuthEnabled] = useState(false);
  const { authenticate, isAvailable } = useLocalAuthentication();

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const value = await encryptedStorage.get(SECURE_STORAGE_KEYS.LOCAL_DEVICE_AUTH_ENABLED);
        setDeviceAuthEnabled(value === 'true');
      } catch (error) {
        console.warn('[security] failed to load device auth preference', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPreference();
  }, []);

  const handleToggle = async (nextValue: boolean) => {
    try {
      if (nextValue) {
        if (!isAvailable) {
          Alert.alert(
            'Not available',
            'Biometrics or device passcode are not set up on this device.'
          );
          return;
        }
        const result = await authenticate({
          promptMessage: 'Authenticate to enable device protection',
        });
        if (!result.success || !('authenticated' in result) || !result.authenticated) {
          Alert.alert('Authentication required', 'Device authentication failed or was cancelled.');
          return;
        }
      }
      await encryptedStorage.set(
        SECURE_STORAGE_KEYS.LOCAL_DEVICE_AUTH_ENABLED,
        JSON.stringify(nextValue)
      );
      setDeviceAuthEnabled(nextValue);
    } catch (error) {
      console.warn('[security] failed to save device auth preference', error);
      Alert.alert('Error', 'Could not update device authentication setting.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />
      <ScrollView contentContainerClassName="px-5 py-6">
        <View className="mb-6">
          <Text className="text-2xl font-semibold text-gray-900">Security</Text>
          <Text className="mt-2 text-sm text-gray-600">
            Protect sensitive actions with Face/Touch ID or device PIN on this device.
          </Text>
        </View>

        <View className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-base font-medium text-gray-900">Device authentication</Text>
              <Text className="mt-1 text-sm text-gray-600">
                Require Face/Touch ID or device PIN before viewing card details or other sensitive
                info on this device.
              </Text>
            </View>
            <Switch disabled={isLoading} value={deviceAuthEnabled} onValueChange={handleToggle} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
