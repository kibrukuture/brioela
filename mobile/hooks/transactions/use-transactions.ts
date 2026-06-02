import { useQuery } from '@tanstack/react-query';
import { getBankingTransactions } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export const useTransactions = (params?: { limit?: number; cursor?: string }) => {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.TRANSACTIONS(params),
    queryFn: () => getBankingTransactions(params),
  });
};
