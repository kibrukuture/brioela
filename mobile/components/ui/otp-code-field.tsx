import React, { useMemo } from 'react';
import { View, Text, type TextInputProps } from 'react-native';
import { CodeField, Cursor, useBlurOnFulfill } from 'react-native-confirmation-code-field';

type OtpCodeFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  isDisabled?: boolean;
};

type CellProps = {
  index: number;
  symbol: string;
  isFocused: boolean;
};

export function OtpCodeField({
  value,
  onChangeText,
  length = 6,
  autoFocus = true,
  isDisabled = false,
}: OtpCodeFieldProps): React.ReactElement {
  const ref = useBlurOnFulfill({ value, cellCount: length });

  const textInputProps = useMemo<TextInputProps>(() => {
    return {
      keyboardType: 'number-pad',
      textContentType: 'oneTimeCode',
      autoComplete: 'sms-otp',
      importantForAutofill: 'yes',
      autoCorrect: false,
      autoCapitalize: 'none',
      editable: !isDisabled,
    };
  }, [isDisabled]);

  const handleChangeText = (next: string): void => {
    const digitsOnly = next.replace(/\D/g, '');
    onChangeText(digitsOnly);
  };

  const renderCell = ({ index, symbol, isFocused }: CellProps): React.ReactElement => {
    let borderClass = 'border-neutral-200';
    if (isFocused) {
      borderClass = 'border-neutral-900';
    }

    let content: React.ReactNode = null;
    if (symbol) {
      content = <Text className="text-xl font-semibold text-neutral-900">{symbol}</Text>;
    } else if (isFocused) {
      content = (
        <Text className="text-xl font-semibold text-neutral-900">
          <Cursor />
        </Text>
      );
    }

    return (
      <View
        key={index}
        className={`h-14 w-12 items-center justify-center rounded-xl border ${borderClass} bg-white`}>
        {content}
      </View>
    );
  };

  return (
    <CodeField
      ref={ref}
      value={value}
      onChangeText={handleChangeText}
      cellCount={length}
      rootStyle={{ gap: 10 }}
      renderCell={renderCell}
      autoFocus={autoFocus}
      caretHidden
      editable={!isDisabled}
      {...textInputProps}
    />
  );
}
