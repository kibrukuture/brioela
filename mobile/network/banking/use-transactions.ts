import { useQuery } from '@tanstack/react-query';
import { getBankingTransactions } from '@/network/banking/banking.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export const useTransactions = (params?: { limit?: number; cursor?: string }) => {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.TRANSACTIONS(params),
    queryFn: () => getBankingTransactions(params),
  });
};
