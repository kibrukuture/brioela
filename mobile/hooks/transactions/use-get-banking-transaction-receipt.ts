import { useMutation } from '@tanstack/react-query';
import { getBankingTransactionReceipt } from '@/services/api/banking/banking.api';

export function useGetBankingTransactionReceipt() {
  return useMutation({
    mutationFn: (id: string) => getBankingTransactionReceipt(id),
  });
}
