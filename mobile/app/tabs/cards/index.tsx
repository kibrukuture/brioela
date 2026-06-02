import * as React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Burnt from 'burnt';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import type { CardData, ManageCardItemType } from '@/components/cards/types';
import { CardsHeader } from '@/components/cards/cards-header';
import { CardCarousel } from '@/components/cards/card-carousel';
import { CardInfoDisplay } from '@/components/cards/card-info-display';
import { ExpiryWarning } from '@/components/cards/expiry-warning';
import { QuickActions } from '@/components/cards/quick-actions';
import { AppleWalletButton } from '@/components/cards/apple-wallet-button';
import { GooglePayButton } from '@/components/cards/google-pay-button';
import { ManageCardList } from '@/components/cards/manage-card-list';
import { PinBottomSheet } from '@/components/cards/pin-bottom-sheet';
import { CardDetailsBottomSheet } from '@/components/cards/card-details-bottom-sheet';
import { getManageCardItemIds } from '@/components/cards/get-manage-card-item-ids';
import { DeleteCardBottomSheet } from '@/components/cards/delete-card-bottom-sheet';
import { useCards } from '@/hooks/cards/use-cards';
import { useFreezeCard } from '@/hooks/cards/use-freeze-card';
import { useUnfreezeCard } from '@/hooks/cards/use-unfreeze-card';
import { useCancelCard } from '@/hooks/cards/use-cancel-card';
import { useAppleWalletProvisioning } from '@/hooks/cards/use-apple-wallet-provisioning';
import { useGooglePayProvisioning } from '@/hooks/cards/use-google-pay-provisioning';
import { mapCardsToCardData } from '@/lib/cards/map-cards-to-card-data';

