import { useQuery } from '@tanstack/react-query';
import { getVirtualAccounts } from '@/network/banking/banking.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export function useVirtualAccounts() {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.ACCOUNTS,
    queryFn: getVirtualAccounts,
  });
}
