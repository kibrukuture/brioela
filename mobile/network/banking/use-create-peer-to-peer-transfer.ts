import { useMutation } from '@tanstack/react-query';
import type {
  CreatePeerToPeerTransferInput,
  CreatePeerToPeerTransferResponse,
} from '@brioela/shared/validators/peer-to-peer-transfer.validator';
import { createPeerToPeerTransfer } from '@/network/banking/banking.api';

export function useCreatePeerToPeerTransfer() {
  return useMutation<CreatePeerToPeerTransferResponse, Error, CreatePeerToPeerTransferInput>({
    mutationFn: (input) => createPeerToPeerTransfer(input),
  });
}
