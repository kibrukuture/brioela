import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/network/core/query-keys';
import { getCustomerAddress } from '@/network/banking/banking.api';

export function useCustomerAddress() {
  return useQuery({
    queryKey: QUERY_KEYS.BANKING.CUSTOMER_ADDRESS,
    queryFn: getCustomerAddress,
  });
}
