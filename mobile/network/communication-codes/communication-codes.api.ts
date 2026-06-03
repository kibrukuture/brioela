import { API_ROUTES } from '@brioela/shared/api';
import type {
  SetCommunicationCodeInput,
  CommunicationCodeResponse,
} from '@brioela/shared/validators/communication-code.validator';
import * as api from '@/network/core';

export async function updateCommunicationCode(
  input: SetCommunicationCodeInput
): Promise<CommunicationCodeResponse> {
  return api.post<CommunicationCodeResponse>(API_ROUTES.communicationCode.update(), input);
}

export async function getCommunicationCode(): Promise<CommunicationCodeResponse | null> {
  return api.get<CommunicationCodeResponse | null>(API_ROUTES.communicationCode.get());
}
