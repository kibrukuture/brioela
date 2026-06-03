import { useQuery } from '@tanstack/react-query';
import { getEmbeddedWallet } from '@/network/banking/banking.api';
import { QUERY_KEYS } from '@/network/core/query-keys';
import type { EmbeddedWalletResponse } from '@brioela/shared/validators/banking.validator';

export function useEmbeddedWallet() {
  return useQuery<EmbeddedWalletResponse, Error>({
    queryKey: QUERY_KEYS.BANKING.EMBEDDED_WALLET,
    queryFn: getEmbeddedWallet,
  });
}
