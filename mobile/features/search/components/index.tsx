import React, { FC, useRef, PropsWithChildren } from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { TextInput, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { HeaderSpacer } from '@/features/search/components/header-spacer';
import { ContentScrollView } from '@/features/search/components/content-scroll-view';
import { SearchBlurOverlay } from '@/features/search/components/search-blur-overlay';
import { SearchResultsList } from '@/features/search/components/search-results-list';
import { PullIndicator } from '@/features/search/components/pull-indicator';
import { useAndroidNote } from '@/features/search/hooks/use-android-note';
import { SearchHeader } from '@/features/search/components/search-header';
import { useSearchHeaderStore } from '@/stores/ui/use-search-header-store';

export const SearchWrapper: FC<PropsWithChildren> = ({ children }) => {
  useAndroidNote(
    "Android doesn't support scroll in negative direction, so the animation is limited. Blur is still experimental on Android; to avoid performance issues, use a solid background color instead of blur."
  );

  const inputRef = useRef<TextInput>(null);
  const screenView = useSharedValue<'favorites' | 'commands'>('favorites');
  const offsetY = useSharedValue(0);
  const isListDragging = useSharedValue(false);
  const blurIntensity = useSharedValue(0);

  const { setInputRef, setScreenView, setIsListDragging, setOffsetY, setBlurIntensity } =
    useSearchHeaderStore();

  useIsomorphicLayoutEffect(() => {
    setInputRef(inputRef);
    setScreenView(screenView);
    setIsListDragging(isListDragging);
    setOffsetY(offsetY);
    setBlurIntensity(blurIntensity);
  }, []);
  return (
    <View className="flex-1">
      <ContentScrollView>{children}</ContentScrollView>
      <HeaderSpacer />
      <SearchBlurOverlay />
      <SearchResultsList />
      <PullIndicator />
      <SearchHeader />
    </View>
  );
};
