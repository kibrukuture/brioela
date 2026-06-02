import { useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerImmediateSubscriptionUpdate } from '@/services/api/payments/revenuecat';
import { QUERY_KEYS } from '@/lib/query-keys';

/**
 * React Query hook to trigger immediate subscription update
 * After mutation succeeds, automatically refetches user data
 * User table is single source of truth - UI updates from refetched data
 */
export function useTriggerSubscriptionUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerImmediateSubscriptionUpdate,
    onSuccess: () => {
      // Refetch user data (single source of truth)
      // This will update UI to show Pro status
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.CURRENT });
    },
    onError: (error) => {
      console.error('Failed to trigger immediate subscription update:', error);
      // Don't show error to user - webhook will handle it
    },
  });
}
