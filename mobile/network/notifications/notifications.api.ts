import { API_ROUTES } from '@brioela/shared/api';
import type {
  PushRegisterInput,
  PushUnregisterInput,
  PushRegisterResponse,
  PushUnregisterResponse,
} from '@brioela/shared/validators/notifications.validator';
import * as api from '@/network/core';

export async function registerPush(input: PushRegisterInput): Promise<PushRegisterResponse> {
  return api.post<PushRegisterResponse>(API_ROUTES.notifications['push.register'], input);
}

export async function unregisterPush(input: PushUnregisterInput): Promise<PushUnregisterResponse> {
  return api.post<PushUnregisterResponse>(API_ROUTES.notifications['push.unregister'], input);
}
