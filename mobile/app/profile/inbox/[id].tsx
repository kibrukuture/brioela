import React, { useMemo } from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { ArrowLeft, Link as LinkIcon } from 'lucide-react-native';
import { useInAppNotifications } from '@/network/in-app-notifications/use-in-app-notifications';
import { useUpdateInAppNotification } from '@/network/in-app-notifications/use-update-in-app-notification';

export default function InAppNotificationDetailsScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? '';

  const notificationsQuery = useInAppNotifications();
  const updateMutation = useUpdateInAppNotification();

  const notification = useMemo(() => {
    const list = notificationsQuery.data?.notifications ?? [];
    return list.find((n) => n.id === id) ?? null;
  }, [notificationsQuery.data, id]);

  useIsomorphicLayoutEffect(() => {
    if (!notification) return;
    if (notification.isRead) return;
    updateMutation.mutate({ id: notification.id, input: { isRead: true } });
  }, [notification]);

  const onOpenLink = async () => {
    if (!notification?.link) return;

    const link = notification.link;

    const targetUrl = link.startsWith('/') ? ExpoLinking.createURL(link) : link;

    const canOpen = await Linking.canOpenURL(targetUrl);
    if (!canOpen) return;

    await Linking.openURL(targetUrl);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-12 w-12 items-center justify-center rounded-full bg-white">
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View className="px-5 py-2">
        <Text className="text-2xl text-neutral-900" style={{ fontFamily: 'parafina' }}>
          {notification?.title ?? 'Notification'}
        </Text>
        {notification?.createdAt ? (
          <Text className="mt-2 text-xs text-neutral-400">
            {new Date(notification.createdAt).toLocaleString()}
          </Text>
        ) : null}
      </View>

      <View className="flex-1 px-5 pt-4">
        {notification ? (
          <>
            <Text className="text-base text-neutral-800">{notification.body}</Text>

            {notification.link ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onOpenLink}
                className="mt-6 flex-row items-center justify-center rounded-2xl bg-neutral-900 px-4 py-3">
                <LinkIcon size={16} color="#fff" />
                <Text className="ml-2 text-sm font-semibold text-white">
                  {notification.actionLabel ?? 'Open'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : notificationsQuery.isLoading ? (
          <Text className="text-sm text-neutral-500">Loading</Text>
        ) : (
          <Text className="text-sm text-neutral-500">Notification not found</Text>
        )}
      </View>
    </SafeAreaView>
  );
}