export default function CardsScreen() {
  const router = useRouter();
  const [activeCardIndex, setActiveCardIndex] = React.useState<number>(0);
  const [isPinSheetVisible, setIsPinSheetVisible] = React.useState<boolean>(false);
  const [isCardDetailsSheetVisible, setIsCardDetailsSheetVisible] = React.useState<boolean>(false);
  const [isDeleteCardSheetVisible, setIsDeleteCardSheetVisible] = React.useState<boolean>(false);

  const { data: cardsData } = useCards();
  const { mutateAsync: freezeCard, isPending: isFreezing } = useFreezeCard();
  const { mutateAsync: unfreezeCard, isPending: isUnfreezing } = useUnfreezeCard();
  const { mutateAsync: cancelCard, isPending: isCancelling } = useCancelCard();
  const { mutateAsync: getAppleWalletProvisioning, isPending: isAppleWalletPending } =
    useAppleWalletProvisioning();
  const { mutateAsync: getGooglePayProvisioning, isPending: isGooglePayPending } =
    useGooglePayProvisioning();

  const cards: readonly CardData[] = mapCardsToCardData({ cards: cardsData?.cards ?? [] });

  const hasCards = cards.length > 0;

  const safeActiveCardIndex = hasCards
    ? activeCardIndex >= cards.length
      ? 0
      : activeCardIndex
    : 0;
  const activeCard = hasCards ? cards[safeActiveCardIndex] : null;

  const isFrozen = activeCard?.status === 'frozen';
  const manageItems = activeCard ? getManageCardItemIds({ cardType: activeCard.type }) : [];

  const handleCardChange = (index: number): void => {
    setActiveCardIndex(index);
  };

  const handleShowPin = (): void => {
    setIsPinSheetVisible(true);
  };

  const handleCardDetails = (): void => {
    setIsCardDetailsSheetVisible(true);
  };

  const handleFreezeToggle = async (): Promise<void> => {
    if (!activeCard?.id) return;
    if (!hasCards) {
      Burnt.toast({ title: 'Cards are still loading', preset: 'error' });
      return;
    }
    if (isFreezing || isUnfreezing) return;

    try {
      if (activeCard.status === 'frozen') {
        await unfreezeCard({ cardId: activeCard.id });
        return;
      }

      await freezeCard({ cardId: activeCard.id });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update card status';
      Burnt.alert({ title: 'Oh no!', message, preset: 'error' });
    }
  };

  const handleManageItemPress = (itemId: ManageCardItemType): void => {
    if (!hasCards) {
      Burnt.toast({ title: 'Cards are still loading', preset: 'error' });
      return;
    }
    if (!activeCard?.id) return;
    if (itemId === 'card_controls') {
      router.push({ pathname: '/cards/card-controls', params: { cardId: activeCard.id } });
    }
    if (itemId === 'card_label') {
      router.push({ pathname: '/cards/card-label', params: { cardId: activeCard.id } });
    }
    if (itemId === 'spending_limits') {
      router.push({ pathname: '/cards/spending-limits', params: { cardId: activeCard.id } });
    }
    if (itemId === 'delete_card') {
      setIsDeleteCardSheetVisible(true);
    }
  };

  const handleConfirmDeleteCard = async (): Promise<void> => {
    if (!activeCard?.id) return;
    try {
      await cancelCard({ cardId: activeCard.id });
      setIsDeleteCardSheetVisible(false);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to delete card';
      Burnt.alert({ title: 'Oh no!', message, preset: 'error' });
    }
  };

  const handleTravelHubPress = (): void => {};

  const handleOrderCardPress = (): void => {
    router.push({ pathname: '/cards/create-card' });
  };

  const handleReplaceCard = (): void => {};

  const handleAddToWallet = async (): Promise<void> => {
    if (!activeCard?.id) return;
    try {
      if (Platform.OS === 'ios') {
        const result = await getAppleWalletProvisioning({ cardId: activeCard.id });
        Burnt.alert({ title: 'Apple Wallet', message: result.message, preset: 'done' });
        return;
      }

      const result = await getGooglePayProvisioning({ cardId: activeCard.id });
      Burnt.alert({ title: 'Google Pay', message: result.message, preset: 'done' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to start wallet provisioning';
      Burnt.alert({ title: 'Oh no!', message, preset: 'error' });
    }
  };

  const handleCopy = async (value: string, _label: string) => {
    await Clipboard.setStringAsync(value);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  let content: React.ReactElement | null = null;

  if (cardsData && !hasCards) {
    content = (
      <View className="flex-1 items-center justify-center px-6 pb-12">
        <Text className="max-w-[280px] text-center text-base text-neutral-600">
          You don't have any cards yet. Create one to get started.
        </Text>

        <TouchableOpacity
          className="mt-6 self-center rounded-xl bg-neutral-900 px-5 py-3"
          onPress={() => router.push({ pathname: '/cards/create-card' })}
          activeOpacity={0.85}>
          <Text className="text-sm font-semibold text-white">Create new card</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    content = (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <CardsHeader
          onTravelHubPress={handleTravelHubPress}
          onOrderCardPress={handleOrderCardPress}
        />

        {activeCard && (
          <View className="mt-2 px-6">
            <View className="flex-row justify-end">
              <Text className="text-xs font-semibold text-[#9CA3AF]">
                {activeCard.type === 'virtual' ? 'VIRTUAL' : 'PHYSICAL'}
              </Text>
            </View>
          </View>
        )}

        {/* Card carousel */}
        <View className="mt-4">
          <CardCarousel
            cards={cards}
            activeIndex={safeActiveCardIndex}
            onCardChange={handleCardChange}
          />
        </View>

        {/* Card info */}
        {activeCard && <CardInfoDisplay card={activeCard} />}

        {/* Expiry warning */}
        {activeCard?.isExpiringSoon && activeCard.expiryWarningMessage && (
          <ExpiryWarning message={activeCard.expiryWarningMessage} onReplace={handleReplaceCard} />
        )}

        {/* Quick actions */}
        <QuickActions
          isFrozen={Boolean(isFrozen)}
          isFreezePending={isFreezing || isUnfreezing}
          onShowPin={handleShowPin}
          onCardDetails={handleCardDetails}
          onFreezeToggle={handleFreezeToggle}
        />

        {/* Add to Wallet - only for non-frozen cards */}
        {!isFrozen && Platform.OS === 'ios' && (
          <AppleWalletButton onPress={handleAddToWallet} isPending={isAppleWalletPending} />
        )}
        {!isFrozen && Platform.OS !== 'ios' && (
          <GooglePayButton onPress={handleAddToWallet} isPending={isGooglePayPending} />
        )}

        {/* Manage card list */}
        <ManageCardList items={manageItems} onItemPress={handleManageItemPress} />

        {/* Bottom padding */}
        <View className="h-24" />
      </ScrollView>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1">
          {content}
          {hasCards && (
            <>
              <PinBottomSheet
                isVisible={isPinSheetVisible}
                pin={cards[safeActiveCardIndex].pin}
                onClose={() => setIsPinSheetVisible(false)}
              />

              <CardDetailsBottomSheet
                isVisible={isCardDetailsSheetVisible}
                card={cards[safeActiveCardIndex]}
                onClose={() => setIsCardDetailsSheetVisible(false)}
                onCopy={handleCopy}
              />

              <DeleteCardBottomSheet
                isVisible={isDeleteCardSheetVisible}
                cardType={cards[safeActiveCardIndex].type}
                isPending={isCancelling}
                onClose={() => setIsDeleteCardSheetVisible(false)}
                onConfirm={handleConfirmDeleteCard}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
