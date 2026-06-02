import { useQuery } from '@tanstack/react-query';
import { getBankingLimits } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export const useBankingLimits = () => {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.LIMITS,
    queryFn: () => getBankingLimits(),
  });
};
