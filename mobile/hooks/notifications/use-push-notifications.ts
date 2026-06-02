import { useMutation } from '@tanstack/react-query';
import type {
  PushRegisterInput,
  PushUnregisterInput,
} from '@schnl/shared/validators/notifications.validator';
import * as notificationsApi from '@/services/api/notifications/notifications.api';

export function useRegisterPush() {
  return useMutation({
    mutationFn: (input: PushRegisterInput) => notificationsApi.registerPush(input),
  });
}

export function useUnregisterPush() {
  return useMutation({
    mutationFn: (input: PushUnregisterInput) => notificationsApi.unregisterPush(input),
  });
}
