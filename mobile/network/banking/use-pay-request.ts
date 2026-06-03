import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/network/core/query-keys';
import { getPayRequest } from '@/network/banking/banking.api';

export function usePayRequest(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.PAY_REQUEST(id ?? 'missing'),
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) {
        throw new Error('Missing pay request id');
      }
      return getPayRequest(id);
    },
  });
}
