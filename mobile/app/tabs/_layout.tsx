import React from 'react';
import { Tabs } from '@/components/ui/bottom-tabs';
import { useProtectedRoute } from '@/features/auth/hooks/use-protected-route';
import { Platform } from 'react-native';

export default function TabsLayout() {
  useProtectedRoute();

  return (
    <>
      <Tabs
        // labeled={false}
        screenOptions={{
          lazy: false, // stops the screens from being jumpy when switching tabs
        }}
        //
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: () =>
              Platform.OS === 'ios'
                ? { sfSymbol: 'sparkles' }
                : require('@/assets/icons/sparkles.png'),
          }}
        />

        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Activities',

            tabBarIcon: () =>
              Platform.OS === 'ios'
                ? { sfSymbol: 'list.bullet' }
                : require('@/assets/icons/settings.png'),
          }}
        />

        <Tabs.Screen
          name="recipients"
          options={{
            title: 'Recipients',

            tabBarIcon: () =>
              Platform.OS === 'ios'
                ? { sfSymbol: 'person.2.fill' }
                : require('@/assets/icons/pill.png'),
          }}
        />

        <Tabs.Screen
          name="cards"
          options={{
            title: 'Cards',

            tabBarIcon: () =>
              Platform.OS === 'ios'
                ? { sfSymbol: 'creditcard.fill' }
                : require('@/assets/icons/activity.png'),
          }}
        />
      </Tabs>
    </>
  );
}
