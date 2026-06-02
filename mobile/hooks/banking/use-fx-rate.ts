import { useQuery } from '@tanstack/react-query';
import { getBankingFxRate } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export const useFxRate = (params: { from: string; to: string }) => {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.FX_RATE(params),
    queryFn: () => getBankingFxRate(params),
    enabled: params.from.length > 0 && params.to.length > 0,
  });
};
