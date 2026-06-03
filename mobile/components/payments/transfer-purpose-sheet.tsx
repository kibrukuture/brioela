import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Sheet, BottomSheetView, useManagedSheetRef } from '@/components/ui/sheet';
import { TRANSFER_PURPOSES, type TransferPurpose } from '@brioela/shared/constants';
import { FlashList } from '@shopify/flash-list';

const toSentenceCase = (input: string) => {
  const trimmed = input.trim();
  if (trimmed.length === 0) return trimmed;
  return `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
};

export function TransferPurposeSheet({
  isVisible,
  value,
  onConfirm,
  onClose,
}: {
  isVisible: boolean;
  value: TransferPurpose | null;
  onConfirm: (value: TransferPurpose) => void;
  onClose: () => void;
}) {
  const sheetRef = useManagedSheetRef(isVisible);
  const snapPoints = React.useMemo(() => ['75%'], []);

  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (isVisible) {
      sheetRef.current?.present();
      setSearch('');
    }
  }, [isVisible, sheetRef]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TRANSFER_PURPOSES;

    return TRANSFER_PURPOSES.filter((p) => {
      const label = p.replace(/_/g, ' ');
      return p.includes(q) || label.includes(q);
    });
  }, [search]);

  return (
    <Sheet ref={sheetRef} snapPoints={snapPoints} onDismiss={onClose} enablePanDownToClose>
      <BottomSheetView className="flex-1 px-5 pb-6">
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="flex-1 text-center font-parafina text-xl font-semibold text-neutral-900">
            Transfer purpose
          </Text>
        </View>

        <View className="mt-4">
          <View className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search purpose"
              placeholderTextColor="#A3A3A3"
              className="text-base text-neutral-900"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View className="mt-4 flex-1">
          <FlashList
            data={filtered}
            estimatedItemSize={52}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = item === value;
              const label = toSentenceCase(item.replace(/_/g, ' '));
              return (
                <Pressable
                  onPress={() => {
                    onConfirm(item);
                    onClose();
                  }}
                  className={`mb-1 px-2 py-3 ${
                    isSelected ? 'rounded-xl border border-neutral-300' : ''
                  }`}>
                  <View>
                    <Text className="text-base font-medium text-neutral-900">{label}</Text>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      </BottomSheetView>
    </Sheet>
  );
}
