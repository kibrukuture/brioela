import { useMutation } from '@tanstack/react-query';
import type {
  PeerToPeerPrecheckInput,
  PeerToPeerPrecheckResponse,
} from '@schnl/shared/validators/peer-to-peer-precheck.validator';
import { precheckPeerToPeerTransfer } from '@/services/api/banking/banking.api';

export function usePrecheckPeerToPeerTransfer() {
  return useMutation<PeerToPeerPrecheckResponse, Error, PeerToPeerPrecheckInput>({
    mutationFn: (input) => precheckPeerToPeerTransfer(input),
  });
}
