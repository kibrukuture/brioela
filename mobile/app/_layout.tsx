import { useCallback, useEffect } from 'react';
import { initI18n } from '@/lib/i18n';
import * as SystemUI from 'expo-system-ui';
import '../global.css';
import 'expo-dev-client';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { SheetProvider } from '@/components/ui/sheet-provider';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme, useInitialAndroidBarSync } from '@/lib/useColorScheme';
import { NAV_THEME } from '@/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { QueryProvider } from '@/providers/query-provider';
import AppGate from '@/components/auth/app-gate';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useUserPreferencesStore } from '@/stores/account/use-user-preferences';
import { useAppStore } from '@/stores/ui/use-app-store';
import { useLanguageStore } from '@/stores/ui/use-language-store';
import { useNetworkStore } from '@/stores/account/use-network-store';
import { PostHogProvider } from '@/providers/posthog-provider';
import { PostHogScreenTracker } from '@/components/posthog/posthog-screen-tracker';
import { TanStackQueryNativeSetup } from '@/components/tanstack/tanstack-query-native-setup';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { initializeOneSignal } from '@/lib/push-notifications/one-signal';
import { PaperProvider } from 'react-native-paper';

// import { useQueryNativeSetup } from '@/hooks/tanstack/use-query-native-setup';

// Set the background color
SystemUI.setBackgroundColorAsync('#FFFFFF');
// Keep the splash screen visible
SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

// Configure how notifications behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show the notification banner
    shouldPlaySound: true, // Play notification sound
    shouldSetBadge: false, // Don't update app badge (optional)
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
//

export default function RootLayout() {
  useInitialAndroidBarSync();
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  initializeOneSignal();

  // useQueryNativeSetup();
  // tracking screen views

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    parafina_black: require('@/assets/fonts/parafina_black.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    initI18n();
    // load the global stores:
    useUserPreferencesStore.getState().loadPreferences();
    useAppStore.getState().loadPreferences();
    useLanguageStore.getState().loadLanguage();
  }, []);

  useEffect(() => {
    // Initialize network monitoring
    useNetworkStore.getState().initialize();
    return () => {
      useNetworkStore.getState().cleanup();
    };
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <SafeAreaProvider>
        <KeyboardProvider>
          <PaperProvider>
            <QueryProvider>
              <TanStackQueryNativeSetup />
              <PostHogProvider>
                <PostHogScreenTracker>
                  <StatusBar style={isDarkColorScheme ? 'light' : 'dark'} />
                  <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
                    <SheetProvider>
                      <ActionSheetProvider>
                        <NavThemeProvider value={NAV_THEME[colorScheme]}>
                          <AppGate>
                            <Stack screenOptions={{ headerShown: false }} />
                          </AppGate>
                        </NavThemeProvider>
                      </ActionSheetProvider>
                    </SheetProvider>
                  </GestureHandlerRootView>
                </PostHogScreenTracker>
              </PostHogProvider>
            </QueryProvider>
          </PaperProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </>
  );
}
