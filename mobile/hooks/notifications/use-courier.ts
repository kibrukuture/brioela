import { useMutation } from '@tanstack/react-query';
import type { CourierMintJwtResponse } from '@schnl/shared/validators/notifications.validator';
import { mintJwt as apiMintJwt } from '@/services/api/notifications/courier.api';

export function useMintCourierJwt() {
  return useMutation<CourierMintJwtResponse, unknown, void>({
    mutationFn: () => apiMintJwt(),
  });
}
