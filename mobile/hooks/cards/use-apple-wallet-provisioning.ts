import { useMutation } from '@tanstack/react-query';
import type { CardWalletProvisioningResponse } from '@schnl/shared/validators/card-wallet-provisioning.validator';
import * as cardsApi from '@/services/api/cards/cards.api';

export function useAppleWalletProvisioning() {
  return useMutation<CardWalletProvisioningResponse, unknown, { cardId: string }>({
    mutationFn: ({ cardId }) => cardsApi.getAppleWalletProvisioning(cardId),
  });
}
