import { useQuery } from '@tanstack/react-query';
import { getEmbeddedWallet } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { EmbeddedWalletResponse } from '@schnl/shared/validators/banking.validator';

export function useEmbeddedWallet() {
  return useQuery<EmbeddedWalletResponse, Error>({
    queryKey: QUERY_KEYS.BANKING.EMBEDDED_WALLET,
    queryFn: getEmbeddedWallet,
  });
}
