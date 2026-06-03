import { useQuery } from '@tanstack/react-query';
import { getSessionStatus } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { SessionStatusResponse } from '@brioela/shared/validators/banking.validator';

export function useSessionStatus() {
  return useQuery<SessionStatusResponse, Error>({
    queryKey: QUERY_KEYS.BANKING.SESSION_STATUS,
    queryFn: getSessionStatus,
  });
}
