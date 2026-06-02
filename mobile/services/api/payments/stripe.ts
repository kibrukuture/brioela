import * as api from '@/services/api';
import { API_ROUTES } from '@schnl/shared/api';
import type {
  CreateTopupIntentRequest,
  CreateTopupIntentResponse,
} from '@schnl/shared/validators/stripe.validator';

interface StripeBillingPortalResponse {
  url: string;
}

export async function createStripeBillingSession(): Promise<string> {
  const response = await api.post<StripeBillingPortalResponse>(
    API_ROUTES.payments['stripe.create-billing-portal-session']
  );

  return response.url;
}

export async function createStripeTopupIntent(
  input: CreateTopupIntentRequest
): Promise<CreateTopupIntentResponse> {
  return api.post<CreateTopupIntentResponse>(
    API_ROUTES.payments['stripe.create-topup-intent'],
    input
  );
}
