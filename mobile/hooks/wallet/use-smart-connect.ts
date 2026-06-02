import { useConnect } from 'thirdweb/react';
import { thirdwebClient } from '@/lib/clients/thirdweb';
import { polygon } from 'thirdweb/chains';

export function useSmartConnect() {
  return useConnect({
    client: thirdwebClient,
    accountAbstraction: {
      chain: polygon,
      sponsorGas: true,
    },
  });
}
