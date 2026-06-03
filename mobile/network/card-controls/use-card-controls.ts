import { useQuery } from '@tanstack/react-query';
import type { CardControlsState } from '@brioela/shared/validators/card-controls.validator';
import * as cardControlsApi from '@/network/card-controls/card-controls.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export function useCardControls(cardId: string) {
  return useQuery<CardControlsState>({
    queryKey: QUERY_KEYS.CARD_CONTROLS.BY_CARD_ID(cardId),
    queryFn: () => cardControlsApi.getCardControls(cardId),
    enabled: !!cardId,
  });
}
