import { useQuery } from '@tanstack/react-query';
import type { ListCardsResponse } from '@brioela/shared/validators/card.validator';
import * as cardsApi from '@/network/cards/cards.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export function useCards() {
  return useQuery<ListCardsResponse>({
    queryKey: QUERY_KEYS.CARDS.LIST,
    queryFn: () => cardsApi.getCards(),
  });
}
