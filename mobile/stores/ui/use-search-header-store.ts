import { create } from 'zustand';
import { RefObject } from 'react';
import { Dimensions, TextInput } from 'react-native';
import { SharedValue, withTiming } from 'react-native-reanimated';

// Why: Core sizing constants used across header/search transitions.
// Keeping them centralized ensures indicator math, paddings, and width interpolations
// stay in sync when designs change.
export const SEARCHBAR_HEIGHT = 40;
export const EDIT_HOME_CONTAINER_WIDTH = 65;
export const SETTINGS_CONTAINER_WIDTH = 65;
export const CANCEL_CONTAINER_WIDTH = 75;
const LEFT_PADDING = 16;

// Why: Search field width differs between views.
// Favorites keeps both side buttons visible → less width.
// Commands replaces right button with "Cancel" and shifts origin → more width.
export const SEARCHBAR_FAVORITES_WIDTH =
  Dimensions.get('window').width - EDIT_HOME_CONTAINER_WIDTH - SETTINGS_CONTAINER_WIDTH;
export const SEARCHBAR_COMMANDS_WIDTH =
  Dimensions.get('window').width - CANCEL_CONTAINER_WIDTH - LEFT_PADDING;

// Why: Negative drag distances drive the "pull to search" reveal.
// TRIGGER_DRAG_DISTANCE: threshold to switch views (favorites → commands).
// FULL_DRAG_DISTANCE: max distance used to normalize interpolations (e.g., blur opacity).
export const TRIGGER_DRAG_DISTANCE = -100;
export const FULL_DRAG_DISTANCE = -200;

type ScreenView = 'favorites' | 'commands';

interface SearchHeaderStore {
  // SharedValues - initialized in wrapper component
  inputRef: RefObject<TextInput | null> | null;
  screenView: SharedValue<ScreenView> | null;
  isListDragging: SharedValue<boolean> | null;
  offsetY: SharedValue<number> | null;
  blurIntensity: SharedValue<number> | null;

  // Search query state
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Setters for initialization
  setInputRef: (ref: RefObject<TextInput | null>) => void;
  setScreenView: (value: SharedValue<ScreenView>) => void;
  setIsListDragging: (value: SharedValue<boolean>) => void;
  setOffsetY: (value: SharedValue<number>) => void;
  setBlurIntensity: (value: SharedValue<number>) => void;

  // Actions
  onGoToCommands: () => void;
  onGoToFavorites: () => void;
}

export const useSearchHeaderStore = create<SearchHeaderStore>((set, get) => ({
  // Initial state
  inputRef: null,
  screenView: null,
  isListDragging: null,
  offsetY: null,
  blurIntensity: null,
  searchQuery: '',

  // Setters
  setInputRef: (ref) => set({ inputRef: ref }),
  setScreenView: (value) => set({ screenView: value }),
  setIsListDragging: (value) => set({ isListDragging: value }),
  setOffsetY: (value) => set({ offsetY: value }),
  setBlurIntensity: (value) => set({ blurIntensity: value }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Actions
  onGoToCommands: () => {
    const { screenView, blurIntensity, inputRef } = get();
    if (screenView && blurIntensity) {
      screenView.value = 'commands';
      blurIntensity.value = withTiming(100);
      inputRef?.current?.focus();
    }
  },

  onGoToFavorites: () => {
    const { screenView, blurIntensity, inputRef } = get();
    if (screenView && blurIntensity) {
      screenView.value = 'favorites';
      blurIntensity.value = withTiming(0);
      inputRef?.current?.blur();
    }
  },
}));
