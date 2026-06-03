import { useQuery } from '@tanstack/react-query';
import type { GetCardOrderResponse } from '@brioela/shared/validators/card-order.validator';
import * as cardsApi from '@/network/cards/cards.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export function useCardOrder(orderId: string) {
  return useQuery<GetCardOrderResponse>({
    queryKey: QUERY_KEYS.CARDS.ORDER_BY_ID(orderId),
    queryFn: () => cardsApi.getCardOrder(orderId),
    enabled: !!orderId,
  });
}
