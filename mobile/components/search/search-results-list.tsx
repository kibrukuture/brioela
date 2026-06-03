import React from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useHeaderHeight } from '@/hooks/ui/use-header-height';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  FULL_DRAG_DISTANCE,
  TRIGGER_DRAG_DISTANCE,
  useSearchHeaderStore,
} from '@/stores/ui/use-search-header-store';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSearch } from '@/network/search/use-search';
import { useDebounce } from 'use-debounce';
import type { UserSearchResult } from '@brioela/shared/validators/user-search.validator';

export const SearchResultsList = () => {
  const insets = useSafeAreaInsets();

  const { grossHeight, netHeight } = useHeaderHeight();

  const { screenView, offsetY, searchQuery } = useSearchHeaderStore();

  // Debounce search query to match Searchbar
  const [debouncedQuery] = useDebounce(searchQuery, 400);

  // Call search API
  const {
    data: searchResults,
    isLoading,
    error,
  } = useSearch({
    query: debouncedQuery,
    limit: 20,
    offset: 0,
  });

  const renderResultItem = ({ item }: { item: UserSearchResult }) => {
    return (
      <View className="rounded-lg bg-white p-4">
        <Text className="text-base font-medium text-black">{item.name}</Text>
        <Text className="mt-1 text-sm text-gray-500">@{item.schnlTag}</Text>
      </View>
    );
  };

  // Why: Fade in commands as user pulls farther (favorites view) or keep fully visible in commands.
  // Opacity maps from 0→1 between 20% and 100% of FULL_DRAG_DISTANCE, clamped to avoid overshoot.
  // translateY negates offsetY so content anchors to header while pulling.
  const rContainerStyle = useAnimatedStyle(() => {
    if (!screenView || !offsetY)
      return { opacity: 0, transform: [{ translateY: 0 }], pointerEvents: 'none' };
    return {
      opacity:
        screenView.value === 'commands'
          ? 1
          : interpolate(
              offsetY.value,
              [FULL_DRAG_DISTANCE * 0.2, FULL_DRAG_DISTANCE],
              [0, 1],
              Extrapolation.CLAMP
            ),
      transform: [{ translateY: -offsetY.value }],
      // Why: Prevent accidental taps when still in favorites.
      pointerEvents: screenView.value === 'commands' ? 'auto' : 'none',
    };
  }, [screenView, offsetY]);

  // Why: Top blur/gradient appears only after threshold to preserve performance and avoid flashing.
  // Slow 1000ms timing feels like a soft veil over content.
  const rTopGradientStyle = useAnimatedStyle(() => {
    if (!screenView || !offsetY) return { opacity: 0 };
    return {
      opacity:
        screenView.value === 'commands' && offsetY.value > TRIGGER_DRAG_DISTANCE
          ? withTiming(1, { duration: 1000 })
          : 0,
    };
  }, [screenView, offsetY]);

  return (
    <Animated.View className="absolute h-full w-full" style={rContainerStyle}>
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        {isLoading && (
          <View
            className="flex-1 items-center justify-center"
            style={{ paddingTop: grossHeight + 20 }}>
            <Text className="text-sm text-gray-500">Searching...</Text>
          </View>
        )}

        {error && (
          <View
            className="flex-1 items-center justify-center"
            style={{ paddingTop: grossHeight + 20 }}>
            <Text className="text-sm text-gray-500">Error searching</Text>
          </View>
        )}

        {!isLoading && !error && searchResults && (
          <FlatList
            data={searchResults.results}
            renderItem={renderResultItem}
            keyExtractor={(item) => item.id}
            className="flex-1"
            contentContainerClassName="gap-4 px-5"
            contentContainerStyle={{
              paddingTop: grossHeight + 20,
              paddingBottom: insets.bottom + 8,
            }}
            indicatorStyle="white"
            ListEmptyComponent={
              debouncedQuery.length > 0 ? (
                <View
                  className="items-center justify-center"
                  style={{ paddingTop: grossHeight + 20 }}>
                  <Text className="text-sm text-gray-500">No results found</Text>
                </View>
              ) : null
            }
            // Why: Keeps native scrollbar clear of absolute header (uses net height only).
            scrollIndicatorInsets={{ top: netHeight + 16 }}
          />
        )}
      </KeyboardAvoidingView>
      <Animated.View
        style={[rTopGradientStyle, StyleSheet.absoluteFillObject, { height: grossHeight }]}>
        {/* <TopGradient /> */}
      </Animated.View>
    </Animated.View>
  );
};
