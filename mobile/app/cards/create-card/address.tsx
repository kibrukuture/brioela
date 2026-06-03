import * as React from 'react';
import { ActivityIndicator, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from '@brioela/shared/zod';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { BackButton } from '@/components/ui/back-button';
import { useCreateCardFlowStore } from '@/stores/cards/use-create-card-flow-store';
import { useLocationSearch } from '@/hooks/maps/use-location-search';
import { useDebounce } from 'use-debounce';
import { useCustomerAddress } from '@/hooks/banking/use-customer-address';
import type { CustomerAddressResponse } from '@brioela/shared/validators/customer-address.validator';

type CreateCardAddressFormProps = {
  kycCountry: string;
  initialAddress: CustomerAddressResponse['address'];
  onContinue: (values: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
  }) => void;
};

function CreateCardAddressForm({
  kycCountry,
  initialAddress,
  onContinue,
}: CreateCardAddressFormProps) {
  const formSchema = z.object({
    addressLine1: z.string().trim().min(1, 'Address line 1 is required'),
    addressLine2: z.string().trim().optional(),
    city: z.string().trim().min(1, 'City is required'),
    state: z.string().trim().min(1, 'State is required'),
    postalCode: z.string().trim().min(1, 'Postal code is required'),
  });

  type FormValues = z.infer<typeof formSchema>;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<FormValues>({
    defaultValues: {
      addressLine1: initialAddress?.streetLine1 ?? '',
      addressLine2: '',
      city: initialAddress?.city ?? '',
      state: initialAddress?.state ?? '',
      postalCode: initialAddress?.postalCode ?? '',
    },
    mode: 'onChange',
    resolver: zodResolver(formSchema),
  });

  const addressLine1Value = watch('addressLine1');
  const [debouncedQuery] = useDebounce(addressLine1Value, 350);

  const { data: locationSearchData } = useLocationSearch({
    query: debouncedQuery,
    limit: 6,
    countryCodes: [kycCountry],
  });

  const [isSuggestionOpen, setIsSuggestionOpen] = React.useState(false);
  const suggestions = locationSearchData?.results ?? [];

  const handleContinue = handleSubmit(async (values) => {
    onContinue(values);
  });

  return (
    <KeyboardAwareScrollView className="flex-1" contentContainerClassName="px-5 pb-16">
      <View className="mt-3">
        <Text className="font-parafina text-3xl font-bold text-neutral-900">Delivery address</Text>
        <Text className="mt-1 text-sm text-neutral-500">
          Enter the address to ship your card. Your shipping country must match your KYC country.
        </Text>
      </View>

      <View className="mt-6">
        <Text className="mb-2 text-sm font-medium text-neutral-700">Country</Text>
        <TextInput
          value={kycCountry}
          editable={false}
          className="rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-4 text-base text-neutral-500"
          placeholderTextColor="#A3A3A3"
        />
      </View>

      <View className="mt-6">
        <Text className="mb-2 text-sm font-medium text-neutral-700">Address line 1</Text>
        <Controller
          control={control}
          name="addressLine1"
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <>
              <TextInput
                value={value}
                onChangeText={(text) => {
                  setIsSuggestionOpen(true);
                  onChange(text);
                }}
                placeholder="Street and number"
                className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                placeholderTextColor="#A3A3A3"
              />
              {isSuggestionOpen && suggestions.length > 0 ? (
                <View className="mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                  {suggestions.map((s) => {
                    return (
                      <TouchableOpacity
                        key={s.placeId}
                        activeOpacity={0.7}
                        onPress={() => {
                          setIsSuggestionOpen(false);
                          const streetLine1 = (() => {
                            const houseNumber = s.address?.house_number;
                            const road = s.address?.road;
                            if (
                              typeof houseNumber === 'string' &&
                              houseNumber.length > 0 &&
                              typeof road === 'string' &&
                              road.length > 0
                            ) {
                              return `${road} ${houseNumber}`;
                            }
                            if (typeof road === 'string' && road.length > 0) {
                              return road;
                            }
                            const name = s.address?.name;
                            if (typeof name === 'string' && name.length > 0) {
                              return name;
                            }
                            return s.displayName;
                          })();

                          setValue('addressLine1', streetLine1, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });

                          const city =
                            s.address?.city ?? s.address?.town ?? s.address?.village ?? undefined;
                          if (typeof city === 'string' && city.length > 0) {
                            setValue('city', city, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }

                          const state = s.address?.state;
                          if (typeof state === 'string' && state.length > 0) {
                            setValue('state', state, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }

                          const postcode = s.address?.postcode;
                          if (typeof postcode === 'string' && postcode.length > 0) {
                            setValue('postalCode', postcode, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }
                        }}
                        className="px-4 py-3">
                        <Text className="text-sm text-neutral-900">{s.displayName}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
              {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
            </>
          )}
        />
      </View>

      <View className="mt-4">
        <Text className="mb-2 text-sm font-medium text-neutral-700">Address line 2</Text>
        <Controller
          control={control}
          name="addressLine2"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Apartment, suite, etc. (optional)"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
              placeholderTextColor="#A3A3A3"
            />
          )}
        />
      </View>

      <View className="mt-4">
        <Text className="mb-2 text-sm font-medium text-neutral-700">City</Text>
        <Controller
          control={control}
          name="city"
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <>
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="City"
                className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                placeholderTextColor="#A3A3A3"
              />
              {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
            </>
          )}
        />
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1">
          <Text className="mb-2 text-sm font-medium text-neutral-700">State</Text>
          <Controller
            control={control}
            name="state"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="State"
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                  placeholderTextColor="#A3A3A3"
                />
                {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
              </>
            )}
          />
        </View>

        <View className="flex-1">
          <Text className="mb-2 text-sm font-medium text-neutral-700">Postal code</Text>
          <Controller
            control={control}
            name="postalCode"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Postal code"
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                  placeholderTextColor="#A3A3A3"
                />
                {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
              </>
            )}
          />
        </View>
      </View>

      <View className="mt-10">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isValid}
          className={`rounded-xl px-4 py-4 ${isValid ? 'bg-neutral-900' : 'bg-neutral-200'}`}>
          <Text
            className={`text-center text-base font-semibold ${isValid ? 'text-white' : 'text-neutral-500'}`}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}

export default function CreateCardAddressScreen() {
  const router = useRouter();
  const setShippingAddress = useCreateCardFlowStore((state) => state.setShippingAddress);
  const { data: customerAddressData, isLoading: isLoadingCustomerAddress } = useCustomerAddress();

  const kycCountry = customerAddressData?.address?.country ?? null;

  let content: React.JSX.Element;

  if (isLoadingCustomerAddress) {
    content = (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#171717" />
      </View>
    );
  } else if (typeof kycCountry === 'string' && kycCountry.length > 0) {
    const handleContinue = (values: {
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
    }) => {
      setShippingAddress({
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2 ? values.addressLine2 : null,
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        country: kycCountry,
      });
      router.push('/cards/create-card/confirm');
    };

    content = (
      <CreateCardAddressForm
        kycCountry={kycCountry}
        initialAddress={customerAddressData?.address ?? null}
        onContinue={handleContinue}
      />
    );
  } else {
    content = (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center font-parafina text-2xl font-semibold text-neutral-900">
          Complete KYC to order a physical card
        </Text>
        <Text className="mt-2 text-center text-sm text-neutral-600">
          We need your legal country on file before we can ship your card.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <BackButton />
      {content}
    </SafeAreaView>
  );
}
