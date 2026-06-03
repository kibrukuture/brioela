import React, { FC } from 'react';
import { View } from 'react-native';
import { useHeaderHeight } from '@/features/search/hooks/use-header-height';
import { Searchbar } from '@/features/search/components/search-bar';
import { CancelButton } from '@/features/search/components/cancel-button';
import { useSearchHeaderStore } from '@/stores/ui/use-search-header-store';

export const SearchHeader: FC = () => {
  const { insetTop } = useHeaderHeight();
  useSearchHeaderStore();

  return (
    <View
      className="absolute top-0 z-[999] w-full flex-row items-center justify-end"
      style={{ paddingTop: insetTop, pointerEvents: 'box-none' }}>
      {/* <Animated.View
        className="absolute w-full flex-row items-center justify-center"
        style={[rSideButtonsContainerStyle, { height: netHeight, top: insetTop }]}>
        <HeaderLeftButton />
        <View className="flex-1" />
        <SettingsButton />
      </Animated.View> */}
      <Searchbar />
      <CancelButton />
    </View>
  );
};
