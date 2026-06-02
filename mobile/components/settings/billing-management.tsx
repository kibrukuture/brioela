import React from 'react';
import {
  View,
  Text,
  Modal,
  Platform,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import * as Burnt from 'burnt';

import ModalHandle from '@/components/ui/modal-handle';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/hooks/users/use-user';
import { useStripeBilling } from '@/hooks/payments/use-stripe-billing';

interface BillingManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

const BillingManagementModal: React.FC<BillingManagementModalProps> = ({ visible, onClose }) => {
  const { data: user } = useUser();

  const { mutate: openStripeBilling, isPending } = useStripeBilling();

  const handleManageSubscription = async () => {
    if (!user?.subscriptionPlatform) {
      Burnt.toast({
        title: '',
        message: 'Unknown subscription source',
        preset: 'error',
      });
      return;
    }

    switch (user.subscriptionPlatform) {
      case 'APP_STORE': {
        // iOS App Store subscription management
        const appStoreUrl = 'https://apps.apple.com/account/subscriptions';
        try {
          const canOpen = await Linking.canOpenURL(appStoreUrl);
          if (canOpen) {
            await Linking.openURL(appStoreUrl);
          } else {
            Burnt.toast({
              title: 'Error',
              message: 'Unable to open App Store',
              preset: 'error',
            });
          }
        } catch {
          Burnt.toast({
            title: 'Error',
            message: 'Failed to open App Store subscription management',
            preset: 'error',
          });
        }
        break;
      }

      case 'PLAY_STORE': {
        // Android Play Store subscription management
        const playStoreUrl = 'https://play.google.com/store/account/subscriptions';
        try {
          const canOpen = await Linking.canOpenURL(playStoreUrl);
          if (canOpen) {
            await Linking.openURL(playStoreUrl);
          } else {
            Burnt.alert({
              title: 'Error',
              message: 'Unable to open Play Store',
              preset: 'error',
            });
          }
        } catch (error: unknown) {
          Burnt.alert({
            title: 'Error',
            message:
              error instanceof Error
                ? error?.message
                : 'Failed to open Play Store subscription management',
            preset: 'error',
          });
        }
        break;
      }

      case 'STRIPE': {
        if (user?.id) {
          openStripeBilling();
        }
        break;
      }

      default: {
        Burnt.toast({
          title: 'Error',
          message: 'Unsupported subscription platform',
          preset: 'error',
        });
        break;
      }
    }
  };

  return (
    <Modal
      visible={visible}
      statusBarTranslucent
      transparent={false}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}>
      <SafeAreaView className="flex-1">
        <ModalHandle onClose={onClose} />

        <View className="mb-16 items-center justify-center px-6">
          <Text className="mb-8 text-center font-parafina text-6xl text-[#1E2A3B]">Billing</Text>

          <View className="w-full">
            <Text className="mb-4 text-center text-sm text-gray-600">
              Manage your billing and preferences.
            </Text>

            <View className="flex-row items-center justify-between p-4">
              <View className="flex-1 flex-row items-center">
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">Schnl Pro</Text>
                  <Text className="text-sm text-gray-500">
                    {user?.subscriptionTier} subscription
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleManageSubscription}
                disabled={isPending}
                className="rounded-lg border border-gray-200 px-4 py-2 text-center font-semibold"
                style={{ overflow: 'hidden' }}>
                {isPending ? <ActivityIndicator size="small" /> : <Text>Manage</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default BillingManagementModal;
