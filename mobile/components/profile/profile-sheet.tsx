import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { User, Gear, SignOut } from 'phosphor-react-native';
import { useProfileSheet } from '@/stores/ui/use-profile-sheet-store';
import { router } from 'expo-router';

export default function ProfileSheet() {
  const dismissSheet = useProfileSheet((s) => s.dismissSheet);

  const btnClass =
    'flex-1 basis-[45%] max-w-[48%] items-center justify-center rounded-lg border border-gray-300 px-4 py-3';

  return (
    <View className="flex-1 px-6 pt-4">
      <View className="mb-4">
        <Text className="font-parafina    text-[#1E2A3B]">Profile</Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => {
            dismissSheet();
            router.push('/kyc');
          }}
          className={btnClass}>
          <View className="flex-row gap-4">
            <View>
              <User size={16} color="#6B7280" weight="fill" />
            </View>
            <View>
              <Text className="font-semibold text-gray-600">Identity</Text>
              <Text className="text-xs font-extralight italic text-gray-400">KYC</Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            dismissSheet();
            // TODO: Brioela payments
          }}
          className={btnClass}>
          <View className="flex-row gap-4">
            <View>
              <Gear size={16} color="#6B7280" weight="fill" />
            </View>
            <View>
              <Text className="font-semibold text-gray-600">Settings</Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            dismissSheet();
          }}
          className={btnClass}>
          <View className="flex-row gap-4">
            <View>
              <SignOut size={16} color="#6B7280" weight="fill" />
            </View>
            <View>
              <Text className="font-semibold text-gray-600">Sign out</Text>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
