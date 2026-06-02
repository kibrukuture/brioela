import { post } from '@/services/api';
import { PAYMENTS_ROUTES } from '@schnl/shared/api/payments.routes';

/**
 * Triggers immediate subscription update on backend
 * Sends only userId (auto-added by apiClient interceptor)
 * Backend will:
 * 1. Get app_user_id from user record
 * 2. Call RevenueCat API to get CustomerInfo
 * 3. Transform and update database
 */
export async function triggerImmediateSubscriptionUpdate(): Promise<void> {
  // userId is automatically added by apiClient interceptor
  // No payload needed - backend gets userId from authenticated user
  console.log(
    '🔍 [Mobile] Calling immediate-update endpoint:',
    PAYMENTS_ROUTES['revenuecat.immediate-update']
  );
  try {
    const response = await post(PAYMENTS_ROUTES['revenuecat.immediate-update'], {});
    console.log('🔍 [Mobile] Immediate-update response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('🔍 [Mobile] Immediate-update error:', error);
    throw error;
  }
}
