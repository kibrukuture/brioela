import * as React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { CardData, ManageCardItemType } from '@/components/cards/types';
import { CardsHeader } from '@/components/cards/cards-header';
import { CardCarousel } from '@/components/cards/card-carousel';
import { CardInfoDisplay } from '@/components/cards/card-info-display';
import { ExpiryWarning } from '@/components/cards/expiry-warning';
import { QuickActions } from '@/components/cards/quick-actions';
import { AppleWalletButton } from '@/components/cards/apple-wallet-button';
import { ManageCardList } from '@/components/cards/manage-card-list';
import { PinBottomSheet } from '@/components/cards/pin-bottom-sheet';
import { CardDetailsBottomSheet } from '@/components/cards/card-details-bottom-sheet';
import { getMockCards } from '@/components/cards/mock';
import { getManageCardItemIds } from '@/components/cards/get-manage-card-item-ids';

interface CardsScreenProps {
  readonly onNavigateToCardControls: () => void;
}

export const CardsScreen: React.FC<CardsScreenProps> = ({ onNavigateToCardControls }) => {
  const [activeCardIndex, setActiveCardIndex] = React.useState<number>(0);
  const [isPinSheetVisible, setIsPinSheetVisible] = React.useState<boolean>(false);
  const [isCardDetailsSheetVisible, setIsCardDetailsSheetVisible] = React.useState<boolean>(false);
  const [cards, setCards] = React.useState<readonly CardData[]>(getMockCards());

  const activeCard = cards[activeCardIndex];
  const isFrozen = activeCard.status === 'frozen';
  const manageItems = getManageCardItemIds({ cardType: activeCard.type });

  const handleCardChange = (index: number): void => {
    setActiveCardIndex(index);
  };

  const handleShowPin = (): void => {
    setIsPinSheetVisible(true);
  };

  const handleCardDetails = (): void => {
    setIsCardDetailsSheetVisible(true);
  };

  const handleFreezeToggle = (): void => {
    setCards((prevCards) =>
      prevCards.map((card, index) =>
        index === activeCardIndex
          ? {
              ...card,
              status: card.status === 'frozen' ? 'active' : 'frozen',
              design: card.status === 'frozen' ? 'hello_world' : 'schnl_frozen',
            }
          : card
      )
    );
  };

  const handleManageItemPress = (itemId: ManageCardItemType): void => {
    if (itemId === 'card_controls') {
      onNavigateToCardControls();
    }
    // Handle other menu items
  };

  const handleCopy = (value: string, label: string): void => {
    // Implement clipboard copy
    console.log(`Copied ${label}: ${value}`);
  };

  const handleTravelHubPress = (): void => {
    // Navigate to travel hub
  };

  const handleOrderCardPress = (): void => {
    // Navigate to order card
  };

  const handleReplaceCard = (): void => {
    // Navigate to replace card flow
  };

  const handleAddToAppleWallet = (): void => {
    // Add to Apple Wallet
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <CardsHeader
            onTravelHubPress={handleTravelHubPress}
            onOrderCardPress={handleOrderCardPress}
          />

          {/* Title */}
          <Text className="px-6 font-parafina text-3xl font-bold text-[#1D1D1D]">Cards</Text>

          {/* Card carousel */}
          <View className="mt-4">
            <CardCarousel
              cards={cards}
              activeIndex={activeCardIndex}
              onCardChange={handleCardChange}
            />
          </View>

          {/* Card info */}
          <CardInfoDisplay card={activeCard} />

          {/* Expiry warning */}
          {activeCard.isExpiringSoon && activeCard.expiryWarningMessage && (
            <ExpiryWarning
              message={activeCard.expiryWarningMessage}
              onReplace={handleReplaceCard}
            />
          )}

          {/* Quick actions */}
          <QuickActions
            isFrozen={isFrozen}
            onShowPin={handleShowPin}
            onCardDetails={handleCardDetails}
            onFreezeToggle={handleFreezeToggle}
          />

          {/* Add to Apple Wallet - only for non-frozen cards */}
          {!isFrozen && <AppleWalletButton onPress={handleAddToAppleWallet} />}

          {/* Manage card list */}
          <ManageCardList items={manageItems} onItemPress={handleManageItemPress} />

          {/* Bottom padding */}
          <View className="h-24" />
        </ScrollView>

        {/* PIN Bottom Sheet */}
        <PinBottomSheet
          isVisible={isPinSheetVisible}
          pin={activeCard.pin}
          onClose={() => setIsPinSheetVisible(false)}
        />

        {/* Card Details Bottom Sheet */}
        <CardDetailsBottomSheet
          isVisible={isCardDetailsSheetVisible}
          card={activeCard}
          onClose={() => setIsCardDetailsSheetVisible(false)}
          onCopy={handleCopy}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};
