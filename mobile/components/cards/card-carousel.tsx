import * as React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { CardCarouselProps } from './types';
import { CardItem } from './card-item';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 280;
const CARD_MARGIN = 8;

export const CardCarousel: React.FC<CardCarouselProps> = ({ cards, activeIndex, onCardChange }) => {
  const scrollViewRef = React.useRef<ScrollView>(null);

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }): void => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / (CARD_WIDTH + CARD_MARGIN * 2));
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < cards.length) {
      // Haptic feedback when card comes into view
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onCardChange(newIndex);
    }
  };

  const contentPadding = (SCREEN_WIDTH - CARD_WIDTH) / 2 - CARD_MARGIN;

  return (
    <View className="h-[200px]">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: contentPadding,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {cards.map((card, index) => (
          <CardItem key={card.id} card={card} isActive={index === activeIndex} />
        ))}
      </ScrollView>
    </View>
  );
};
