import { useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import type { PaymentFlow } from '@/components/payments/payment';
import { BackButton } from '@/components/ui/back-button';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { findRecipientSearchSchema } from '@/ui-schema';
import { useDebounce } from 'use-debounce';
import { useSearchUsers } from '@/network/users/use-search-users';
import { FindRecipientMethodsList } from '@/components/payments/find-recipient-methods-list';
import { FindOnSchnlScreen } from '@/components/payments/find-on-schnl-screen';
import { FindOnSchnlSearchModal } from '@/components/payments/find-on-schnl-search-modal';
import { usePaymentFlowStore } from '@/stores/payments/use-payment-flow-store';

interface FindRecipientStepProps {
  paymentFlow: PaymentFlow;
  setPaymentFlow: (flow: PaymentFlow) => void;
}

type FindRecipientFormValues = {
  query: string;
};

export function FindRecipientStep({ paymentFlow, setPaymentFlow }: FindRecipientStepProps) {
  const [showFindOnSchnlScreen, setShowFindOnSchnlScreen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const modalInputRef = useRef<TextInput>(null);
  const isMyself = paymentFlow.recipient?.type === 'myself';
  const setSelectedCurrency = usePaymentFlowStore((state) => state.setSelectedCurrency);

  const { control, setValue, reset, watch } = useForm<FindRecipientFormValues>({
    defaultValues: { query: '' },
    mode: 'onChange',
    resolver: zodResolver(findRecipientSearchSchema),
  });

  const searchQuery = watch('query');
  const [debouncedQuery] = useDebounce(searchQuery.trim(), 350);
  const searchRequest = useMemo(
    () => ({ query: debouncedQuery, limit: 5, offset: 0 }),
    [debouncedQuery]
  );
  const { data, isLoading, error } = useSearchUsers(searchRequest);

  const handleBack = () => {
    if (showSearchModal) {
      setShowSearchModal(false);
      reset({ query: '' });
      return;
    }

    if (showFindOnSchnlScreen) {
      setShowFindOnSchnlScreen(false);
      reset({ query: '' });
      return;
    }

    setPaymentFlow({ ...paymentFlow, step: 'recipient_type', recipient: null });
  };

  const handleSearch = (query: string) => {
    setValue('query', query, { shouldValidate: true });
  };

  const handleSelectUser = (user: {
    id: string;
    schnlTag: string;
    name: string;
    profilePicture?: string | null;
  }) => {
    setPaymentFlow({
      ...paymentFlow,
      recipient: {
        id: user.id,
        type: paymentFlow.recipient?.type ?? 'someone_else',
        name: user.name,
        schnltag: user.schnlTag,
        avatar: user.profilePicture ?? undefined,
      },
      accountDetails: null,
      step: 'review_schnl',
    });

    setShowSearchModal(false);
    setShowFindOnSchnlScreen(false);
    reset({ query: '' });
  };

  const handleSelectMethod = (method: 'find_schnl' | 'bank_details' | 'upload' | 'email') => {
    if (method === 'find_schnl') {
      if (isMyself) return;
      setShowFindOnSchnlScreen(true);
    } else if (method === 'bank_details') {
      setSelectedCurrency(paymentFlow.targetCurrency.code);
      setPaymentFlow({ ...paymentFlow, step: 'account_details' });
    } else if (method === 'email') {
      if (isMyself) return;
      setPaymentFlow({ ...paymentFlow, step: 'email_payment' });
    }
  };

  return (
    <View className="flex-1">
      <BackButton onPress={handleBack} />

      {!showFindOnSchnlScreen ? (
        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
          <View>
            <View className="mt-4">
              <Text className="mb-2 font-parafina text-4xl font-semibold text-neutral-900">
                Add recipient
              </Text>
              <Text className="text-sm text-neutral-500">
                Choose how you want to add the recipient.
              </Text>
            </View>

            <FindRecipientMethodsList
              isMyself={isMyself}
              onFindOnSchnl={() => handleSelectMethod('find_schnl')}
              onBankDetails={() => handleSelectMethod('bank_details')}
              onEmail={() => handleSelectMethod('email')}
            />
          </View>
        </ScrollView>
      ) : (
        <KeyboardAwareScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
          <FindOnSchnlScreen
            onOpenSearchModal={() => setShowSearchModal(true)}
            onAddAnotherWay={() => {
              setShowFindOnSchnlScreen(false);
              reset({ query: '' });
            }}
          />
        </KeyboardAwareScrollView>
      )}

      <FindOnSchnlSearchModal
        visible={showSearchModal}
        onClose={handleBack}
        control={control}
        modalInputRef={modalInputRef}
        searchQuery={searchQuery}
        onChangeQuery={handleSearch}
        debouncedQuery={debouncedQuery}
        isLoading={isLoading}
        error={error}
        data={data}
        onSelectUser={handleSelectUser}
      />
    </View>
  );
}
