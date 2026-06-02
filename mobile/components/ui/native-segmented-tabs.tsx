import React, { useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { SegmentedButtons } from 'react-native-paper';

type SegmentedTabOption<T extends string> = {
  label: string;
  value: T;
};

interface NativeSegmentedTabsProps<T extends string> {
  options: readonly SegmentedTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function NativeSegmentedTabs<T extends string>({
  options,
  value,
  onChange,
}: NativeSegmentedTabsProps<T>): React.JSX.Element {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const labels = useMemo(() => options.map((o) => o.label), [options]);
  const selectedIndex = useMemo(
    () =>
      Math.max(
        0,
        options.findIndex((o) => o.value === value)
      ),
    [options, value]
  );

  const iosTintColor = isDark ? '#E5E5E5' : '#171717';
  const iosTextColor = isDark ? '#E5E5E5' : '#171717';
  const iosActiveTextColor = isDark ? '#171717' : '#FAFAFA';

  if (Platform.OS === 'ios') {
    return (
      <SegmentedControl
        values={labels}
        selectedIndex={selectedIndex}
        style={{ height: 36 }}
        appearance={isDark ? 'dark' : 'light'}
        onChange={(event) => {
          const nextIndex = event.nativeEvent.selectedSegmentIndex;
          const next = options[nextIndex];
          if (next) onChange(next.value);
        }}
        tintColor={iosTintColor}
        fontStyle={{ color: iosTextColor }}
        activeFontStyle={{ color: iosActiveTextColor }}
      />
    );
  }

  return (
    <SegmentedButtons
      value={value}
      onValueChange={(next) => onChange(next as T)}
      buttons={options.map((o) => ({ label: o.label, value: o.value }))}
      density="regular"
    />
  );
}
