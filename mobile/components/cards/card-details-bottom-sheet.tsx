import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Sheet, useManagedSheetRef, BottomSheetScrollView } from '@/components/ui/sheet';
import { X } from 'lucide-react-native';
import type { CardDetailsBottomSheetProps, CardDetailsField } from '@/components/cards/types';
import { CardDetailsRow } from '@/components/cards/card-details-row';
import { SensitiveSheetGate } from '@/features/auth/components/sensitive-sheet-gate';

export const CardDetailsBottomSheet: React.FC<CardDetailsBottomSheetProps> = ({
  isVisible,
  card,
  onClose,
  onCopy,
}) => {
  const sheetRef = useManagedSheetRef(Boolean(isVisible && card));
  const snapPoints = React.useMemo(() => ['70%'], []);

  if (!card) return null;

  const fields: readonly CardDetailsField[] = [
    { id: 'cardholder', label: 'Cardholder name', value: card.cardholderName, copyable: true },
    { id: 'cardNumber', label: 'Card number', value: card.cardNumber, copyable: true },
    { id: 'expiry', label: 'Expiry date', value: card.expiryDate, copyable: true },
    { id: 'cvv', label: 'Security code', value: card.securityCode, copyable: true },
    { id: 'billing', label: 'Billing address', value: card.billingAddress, copyable: false },
  ];

  return (
    <>
      <SensitiveSheetGate
        isVisible={Boolean(isVisible && card)}
        promptMessage="Authenticate to view card details"
        progressTitle="Getting your card details..."
        onAuthed={() => sheetRef.current?.present()}
        onDenied={() => onClose?.()}>
        <Sheet ref={sheetRef} snapPoints={snapPoints} onDismiss={onClose} enablePanDownToClose>
          <BottomSheetScrollView className="flex-1 px-6">
            {/* Close button */}
            <View className="flex-row justify-end">
              <Pressable
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]">
                <X size={20} color="#1D1D1D" />
              </Pressable>
            </View>

            {/* Title */}
            <Text className="mt-2 text-center font-parafina text-2xl font-bold text-[#1D1D1D]">
              Card details
            </Text>

            {/* Fields */}
            <View className="mt-6">
              {fields.map((field) => (
                <CardDetailsRow
                  key={field.id}
                  field={field}
                  onCopy={() => onCopy(field.value, field.label)}
                />
              ))}
            </View>
          </BottomSheetScrollView>
        </Sheet>
      </SensitiveSheetGate>
    </>
  );
};
