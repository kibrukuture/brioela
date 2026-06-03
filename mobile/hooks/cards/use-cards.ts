import { useQuery } from '@tanstack/react-query';
import type { ListCardsResponse } from '@brioela/shared/validators/card.validator';
import * as cardsApi from '@/services/api/cards/cards.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useCards() {
  return useQuery<ListCardsResponse>({
    queryKey: QUERY_KEYS.CARDS.LIST,
    queryFn: () => cardsApi.getCards(),
  });
}
