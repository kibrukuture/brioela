import { useQuery } from '@tanstack/react-query';
import { getVirtualAccounts } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useVirtualAccounts() {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.ACCOUNTS,
    queryFn: getVirtualAccounts,
  });
}
