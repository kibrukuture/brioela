import { useQuery } from '@tanstack/react-query';
import { getBankingBalances } from '@/network/banking/banking.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export const useBalances = () => {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.BALANCES,
    queryFn: () => getBankingBalances(),
  });
};
