import { useQuery } from '@tanstack/react-query';
import { getKycLink } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useKycLink() {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.KYC_LINK,
    queryFn: getKycLink,
  });
}
