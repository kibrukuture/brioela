import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CardSpendingLimitsInput,
  CardSpendingLimitsResponse,
} from '@schnl/shared/validators/card.validator';
import * as cardsApi from '@/services/api/cards/cards.api';
import { QUERY_KEYS } from '@/lib/query-keys';

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
