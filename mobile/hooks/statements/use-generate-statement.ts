import { useMutation } from '@tanstack/react-query';
import { generateBankStatement } from '@/services/api/banking/banking.api';

export function useGenerateStatement() {
  return useMutation({
    mutationFn: ({ startDate, endDate }: { startDate: string; endDate: string }) =>
      generateBankStatement(startDate, endDate),
  });
}
