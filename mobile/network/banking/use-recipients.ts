import { useQuery } from '@tanstack/react-query';
import { getBankingRecipients } from '@/network/banking/banking.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export const useRecipients = () => {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.RECIPIENTS,
    queryFn: () => getBankingRecipients(),
  });
};
