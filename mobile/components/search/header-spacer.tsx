import React from 'react';
import { View } from 'react-native';
import { useHeaderHeight } from '@/hooks/ui/use-header-height';

export const HeaderSpacer = () => {
  const { insetTop, netHeight } = useHeaderHeight();

  return (
    // Why: Placeholder keeps layout stable while the animated SearchHeader overlays on top.
    // Matches exact size using insetTop/netHeight to avoid visual jumps on mount.
    <View className="absolute left-0 right-0 top-0" style={{ paddingTop: insetTop }}>
      <View className="flex-row items-center justify-center" style={{ height: netHeight }}>
        {/* <HeaderLeftButton /> */}
        <View className="flex-1" />
        {/* <SettingsButton /> */}
      </View>
    </View>
  );
};
