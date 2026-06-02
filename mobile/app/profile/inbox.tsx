import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Trash2 } from 'lucide-react-native';
import { BackButton } from '@/components/ui/back-button';
import { useInAppNotifications } from '@/hooks/in-app-notifications/use-in-app-notifications';
import { useUpdateInAppNotification } from '@/hooks/in-app-notifications/use-update-in-app-notification';
import { useMarkAllInAppNotificationsRead } from '@/hooks/in-app-notifications/use-mark-all-in-app-notifications-read';
import { useInAppNotificationsWebsocket } from '@/hooks/in-app-notifications/use-in-app-notifications-websocket';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';

export default function ProfileInboxScreen(): React.JSX.Element {
  useInAppNotificationsWebsocket();

  const router = useRouter();

  const notificationsQuery = useInAppNotifications();
  const updateMutation = useUpdateInAppNotification();
  const markAllReadMutation = useMarkAllInAppNotificationsRead();

  const notifications = notificationsQuery.data?.notifications ?? [];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <View className="flex-1">
        <View className="px-4 pt-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl text-neutral-900" style={{ fontFamily: 'parafina' }}>
              Inbox
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={markAllReadMutation.isPending}
              onPress={() => markAllReadMutation.mutate()}>
              <Text className="text-sm font-semibold text-neutral-900">Mark all read</Text>
            </TouchableOpacity>
          </View>
        </View>

        {notificationsQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <Bell size={22} color="#171717" />
            </View>
            <Text className="mt-3 text-sm text-neutral-500">Loading</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <Bell size={22} color="#171717" />
            </View>
            <Text className="mt-3 text-sm text-neutral-500">No notifications</Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 24 }}>
            <View className="rounded-2xl border border-neutral-100 bg-white">
              {notifications.map((n, index) => {
                const isLast = index === notifications.length - 1;

                const openDetails = async () => {
                  if (!n.isRead) {
                    updateMutation.mutate({ id: n.id, input: { isRead: true } });
                  }
                  router.push({ pathname: '/profile/inbox/[id]', params: { id: n.id } });
                };

                const deleteNotification = () => {
                  updateMutation.mutate({ id: n.id, input: { isDeleted: true } });
                };

                return (
                  <Swipeable
                    key={n.id}
                    renderRightActions={() => (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={deleteNotification}
                        className="h-full items-center justify-center bg-red-500 px-5">
                        <Trash2 size={18} color="#fff" />
                        <Text className="mt-1 text-xs font-semibold text-white">Delete</Text>
                      </TouchableOpacity>
                    )}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={openDetails}
                      className={`px-4 py-4 ${!isLast ? 'border-b border-neutral-100' : ''}`}>
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <Text
                            className={`text-base ${
                              n.isRead ? 'text-neutral-900' : 'font-semibold text-neutral-900'
                            }`}>
                            {n.title}
                          </Text>
                          <Text className="mt-1 text-sm text-neutral-500" numberOfLines={2}>
                            {n.body}
                          </Text>
                          <Text className="mt-2 text-xs text-neutral-400">
                            {new Date(n.createdAt).toLocaleString()}
                          </Text>
                        </View>

                        {!n.isRead ? (
                          <View className="mt-1 h-2 w-2 rounded-full bg-neutral-900" />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
