import { useQuery } from '@tanstack/react-query';
import { getKycLink } from '@/network/banking/banking.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export function useKycLink() {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.KYC_LINK,
    queryFn: getKycLink,
  });
}
