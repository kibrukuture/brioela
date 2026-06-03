import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FreezeCardResponse } from '@brioela/shared/validators/card.validator';
import * as cardsApi from '@/services/api/cards/cards.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useCancelCard() {
  const queryClient = useQueryClient();
  return useMutation<FreezeCardResponse, unknown, { cardId: string }>({
    mutationFn: ({ cardId }) => cardsApi.cancelCard(cardId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CARDS.LIST });
    },
  });
}
