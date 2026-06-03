import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CardSpendingLimitsInput,
  CardSpendingLimitsResponse,
} from '@brioela/shared/validators/card.validator';
import * as cardsApi from '@/network/cards/cards.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export function useUpdateCardSpendingLimits() {
  const queryClient = useQueryClient();
  return useMutation<
    CardSpendingLimitsResponse,
    unknown,
    { cardId: string; input: CardSpendingLimitsInput }
  >({
    mutationFn: ({ cardId, input }) => cardsApi.updateCardSpendingLimits(cardId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CARDS.LIST });
    },
  });
}
