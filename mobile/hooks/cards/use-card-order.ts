import { useQuery } from '@tanstack/react-query';
import type { GetCardOrderResponse } from '@schnl/shared/validators/card-order.validator';
import * as cardsApi from '@/services/api/cards/cards.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useCardOrder(orderId: string) {
  return useQuery<GetCardOrderResponse>({
    queryKey: QUERY_KEYS.CARDS.ORDER_BY_ID(orderId),
    queryFn: () => cardsApi.getCardOrder(orderId),
    enabled: !!orderId,
  });
}
