import { View, Text, useWindowDimensions, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { PaginationDots } from '../components/pagination-dots';
import { BottomGlow } from '../components/bottom-glow';
import { OnboardingSlideContainer } from '../components/onboarding-slide-container';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react';
import { Welcome } from '../components/slides/welcome';
import { Essentials } from '../components/slides/essentials';
import { BackedInfo } from '../components/slides/backed-info';
import { Share } from '../components/slides/share';
import { NotMedicalAdvice } from '../components/slides/not-medical-advice';
import { AnimatedIndexContextProvider } from '../lib/animated-index-context';

// longevity-deck-onboarding-animation 🔽

/**
 * Creates an animated Pressable component to enable spring animations on button.
 * Required because Pressable isn't natively animatable - see Reanimated docs:
 * https://docs.swmansion.com/react-native-reanimated/docs/core/createAnimatedComponent
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Color palette for bottom glow gradient, one color per slide.
 * Interpolated via HSV color space for smooth transitions between slides.
 */
const PALETTE = ['#321A48', '#192444', '#1C3F2D', '#44382A', '#391C1D'];

const TOTAL_SLIDES = 6;

const Onboarding = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  /**
   * Shared values that drive all animations:
   * - scrollOffsetX: Raw pixel offset from scroll (for future use)
   * - activeIndex: Normalized slide index (0-4), computed from scroll position
   */
  const scrollOffsetX = useSharedValue(0);
  const activeIndex = useSharedValue(0);

  /**
   * Handles scroll events and updates shared values on the UI thread.
   * activeIndex calculation: offsetX / width converts pixel position to slide index.
   * This runs at 60fps via scrollEventThrottle={16} for smooth animations.
   */
  const scrollHandler = useAnimatedScrollHandler((event) => {
    const offsetX = event.contentOffset.x;
    scrollOffsetX.set(offsetX);
    activeIndex.set(offsetX / width);
  });

  /**
   * Animates "I understand" button fade-in on the last slide.
   * Interpolation: [beforeLastIndex, lastIndex] → [0, 1] opacity
   * CLAMP prevents opacity > 1 if user scrolls beyond last slide.
   * pointerEvents: "none" prevents taps before button is visible.
   */
  const rButtonStyle = useAnimatedStyle(() => {
    const beforeLastIndex = TOTAL_SLIDES - 2;
    const lastIndex = TOTAL_SLIDES - 1;

    return {
      opacity: interpolate(
        activeIndex.get(),
        [beforeLastIndex, lastIndex],
        [0, 1],
        Extrapolation.CLAMP
      ),
      pointerEvents: activeIndex.get() === lastIndex ? 'auto' : 'none',
    };
  }, [width]);

  return (
    <AnimatedIndexContextProvider activeIndex={activeIndex}>
      <View className="flex-1 bg-[#161522]" style={{ paddingBottom: insets.bottom + 8 }}>
        <BottomGlow palette={PALETTE} width={width} height={height} activeIndex={activeIndex} />

        {/* scrollEventThrottle={16} ensures scroll events fire at ~60fps (1000ms/16ms).
            Critical for smooth animation - lower values = more events = smoother motion. */}
        <Animated.ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 40 }}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          onScroll={scrollHandler}
          scrollEventThrottle={16}>
          <OnboardingSlideContainer
            title="One health record"
            subtitle="Every test, every visit, right here. All your health records in one place.">
            <Welcome />
          </OnboardingSlideContainer>
          <OnboardingSlideContainer
            title="Just Snap It!"
            subtitle="Lab work, prescriptions, doctor notes—all saved."
            description={
              <View className="mt-2 w-full items-start gap-2">
                <Text className="text-base text-zinc-300">→ Save medical docs in seconds</Text>
                <Text className="text-base text-zinc-300">→ Records auto-organized</Text>
                <Text className="text-base text-zinc-300">→ Health trends you can track</Text>
                <Text className="text-base text-zinc-300">→ Everything in one place</Text>
                <Text className="text-base text-zinc-300">→ Find records when you need them</Text>
              </View>
            }>
            <Essentials />
          </OnboardingSlideContainer>
          <OnboardingSlideContainer
            title="Ask. Get It."
            subtitle="Search like you speak."
            description={
              <View className="mt-2 w-full items-start gap-2">
                <Text className="text-base text-zinc-300">→ Show my cholesterol from June</Text>
                <Text className="text-base text-zinc-300">→ Type how you think</Text>
                <Text className="text-base text-zinc-300">→ Get what you meant</Text>
              </View>
            }>
            <BackedInfo />
          </OnboardingSlideContainer>
          <OnboardingSlideContainer
            title="Watch Changes"
            subtitle="Track how your numbers move over months and years."
            description={
              <View className="mt-2 w-full items-start gap-2">
                <Text className="text-base text-zinc-300">→ Spot patterns in lab work</Text>
                <Text className="text-base text-zinc-300">→ See improvement or concerns</Text>
                <Text className="text-base text-zinc-300">→ Share trends with doctors</Text>
              </View>
            }>
            <Share />
          </OnboardingSlideContainer>
          <OnboardingSlideContainer
            title="The Full Picture"
            subtitle="Symptoms, meds, test results—how they all connect."
            description={
              <View className="mt-2 w-full items-start gap-2">
                <Text className="text-base text-zinc-300">→ Understand your test numbers</Text>
                <Text className="text-base text-zinc-300">→ Link symptoms to your tests</Text>
                <Text className="text-base text-zinc-300">→ Whole picture, not just pieces</Text>
              </View>
            }>
            <NotMedicalAdvice />
          </OnboardingSlideContainer>
        </Animated.ScrollView>

        <View className="gap-5 px-5 pt-5">
          <PaginationDots numberOfDots={TOTAL_SLIDES} activeIndex={activeIndex} />
          <AnimatedPressable
            className="h-[50px] items-center justify-center rounded-full bg-white"
            style={[rButtonStyle, styles.borderCurve]}>
            <Text className="text-xl font-medium text-black">I understand</Text>
          </AnimatedPressable>
        </View>
      </View>
    </AnimatedIndexContextProvider>
  );
};

const styles = StyleSheet.create({
  borderCurve: {
    borderCurve: 'continuous',
  },
});

export default Onboarding;

// longevity-deck-onboarding-animation 🔼
