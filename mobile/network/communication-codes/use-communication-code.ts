import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  SetCommunicationCodeInput,
  CommunicationCodeResponse,
} from '@brioela/shared/validators/communication-code.validator';
import * as communicationCodesApi from '@/network/communication-codes/communication-codes.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export function useCommunicationCode() {
  return useQuery<CommunicationCodeResponse | null>({
    queryKey: QUERY_KEYS.COMMUNICATION_CODE.CURRENT,
    queryFn: () => communicationCodesApi.getCommunicationCode(),
  });
}

export function useUpdateCommunicationCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SetCommunicationCodeInput) =>
      communicationCodesApi.updateCommunicationCode(input),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.COMMUNICATION_CODE.CURRENT, data);
    },
  });
}
