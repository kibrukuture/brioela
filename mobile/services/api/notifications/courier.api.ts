import { API_ROUTES } from '@schnl/shared/api';
import type { CourierMintJwtResponse } from '@schnl/shared/validators/notifications.validator';
import * as api from '@/services/api';

export async function mintJwt(): Promise<CourierMintJwtResponse> {
  return api.post<CourierMintJwtResponse>(API_ROUTES.notifications['courier.mint-jwt'], {});
}
