import { Search } from 'lucide-react-native';
import React, { FC } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import {
  SEARCHBAR_COMMANDS_WIDTH,
  SEARCHBAR_FAVORITES_WIDTH,
  SEARCHBAR_HEIGHT,
  TRIGGER_DRAG_DISTANCE,
  useSearchHeaderStore,
} from '@/stores/ui/use-search-header-store';

export const Searchbar: FC = () => {
  const {
    screenView,
    offsetY,
    isListDragging,
    inputRef,
    onGoToCommands,
    searchQuery,
    setSearchQuery,
  } = useSearchHeaderStore();

  // Why: Search width animates between two target widths based on view.
  // Spring config (mass 0.2, damping 15) gives quick but non-bouncy settle matching Raycast feel.
  // During active pull beyond trigger, we add a small scale bump for tactile feedback.
  const rContainerStyle = useAnimatedStyle(() => {
    if (!screenView || !offsetY || !isListDragging) return {};
    if (isListDragging.value && offsetY.value < 0 && offsetY.value < TRIGGER_DRAG_DISTANCE) {
      return {
        transformOrigin: 'center',
        transform: [{ scale: withTiming(1.05) }],
      };
    }

    return {
      width: withSpring(
        screenView.value === 'favorites' ? SEARCHBAR_FAVORITES_WIDTH : SEARCHBAR_COMMANDS_WIDTH,
        {
          damping: 100,
          stiffness: 1400,
        }
      ),
      transform: [{ scale: withTiming(1) }],
      // Why: While dragging the list we center the origin to avoid noticeable skew.
      // Otherwise we anchor to the right so width change feels like the Cancel button appears.
      transformOrigin: isListDragging.value ? 'center' : 'right',
    };
  }, [screenView, offsetY, isListDragging]);

  return (
    <Animated.View className="z-[999] justify-center" style={rContainerStyle}>
      <TextInput
        ref={inputRef}
        placeholder="Search Schnl"
        placeholderTextColor="#78716c"
        className="rounded-2xl bg-neutral-800 pl-10 pr-3 text-base/5 text-stone-200"
        style={styles.input}
        selectionColor="#e5e5e5"
        value={searchQuery}
        onChangeText={setSearchQuery}
        // Why: Tapping search transitions to commands, focuses input via provider.
        onPress={onGoToCommands}
      />
      <View className="absolute left-3">
        <Search size={16} color="#78716c" />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  input: {
    height: SEARCHBAR_HEIGHT,
    borderCurve: 'continuous',
  },
});
