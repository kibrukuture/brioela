import { useQuery } from '@tanstack/react-query';
import { getBankingRecipient } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export const useRecipient = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.RECIPIENT_BY_ID(id),
    queryFn: () => getBankingRecipient(id),
    enabled: id.length > 0,
  });
};
