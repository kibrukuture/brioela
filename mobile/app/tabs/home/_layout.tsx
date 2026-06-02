import { Stack } from 'expo-router';
import { SheetContentWrapper } from '@/components/ui/sheet';
import HomeHeaderLeft from '@/components/home/header-left';
import HomeHeaderRight from '@/components/home/header-right';
import { View } from 'react-native';

export default function Layout() {
  return (
    <SheetContentWrapper>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: '',
          headerStyle: { backgroundColor: 'transparent' },
        }}>
        <Stack.Screen
          name="index"
          options={{
            header: () => (
              <View className="flex-row items-center justify-between px-4 pt-16">
                <HomeHeaderLeft />
                <HomeHeaderRight />
              </View>
            ),
          }}
        />
      </Stack>
    </SheetContentWrapper>
  );
}
