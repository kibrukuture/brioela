import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateCardOrderRequest,
  CreateCardOrderResponse,
} from '@schnl/shared/validators/card-order.validator';
import * as cardsApi from '@/services/api/cards/cards.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useCreateCardOrder() {
  const queryClient = useQueryClient();
  return useMutation<CreateCardOrderResponse, unknown, CreateCardOrderRequest>({
    mutationFn: (input) => cardsApi.createCardOrder(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CARDS.LIST });
    },
  });
}
