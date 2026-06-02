import { useMutation } from '@tanstack/react-query';
import type {
  CreatePeerToPeerTransferInput,
  CreatePeerToPeerTransferResponse,
} from '@schnl/shared/validators/peer-to-peer-transfer.validator';
import { createPeerToPeerTransfer } from '@/services/api/banking/banking.api';

export function useCreatePeerToPeerTransfer() {
  return useMutation<CreatePeerToPeerTransferResponse, Error, CreatePeerToPeerTransferInput>({
    mutationFn: (input) => createPeerToPeerTransfer(input),
  });
}
