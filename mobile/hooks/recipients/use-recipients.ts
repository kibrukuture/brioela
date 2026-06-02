import { useQuery } from '@tanstack/react-query';
import { getBankingRecipients } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export const useRecipients = () => {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.RECIPIENTS,
    queryFn: () => getBankingRecipients(),
  });
};
