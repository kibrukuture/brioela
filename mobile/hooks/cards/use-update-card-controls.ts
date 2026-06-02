import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UpdateCardControlsInput,
  CardControlsState,
} from '@schnl/shared/validators/card-controls.validator';
import * as cardControlsApi from '@/services/api/card-controls/card-controls.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useUpdateCardControls() {
  const queryClient = useQueryClient();
  return useMutation<CardControlsState, unknown, UpdateCardControlsInput>({
    mutationFn: (input) => cardControlsApi.updateCardControls(input),
    onSuccess: async (data, variables) => {
      await queryClient.setQueryData(QUERY_KEYS.CARD_CONTROLS.BY_CARD_ID(variables.cardId), data);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CARD_CONTROLS.BY_CARD_ID(variables.cardId),
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CARDS.LIST });
    },
  });
}
