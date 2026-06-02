import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { getCustomerAddress } from '@/services/api/banking/banking.api';

export function useCustomerAddress() {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.CUSTOMER_ADDRESS,
    queryFn: getCustomerAddress,
  });
}
