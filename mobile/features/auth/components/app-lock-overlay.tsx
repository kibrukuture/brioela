import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { AppState, type AppStateStatus, Image, Pressable, Text, View } from 'react-native';
import { ScanFace } from 'lucide-react-native';
import { getAuthenticationInfo } from '@/lib/auth/local-authentication';
import { useDeviceAuthGate } from '@/features/auth/hooks/use-device-auth-gate';
import { useAuthStore } from '@/stores/account/use-auth-store';

export default function AppLockOverlay({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { requireDeviceAuth, isEnabled } = useDeviceAuthGate();

  const [deviceAuthEnabled, setDeviceAuthEnabled] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [buttonLabel, setButtonLabel] = useState<string>('Unlock');

  const didInitialLockRef = useRef<boolean>(false);
  const shouldLockOnNextActiveRef = useRef<boolean>(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const isEligible = useMemo(() => {
    return Boolean(user) && deviceAuthEnabled;
  }, [user, deviceAuthEnabled]);

  useIsomorphicLayoutEffect(() => {
    const loadPreference = async () => {
      try {
        setDeviceAuthEnabled(await isEnabled());
      } catch {
        setDeviceAuthEnabled(false);
      }
    };

    loadPreference();
  }, [isEnabled]);

  useIsomorphicLayoutEffect(() => {
    if (didInitialLockRef.current) return;
    if (!user) return;
    if (!deviceAuthEnabled) return;
    didInitialLockRef.current = true;
    setIsLocked(true);
  }, [deviceAuthEnabled, user]);

  useIsomorphicLayoutEffect(() => {
    const loadButtonLabel = async () => {
      try {
        const info = await getAuthenticationInfo();
        if (!info.isAvailable) {
          setButtonLabel('Unlock');
          return;
        }
        if (info.hasFaceId) {
          setButtonLabel('Unlock with Face ID');
          return;
        }
        if (info.hasFingerprint) {
          setButtonLabel('Unlock with Touch ID');
          return;
        }
        if (info.hasPasscode) {
          setButtonLabel('Unlock with Passcode');
          return;
        }
        setButtonLabel('Unlock');
      } catch {
        setButtonLabel('Unlock');
      }
    };

    loadButtonLabel();
  }, []);

  const unlock = useCallback(async () => {
    if (!isEligible) return;

    setIsUnlocking(true);
    try {
      const ok = await requireDeviceAuth('Unlock Schnl to continue');
      if (ok) {
        setIsLocked(false);
        shouldLockOnNextActiveRef.current = false;
        return;
      }

      setIsLocked(true);
    } finally {
      setIsUnlocking(false);
    }
  }, [isEligible, requireDeviceAuth]);

  useIsomorphicLayoutEffect(() => {
    const onAppStateChange = (nextAppState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextAppState;

      if (!user) {
        setIsLocked(false);
        shouldLockOnNextActiveRef.current = false;
        return;
      }

      if (nextAppState === 'background') {
        if (deviceAuthEnabled) {
          shouldLockOnNextActiveRef.current = true;
        }
        return;
      }

      if ((prev === 'background' || prev === 'inactive') && nextAppState === 'active') {
        if (shouldLockOnNextActiveRef.current && deviceAuthEnabled) {
          setIsLocked(true);
        }
      }
    };

    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, [deviceAuthEnabled, user]);

  useIsomorphicLayoutEffect(() => {
    if (isLocked && isEligible) {
      unlock();
    }
  }, [isLocked, isEligible, unlock]);

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <Image source={require('@/assets/media/logo.png')} className="mb-6 h-20 w-20" />

        <Text className="text-center text-4xl font-extralight text-[#1E2A3B]">Schnl</Text>

        <View className="mt-10 items-center">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-gray-100">
            <ScanFace size={44} color="#111" />
          </View>
          <Text className="mt-6 text-center text-4xl font-black text-[#111]">
            UNLOCK THE APP{`\n`}TO CONTINUE
          </Text>
        </View>

        <View className="mt-12 w-full">
          <Pressable
            disabled={isUnlocking}
            onPress={unlock}
            className={`w-full items-center rounded-full px-4 py-4 ${
              isUnlocking ? 'bg-lime-300/60' : 'bg-lime-300'
            }`}>
            <Text className="text-base font-semibold text-green-900">{buttonLabel}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              useAuthStore.getState().signOut();
            }}
            className="mt-6 items-center">
            <Text className="text-base font-semibold text-green-900 underline">Log out</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
