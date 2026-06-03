import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Dimensions, Platform, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import Welcome from '@/components/onboarding/welcome';
import OnboardingTwo from '@/components/onboarding/two';
import OnboardingThree from '@/components/onboarding/three';
import NotifSetup from '@/components/onboarding/notif-setup';
import OnboardingFive from '@/components/onboarding/five';
import OnboardingSix from '@/components/onboarding/six';
import Account from '@/features/auth/components/account';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { now } from '@/lib/date-time-utils';

const { width } = Dimensions.get('window');

const screens = [
  <Welcome />,
  <OnboardingTwo />,
  <OnboardingThree />,
  <NotifSetup />,
  <OnboardingFive />,
  <OnboardingSix />,
  <Account />,
];

const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<ICarouselInstance>(null);

  const absProgress = useSharedValue(0);
  const trackW = useSharedValue(0);

  const lastIndexRef = useRef(0);
  const lastHapticAtRef = useRef(0);

  const barStyle = useAnimatedStyle(() => {
    const pct = Math.min(1, Math.max(0, (absProgress.value + 1) / screens.length));
    return { width: trackW.value * pct };
  });

  const activeDotColorHex = '#374151';
  const inactiveDotColorHex = '#D1D5DB';

  const onGetStarted = () => {
    carouselRef.current?.scrollTo({ index: screens.length - 1, animated: true });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <View
          className="mx-auto mt-4 h-2 w-10/12 overflow-hidden rounded-full"
          style={{ backgroundColor: inactiveDotColorHex }}
          onLayout={(e) => {
            trackW.value = e.nativeEvent.layout.width;
          }}>
          <Animated.View
            style={[{ height: '100%', backgroundColor: activeDotColorHex }, barStyle]}
          />
        </View>
        <View className="flex-1">
          <Carousel
            ref={carouselRef}
            loop={false}
            width={width}
            data={screens}
            onProgressChange={(_, absoluteProgress) => {
              absProgress.value = absoluteProgress;

              const newIndex = Math.round(absoluteProgress);
              if (newIndex !== lastIndexRef.current) {
                setCurrentIndex(newIndex);

                const nowTime = now().getTime();
                // throttle to avoid rapid repeats if user swipes fast
                if (Platform.OS === 'ios' && nowTime - lastHapticAtRef.current > 120) {
                  Haptics.selectionAsync(); // very subtle
                  lastHapticAtRef.current = nowTime;
                }

                lastIndexRef.current = newIndex;
              }
            }}
            renderItem={({ index }) => screens[index]}
          />
        </View>
        {currentIndex < screens.length - 1 && (
          <View className="mx-auto mb-10 w-10/12">
            <TouchableOpacity
              className="w-full items-center rounded-full bg-gray-700 px-4 py-3"
              onPress={onGetStarted}
              activeOpacity={0.8}>
              <Text className="text-base font-medium text-white">Get Started</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;
