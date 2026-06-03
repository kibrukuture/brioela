import { useQuery } from '@tanstack/react-query';
import type { CardSpendingLimitsResponse } from '@brioela/shared/validators/card.validator';
import * as cardsApi from '@/network/cards/cards.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export function useCardSpendingLimits(cardId: string) {
  return useQuery<CardSpendingLimitsResponse>({
    queryKey: QUERY_KEYS.CARDS.SPENDING_LIMITS(cardId),
    queryFn: () => cardsApi.getCardSpendingLimits(cardId),
    enabled: !!cardId,
  });
}
