import type { CardType, ManageCardItemType } from './types';

export function getManageCardItemIds(input: { cardType: CardType }): readonly ManageCardItemType[] {
  if (input.cardType === 'virtual') {
    return ['card_controls', 'card_label', 'spending_limits', 'delete_card'] as const;
  }

  return ['card_controls', 'card_label', 'spending_limits', 'delete_card'] as const;
}
