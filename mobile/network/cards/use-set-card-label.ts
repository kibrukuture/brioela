import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  SetCardLabelInput,
  SetCardLabelResponse,
} from '@brioela/shared/validators/card.validator';
import * as cardsApi from '@/network/cards/cards.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export function useSetCardLabel() {
  const queryClient = useQueryClient();
  return useMutation<SetCardLabelResponse, unknown, { cardId: string; input: SetCardLabelInput }>({
    mutationFn: ({ cardId, input }) => cardsApi.setCardLabel(cardId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CARDS.LIST });
    },
  });
}
