import { useMutation } from '@tanstack/react-query';
import { generateBankStatement } from '@/network/banking/banking.api';

export function useGenerateStatement() {
  return useMutation({
    mutationFn: ({ startDate, endDate }: { startDate: string; endDate: string }) =>
      generateBankStatement(startDate, endDate),
  });
}
