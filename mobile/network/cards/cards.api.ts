import { API_ROUTES } from '@brioela/shared/api';
import type {
  ListCardsResponse,
  FreezeCardResponse,
  SetCardLabelInput,
  SetCardLabelResponse,
  CardSpendingLimitsInput,
  CardSpendingLimitsResponse,
} from '@brioela/shared/validators/card.validator';
import type { CardWalletProvisioningResponse } from '@brioela/shared/validators/card-wallet-provisioning.validator';
import type {
  CreateCardOrderRequest,
  CreateCardOrderResponse,
  GetCardOrderResponse,
} from '@brioela/shared/validators/card-order.validator';
import * as api from '@/network/core';

export async function getCards() {
  return api.get<ListCardsResponse>(API_ROUTES.cards.list());
}

export async function createCardOrder(input: CreateCardOrderRequest) {
  return api.post<CreateCardOrderResponse>(API_ROUTES.cards.createOrder(), input);
}

export async function getCardOrder(orderId: string) {
  return api.get<GetCardOrderResponse>(API_ROUTES.cards.orderById(orderId));
}

export async function freezeCard(cardId: string) {
  return api.post<FreezeCardResponse>(API_ROUTES.cards.freeze(cardId));
}

export async function unfreezeCard(cardId: string) {
  return api.post<FreezeCardResponse>(API_ROUTES.cards.unfreeze(cardId));
}

export async function cancelCard(cardId: string) {
  return api.post<FreezeCardResponse>(API_ROUTES.cards.cancel(cardId));
}

export async function setCardLabel(cardId: string, input: SetCardLabelInput) {
  return api.patch<SetCardLabelResponse>(API_ROUTES.cards.label(cardId), input);
}

export async function updateCardSpendingLimits(cardId: string, input: CardSpendingLimitsInput) {
  return api.patch<CardSpendingLimitsResponse>(API_ROUTES.cards.spendingLimits(cardId), input);
}

export async function getCardSpendingLimits(cardId: string) {
  return api.get<CardSpendingLimitsResponse>(API_ROUTES.cards.spendingLimits(cardId));
}

export async function getAppleWalletProvisioning(cardId: string) {
  return api.get<CardWalletProvisioningResponse>(API_ROUTES.cards.appleWalletProvisioning(cardId));
}

export async function getGooglePayProvisioning(cardId: string) {
  return api.get<CardWalletProvisioningResponse>(API_ROUTES.cards.googlePayProvisioning(cardId));
}
