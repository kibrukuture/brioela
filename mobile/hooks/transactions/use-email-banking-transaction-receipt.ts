import { useMutation } from '@tanstack/react-query';
import { emailBankingTransactionReceipt } from '@/services/api/banking/banking.api';

export function useEmailBankingTransactionReceipt() {
  return useMutation({
    mutationFn: (id: string) => emailBankingTransactionReceipt(id),
  });
}
