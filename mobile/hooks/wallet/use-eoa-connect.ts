import { useConnect } from 'thirdweb/react';
import { thirdwebClient } from '@/lib/clients/thirdweb';

export function useEoaConnect() {
  return useConnect({
    client: thirdwebClient,
  });
}
