import { Stack } from 'expo-router';
import { SheetContentWrapper } from '@/components/ui/sheet';

export default function Layout() {
  return (
    <SheetContentWrapper>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </SheetContentWrapper>
  );
}
