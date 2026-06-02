import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Question } from 'phosphor-react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { z } from '@schnl/shared/zod';
import { usePaymentFlowStore } from '@/stores/payments/use-payment-flow-store';
import { Sheet, useSheetRef } from '@/components/ui/sheet';
import { useMemo, useState } from 'react';
import { Camera } from 'lucide-react-native';
import { IbanScanModal } from '@/components/payments/iban-scan-modal';
import { PLACEHOLDERS } from '@schnl/shared/constants';

const ibanSingleAccountDetailsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  iban: z.string().min(15, 'IBAN is required'),
  swift: z.string().optional(),
});

type IbanSingleAccountDetailsFormValues = z.infer<typeof ibanSingleAccountDetailsSchema>;

export function AccountDetailsIbanSingle() {
  const setAccountDetails = usePaymentFlowStore((state) => state.setAccountDetails);
  const existingDetails = usePaymentFlowStore((state) =>
    state.accountDetails?.type === 'iban_single' ? state.accountDetails : null
  );
  type HelpTopic = 'iban' | 'swift';
  const [helpTopic, setHelpTopic] = useState<HelpTopic>('iban');
  const [showIbanScanner, setShowIbanScanner] = useState(false);
  const helpSheetRef = useSheetRef();
  const helpSnapPoints = useMemo(() => ['38%'], []);

  const { control, getValues, setValue } = useForm<IbanSingleAccountDetailsFormValues>({
    defaultValues: {
      fullName: existingDetails?.fullName ?? '',
      bankName: existingDetails?.bankName ?? '',
      iban: existingDetails?.iban ?? '',
      swift: existingDetails?.swift ?? '',
    },
    mode: 'onChange',
    resolver: zodResolver(ibanSingleAccountDetailsSchema),
  });

  const openHelp = (topic: HelpTopic) => {
    setHelpTopic(topic);
    helpSheetRef.current?.present();
  };

  const maybePersist = () => {
    const parsed = ibanSingleAccountDetailsSchema.safeParse(getValues());
    if (!parsed.success) return;
    setAccountDetails({ type: 'iban_single', ...parsed.data });
  };

  return (
    <View>
      <View className="mt-4">
        <Text className="mb-2 font-parafina text-4xl font-semibold text-neutral-900">
          IBAN Account Details
        </Text>
        <Text className="text-sm text-neutral-500">Enter UAE bank account information.</Text>
      </View>

      <View className="mt-6 gap-4">
        <View>
          <Text className="mb-2 text-sm font-medium text-neutral-700">Full Name</Text>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <>
                <TextInput
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    maybePersist();
                  }}
                  placeholder={PLACEHOLDERS.FULL_NAME}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                  placeholderTextColor="#A3A3A3"
                />
                {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
              </>
            )}
          />
        </View>

        <View>
          <Text className="mb-2 text-sm font-medium text-neutral-700">Bank Name</Text>
          <Controller
            control={control}
            name="bankName"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <>
                <TextInput
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    maybePersist();
                  }}
                  placeholder="Emirates NBD"
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                  placeholderTextColor="#A3A3A3"
                />
                {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
              </>
            )}
          />
        </View>

        <View>
          <View className="mb-2 flex-row items-center gap-2">
            <Text className="text-sm font-medium text-neutral-700">IBAN</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => openHelp('iban')}>
              <Question size={14} weight="bold" color="#A3A3A3" />
            </TouchableOpacity>
          </View>
          <Controller
            control={control}
            name="iban"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <>
                <View className="relative">
                  <TextInput
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      maybePersist();
                    }}
                    placeholder="AE070331234567890123456"
                    autoCapitalize="characters"
                    className="rounded-xl border border-neutral-200 bg-white py-4 pl-4 pr-12 text-base text-neutral-900"
                    placeholderTextColor="#A3A3A3"
                  />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowIbanScanner(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-neutral-100 p-2">
                    <Camera size={18} color="#171717" />
                  </TouchableOpacity>
                </View>
                {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
              </>
            )}
          />
        </View>

        <View>
          <View className="mb-2 flex-row items-center gap-2">
            <Text className="text-sm font-medium text-neutral-700">SWIFT/BIC Code</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => openHelp('swift')}>
              <Question size={14} weight="bold" color="#A3A3A3" />
            </TouchableOpacity>
          </View>
          <Controller
            control={control}
            name="swift"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <>
                <TextInput
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    maybePersist();
                  }}
                  placeholder="EBILAEAD"
                  autoCapitalize="characters"
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                  placeholderTextColor="#A3A3A3"
                />
                {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
              </>
            )}
          />
        </View>
      </View>

      <Sheet ref={helpSheetRef} snapPoints={helpSnapPoints} enablePanDownToClose>
        <View className="px-5 pb-6">
          <Text className="mt-2 text-center font-parafina text-3xl font-semibold text-neutral-900">
            {helpTopic === 'iban' ? 'IBAN' : 'SWIFT / BIC'}
          </Text>

          {helpTopic === 'iban' ? (
            <Text className="mt-3 text-sm leading-relaxed text-neutral-700">
              IBAN is an international bank account format used in many countries. Copy it exactly
              as written (letters + numbers).
            </Text>
          ) : (
            <Text className="mt-3 text-sm leading-relaxed text-neutral-700">
              SWIFT/BIC identifies the recipient's bank. It's usually 8 or 11 characters (letters +
              numbers).
            </Text>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => helpSheetRef.current?.dismiss()}
            className="mt-5 items-center rounded-xl bg-neutral-900 px-5 py-3">
            <Text className="text-base font-semibold text-white">Got it</Text>
          </TouchableOpacity>
        </View>
      </Sheet>

      <IbanScanModal
        visible={showIbanScanner}
        onClose={() => setShowIbanScanner(false)}
        onIbanDetected={(iban) => {
          setValue('iban', iban, { shouldValidate: true, shouldDirty: true });
          maybePersist();
        }}
      />
    </View>
  );
}
