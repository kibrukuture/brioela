import { API_ROUTES } from '@brioela/shared/api';
import type {
  UpdateCardControlsInput,
  CardControlsState,
} from '@brioela/shared/validators/card-controls.validator';
import * as api from '@/services/api';

export async function getCardControls(cardId: string): Promise<CardControlsState> {
  return api.get<CardControlsState>(API_ROUTES.cardControls.byCardId(cardId));
}

export async function updateCardControls(
  input: UpdateCardControlsInput
): Promise<CardControlsState> {
  return api.patch<CardControlsState>(API_ROUTES.cardControls.byCardId(input.cardId), input);
}
