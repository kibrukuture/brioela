import { useQuery } from '@tanstack/react-query';
import { getBankingBalances } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export const useBalances = () => {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.BALANCES,
    queryFn: () => getBankingBalances(),
  });
};
