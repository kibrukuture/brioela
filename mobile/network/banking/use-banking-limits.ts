import { useQuery } from '@tanstack/react-query';
import { getBankingLimits } from '@/network/banking/banking.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export const useBankingLimits = () => {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.LIMITS,
    queryFn: () => getBankingLimits(),
  });
};
