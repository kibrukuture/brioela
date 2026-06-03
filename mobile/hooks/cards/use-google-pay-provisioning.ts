import { useMutation } from '@tanstack/react-query';
import type { CardWalletProvisioningResponse } from '@brioela/shared/validators/card-wallet-provisioning.validator';
import * as cardsApi from '@/services/api/cards/cards.api';

export function useGooglePayProvisioning() {
  return useMutation<CardWalletProvisioningResponse, unknown, { cardId: string }>({
    mutationFn: ({ cardId }) => cardsApi.getGooglePayProvisioning(cardId),
  });
}
